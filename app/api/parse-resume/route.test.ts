import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";
import { createChainable, createSupabaseMock } from "@/tests/helpers/supabase";

const pdfState = vi.hoisted(() => ({
  behavior: "success" as "success" | "empty" | "error",
  rawText:
    "John Smith\njohn.smith@example.com\n(555) 123-4567\nSan Francisco, CA\n\nSummary\nExperienced Software Engineer skilled in React and TypeScript.",
  errorMessage: "Corrupt PDF file",
}));

vi.mock("pdf2json", () => {
  class MockPDFParser {
    private handlers: Record<string, (arg?: unknown) => void> = {};
    on(event: string, cb: (arg?: unknown) => void) {
      this.handlers[event] = cb;
    }
    parseBuffer(_buffer: Buffer) {
      queueMicrotask(() => {
        if (pdfState.behavior === "error") {
          this.handlers["pdfParser_dataError"]?.({
            parserError: pdfState.errorMessage,
          });
        } else {
          this.handlers["pdfParser_dataReady"]?.();
        }
      });
    }
    getRawTextContent() {
      return pdfState.behavior === "empty" ? "" : pdfState.rawText;
    }
  }
  return { default: MockPDFParser };
});

vi.mock("uuid", () => ({ v4: () => "mock-uuid" }));

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient,
}));

import { POST } from "./route";

function makeFormDataRequest(file: File | null): NextRequest {
  const formData = new FormData();
  if (file) {
    formData.append("resume", file);
  }
  return { formData: async () => formData } as unknown as NextRequest;
}

function makePdfFile(name = "resume.pdf") {
  return new File(["%PDF-1.4 fake pdf bytes"], name, { type: "application/pdf" });
}

describe("POST /api/parse-resume", () => {
  let supabase: ReturnType<typeof createSupabaseMock>;
  let uploadSpy: ReturnType<typeof vi.fn>;
  let insertSpy: ReturnType<typeof vi.fn>;
  let profileUpdateSpy: ReturnType<typeof vi.fn>;
  let insertChain: ReturnType<typeof createChainable<{ data: unknown; error: unknown }>>;
  let profileUpdateChain: ReturnType<typeof createChainable<{ error: unknown }>>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    pdfState.behavior = "success";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.GEMINI_API_KEY;

    uploadSpy = vi.fn().mockResolvedValue({ data: { path: "mock-path" }, error: null });
    insertChain = createChainable({
      data: { id: "resume-db-id" },
      error: null,
    });
    insertSpy = vi.fn(() => insertChain);
    profileUpdateChain = createChainable({ error: null });
    profileUpdateSpy = vi.fn(() => profileUpdateChain);

    supabase = createSupabaseMock();
    supabase.storage.from.mockImplementation(() => ({ upload: uploadSpy }));
    supabase.from.mockImplementation((table: string) => {
      if (table === "resumes") return { insert: insertSpy };
      if (table === "profiles") return { update: profileUpdateSpy };
      throw new Error(`Unexpected table: ${table}`);
    });
    createClient.mockResolvedValue(supabase);

    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 401 when the user is not authenticated", async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const res = await POST(makeFormDataRequest(makePdfFile()));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when no resume file is provided", async () => {
    const res = await POST(makeFormDataRequest(null));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ error: "No resume file provided" });
  });

  it("returns 500 when the storage upload fails", async () => {
    uploadSpy.mockResolvedValue({ data: null, error: { message: "bucket error" } });

    const res = await POST(makeFormDataRequest(makePdfFile()));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({ error: "Failed to upload resume" });
  });

  it("returns 500 with the parser error message when PDF parsing fails", async () => {
    pdfState.behavior = "error";

    const res = await POST(makeFormDataRequest(makePdfFile()));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe(pdfState.errorMessage);
  });

  it("returns 500 when the PDF contains no extractable text", async () => {
    pdfState.behavior = "empty";

    const res = await POST(makeFormDataRequest(makePdfFile()));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("No text content could be extracted from the PDF");
  });

  it("falls back to heuristic parsing when GEMINI_API_KEY is not configured", async () => {
    const res = await POST(makeFormDataRequest(makePdfFile()));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toBe("Resume uploaded and parsed successfully");
    expect(fetchMock).not.toHaveBeenCalled();

    const insertedPayload = insertSpy.mock.calls[0][0];
    expect(insertedPayload.user_id).toBe("user-1");
    expect(insertedPayload.file_name).toBe("resume.pdf");
    expect(insertedPayload.file_path).toBe("user-1/mock-uuid.pdf");
    expect(insertedPayload.parsed_data.email).toBe("john.smith@example.com");
    expect(insertedPayload.parsed_data.fullName).toBe("John Smith");

    const profilePayload = profileUpdateSpy.mock.calls[0][0];
    expect(profilePayload.full_name).toBe("John Smith");
    expect(profilePayload.email).toBe("john.smith@example.com");
    expect(profileUpdateChain.eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("uses the Gemini API to parse the resume when GEMINI_API_KEY is configured", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";

    const geminiJson = {
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "555-9999",
      location: "London, UK",
      summary: "Pioneering computer scientist.",
      skills: ["Mathematics", "Analytical Engines"],
      workExperience: [
        { company: "Analytical Engine Co", jobTitle: "Mathematician", duration: "1840-1850" },
      ],
      education: [],
      projects: [],
      certifications: [],
      links: ["https://example.com/ada"],
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          { content: { parts: [{ text: JSON.stringify(geminiJson) }] } },
        ],
      }),
    });

    const res = await POST(makeFormDataRequest(makePdfFile()));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("gemini-2.5-flash:generateContent");
    expect(url).toContain("key=test-gemini-key");

    const insertedPayload = insertSpy.mock.calls[0][0];
    expect(insertedPayload.parsed_data.fullName).toBe("Ada Lovelace");
    expect(insertedPayload.parsed_data.email).toBe("ada@example.com");

    const profilePayload = profileUpdateSpy.mock.calls[0][0];
    expect(profilePayload.full_name).toBe("Ada Lovelace");
    expect(profilePayload.current_company).toBe("Analytical Engine Co");
    expect(profilePayload.current_job_title).toBe("Mathematician");
  });

  it("falls back to heuristics when the Gemini API request fails", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    const res = await POST(makeFormDataRequest(makePdfFile()));
    const json = await res.json();

    expect(res.status).toBe(200);
    const insertedPayload = insertSpy.mock.calls[0][0];
    expect(insertedPayload.parsed_data.fullName).toBe("John Smith");
    expect(insertedPayload.parsed_data.email).toBe("john.smith@example.com");
  });

  it("returns 500 when saving the parsed resume to the database fails", async () => {
    insertChain = createChainable({ data: null, error: { message: "insert failed" } });
    insertSpy = vi.fn(() => insertChain);
    supabase.from.mockImplementation((table: string) => {
      if (table === "resumes") return { insert: insertSpy };
      if (table === "profiles") return { update: profileUpdateSpy };
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await POST(makeFormDataRequest(makePdfFile()));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({ error: "Failed to save resume data" });
  });

  it("still returns success when the profile update fails (non-fatal)", async () => {
    profileUpdateChain = createChainable({ error: { message: "profile update failed" } });
    profileUpdateSpy = vi.fn(() => profileUpdateChain);
    supabase.from.mockImplementation((table: string) => {
      if (table === "resumes") return { insert: insertSpy };
      if (table === "profiles") return { update: profileUpdateSpy };
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await POST(makeFormDataRequest(makePdfFile()));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toBe("Resume uploaded and parsed successfully");
  });
});
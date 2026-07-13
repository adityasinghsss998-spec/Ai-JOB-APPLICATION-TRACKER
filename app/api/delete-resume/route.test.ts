import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { createChainable, createSupabaseMock } from "@/tests/helpers/supabase";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient,
}));

import { POST } from "./route";

function makeRequest(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest;
}

describe("POST /api/delete-resume", () => {
  let supabase: ReturnType<typeof createSupabaseMock>;
  let deleteChain: ReturnType<typeof createChainable<{ error: unknown }>>;
  let profileUpdateChain: ReturnType<typeof createChainable<{ error: unknown }>>;
  let storageRemove: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    deleteChain = createChainable({ error: null });
    profileUpdateChain = createChainable({ error: null });
    storageRemove = vi.fn().mockResolvedValue({ error: null });

    supabase = createSupabaseMock();
    supabase.storage.from.mockImplementation(() => ({
      remove: storageRemove,
    }));
    supabase.from.mockImplementation((table: string) => {
      if (table === "resumes") {
        return { delete: vi.fn(() => deleteChain) };
      }
      if (table === "profiles") {
        return { update: vi.fn(() => profileUpdateChain) };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    createClient.mockResolvedValue(supabase);
  });

  it("returns 401 when the user is not authenticated", async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const res = await POST(makeRequest({ resumeId: "resume-1" }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when resumeId is missing", async () => {
    const res = await POST(makeRequest({}));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ error: "Resume ID is required" });
  });

  it("deletes the resume and clears profile fields without touching storage when filePath is absent", async () => {
    const res = await POST(makeRequest({ resumeId: "resume-1" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ message: "Resume deleted successfully" });
    expect(storageRemove).not.toHaveBeenCalled();
    expect(deleteChain.eq).toHaveBeenCalledWith("id", "resume-1");
    expect(deleteChain.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("removes the file from storage when filePath is provided", async () => {
    const res = await POST(
      makeRequest({ resumeId: "resume-1", filePath: "user-1/resume.pdf" })
    );

    expect(res.status).toBe(200);
    expect(storageRemove).toHaveBeenCalledWith(["user-1/resume.pdf"]);
  });

  it("continues deleting the DB record even when storage removal fails", async () => {
    storageRemove.mockResolvedValue({ error: { message: "not found" } });

    const res = await POST(
      makeRequest({ resumeId: "resume-1", filePath: "user-1/resume.pdf" })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ message: "Resume deleted successfully" });
  });

  it("returns 500 when the database deletion fails", async () => {
    deleteChain = createChainable({ error: { message: "db error" } });
    supabase.from.mockImplementation((table: string) => {
      if (table === "resumes") return { delete: vi.fn(() => deleteChain) };
      if (table === "profiles") return { update: vi.fn(() => profileUpdateChain) };
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await POST(makeRequest({ resumeId: "resume-1" }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({ error: "Failed to delete database record" });
  });

  it("clears only the current profile fields (not work_experience/education/certifications/links)", async () => {
    let updatePayload: Record<string, unknown> | undefined;
    supabase.from.mockImplementation((table: string) => {
      if (table === "resumes") return { delete: vi.fn(() => deleteChain) };
      if (table === "profiles") {
        return {
          update: vi.fn((payload: Record<string, unknown>) => {
            updatePayload = payload;
            return profileUpdateChain;
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    await POST(makeRequest({ resumeId: "resume-1" }));

    expect(updatePayload).toEqual({
      full_name: null,
      email: null,
      phone: null,
      location: null,
      summary: null,
      skills: null,
      current_company: null,
      current_job_title: null,
      projects: null,
    });
    expect(updatePayload).not.toHaveProperty("work_experience");
    expect(updatePayload).not.toHaveProperty("education");
    expect(updatePayload).not.toHaveProperty("certifications");
    expect(updatePayload).not.toHaveProperty("links");
  });

  it("still succeeds when clearing the profile fails (non-fatal)", async () => {
    profileUpdateChain = createChainable({ error: { message: "profile error" } });
    supabase.from.mockImplementation((table: string) => {
      if (table === "resumes") return { delete: vi.fn(() => deleteChain) };
      if (table === "profiles") return { update: vi.fn(() => profileUpdateChain) };
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await POST(makeRequest({ resumeId: "resume-1" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ message: "Resume deleted successfully" });
  });

  it("returns 500 when the request body cannot be parsed", async () => {
    const badRequest = {
      json: async () => {
        throw new Error("invalid json");
      },
    } as unknown as NextRequest;

    const res = await POST(badRequest);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({ error: "Internal Server Error" });
  });
});
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

describe("POST /api/update-profile", () => {
  let supabase: ReturnType<typeof createSupabaseMock>;
  let updateChain: ReturnType<typeof createChainable<{ error: unknown }>>;
  let updateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    updateChain = createChainable({ error: null });
    updateSpy = vi.fn(() => updateChain);

    supabase = createSupabaseMock();
    supabase.from.mockImplementation((table: string) => {
      if (table === "profiles") return { update: updateSpy };
      throw new Error(`Unexpected table: ${table}`);
    });

    createClient.mockResolvedValue(supabase);
  });

  it("returns 401 when the user is not authenticated", async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const res = await POST(makeRequest({}));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("updates the allowed profile fields and returns success", async () => {
    const body = {
      full_name: "Jane Doe",
      email: "jane@example.com",
      phone: "555-1234",
      location: "Remote",
      summary: "Experienced engineer",
      skills: ["React", "TypeScript"],
      current_company: "Acme",
      current_job_title: "Senior Engineer",
      projects: [{ title: "Project A" }],
    };

    const res = await POST(makeRequest(body));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ message: "Profile updated successfully" });
    expect(updateSpy).toHaveBeenCalledTimes(1);

    const payload = updateSpy.mock.calls[0][0];
    expect(payload).toMatchObject(body);
    expect(typeof payload.updated_at).toBe("string");
    expect(updateChain.eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("does not forward removed legacy fields even if present in the request body", async () => {
    const body = {
      full_name: "Jane Doe",
      work_experience: [{ company: "Old Co", jobTitle: "Dev" }],
      education: [{ school: "Old University" }],
      certifications: ["AWS Certified"],
      links: ["https://example.com"],
    };

    await POST(makeRequest(body));

    const payload = updateSpy.mock.calls[0][0];
    expect(payload).not.toHaveProperty("work_experience");
    expect(payload).not.toHaveProperty("education");
    expect(payload).not.toHaveProperty("certifications");
    expect(payload).not.toHaveProperty("links");
  });

  it("returns 500 when the Supabase update fails", async () => {
    updateChain = createChainable({ error: { message: "update failed" } });
    updateSpy = vi.fn(() => updateChain);
    supabase.from.mockImplementation((table: string) => {
      if (table === "profiles") return { update: updateSpy };
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await POST(makeRequest({ full_name: "Jane" }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({ error: "Failed to update profile details" });
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
import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainable, createSupabaseMock } from "@/tests/helpers/supabase";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
const { profileDetailsFormSpy, profileCompletenessCardSpy } = vi.hoisted(() => ({
  profileDetailsFormSpy: vi.fn(),
  profileCompletenessCardSpy: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));
vi.mock("@/components/ResumeUploadForm", () => ({
  default: () => <div data-testid="resume-upload-form" />,
}));
vi.mock("@/components/ProfileCompletenessCard", () => ({
  default: (props: unknown) => {
    profileCompletenessCardSpy(props);
    return <div data-testid="profile-completeness-card" />;
  },
}));
vi.mock("@/components/ProfileDetailsForm", () => ({
  default: (props: unknown) => {
    profileDetailsFormSpy(props);
    return <div data-testid="profile-details-form" />;
  },
}));

import ProfilePage from "./page";

const EMPTY_PROFILE = {
  full_name: null,
  email: null,
  phone: null,
  location: null,
  summary: null,
  skills: null,
  current_company: null,
  current_job_title: null,
  projects: null,
};

describe("ProfilePage", () => {
  let supabase: ReturnType<typeof createSupabaseMock>;
  let profileSelectSpy: ReturnType<typeof vi.fn>;
  let profileUpdateSpy: ReturnType<typeof vi.fn>;
  let resumesSelectSpy: ReturnType<typeof vi.fn>;

  function configureSupabase({
    initialProfile,
    refetchProfile,
    resumes,
  }: {
    initialProfile: Record<string, unknown> | null;
    refetchProfile?: Record<string, unknown> | null;
    resumes: Array<{ id: string }> | null;
  }) {
    supabase = createSupabaseMock();

    let profileSelectCallCount = 0;
    profileSelectSpy = vi.fn(() => {
      profileSelectCallCount += 1;
      const data = profileSelectCallCount === 1 ? initialProfile : refetchProfile ?? initialProfile;
      return createChainable({ data });
    });
    profileUpdateSpy = vi.fn(() => createChainable({ error: null }));
    resumesSelectSpy = vi.fn(() => createChainable({ data: resumes }));

    supabase.from.mockImplementation((table: string) => {
      if (table === "profiles") return { select: profileSelectSpy, update: profileUpdateSpy };
      if (table === "resumes") return { select: resumesSelectSpy };
      throw new Error(`Unexpected table: ${table}`);
    });

    createClient.mockResolvedValue(supabase);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    redirect.mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    });
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it("redirects unauthenticated users to /sign-in", async () => {
    supabase = createSupabaseMock({ user: null });
    createClient.mockResolvedValue(supabase);

    await expect(ProfilePage()).rejects.toThrow("REDIRECT:/sign-in");
  });

  it("does not clear the profile when the user already has resumes", async () => {
    configureSupabase({
      initialProfile: { ...EMPTY_PROFILE, full_name: "Jane Doe" },
      resumes: [{ id: "resume-1" }],
    });

    render(await ProfilePage());

    expect(profileUpdateSpy).not.toHaveBeenCalled();
    expect(profileSelectSpy).toHaveBeenCalledTimes(1);
    expect(profileDetailsFormSpy).toHaveBeenCalledWith({
      initialProfile: { ...EMPTY_PROFILE, full_name: "Jane Doe" },
    });
  });

  it("clears stale profile data when there are no resumes but the profile has data", async () => {
    const staleProfile = { ...EMPTY_PROFILE, full_name: "Jane Doe", email: "jane@example.com" };
    configureSupabase({
      initialProfile: staleProfile,
      refetchProfile: EMPTY_PROFILE,
      resumes: [],
    });

    render(await ProfilePage());

    expect(profileUpdateSpy).toHaveBeenCalledTimes(1);
    expect(profileUpdateSpy).toHaveBeenCalledWith(EMPTY_PROFILE);
    expect(profileSelectSpy).toHaveBeenCalledTimes(2);
    // The form should receive the freshly re-fetched (cleared) profile.
    expect(profileDetailsFormSpy).toHaveBeenCalledWith({ initialProfile: EMPTY_PROFILE });
  });

  it("does not clear the profile when there are no resumes and the profile is already empty", async () => {
    configureSupabase({ initialProfile: EMPTY_PROFILE, resumes: null });

    render(await ProfilePage());

    expect(profileUpdateSpy).not.toHaveBeenCalled();
    expect(profileSelectSpy).toHaveBeenCalledTimes(1);
  });

  it("passes only initialProfile to ProfileDetailsForm (no legacy missingJobId props)", async () => {
    configureSupabase({
      initialProfile: { ...EMPTY_PROFILE, full_name: "Jane Doe" },
      resumes: [{ id: "resume-1" }],
    });

    render(await ProfilePage());

    const props = profileDetailsFormSpy.mock.calls[0][0];
    expect(Object.keys(props)).toEqual(["initialProfile"]);
    expect(props).not.toHaveProperty("missingJobId");
    expect(props).not.toHaveProperty("missingFields");
    expect(props).not.toHaveProperty("jobTitle");
    expect(props).not.toHaveProperty("companyName");
  });

  it("shows the AI active banner when GEMINI_API_KEY is configured", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    configureSupabase({
      initialProfile: { ...EMPTY_PROFILE, full_name: "Jane Doe" },
      resumes: [{ id: "resume-1" }],
    });

    render(await ProfilePage());

    expect(screen.getByText("AI-Powered Extraction Active")).toBeInTheDocument();
    expect(
      screen.queryByText("AI-Powered Extraction Disabled (Using Fallback Heuristics)")
    ).not.toBeInTheDocument();
  });

  it("shows the fallback heuristics banner when GEMINI_API_KEY is not configured", async () => {
    configureSupabase({
      initialProfile: { ...EMPTY_PROFILE, full_name: "Jane Doe" },
      resumes: [{ id: "resume-1" }],
    });

    render(await ProfilePage());

    expect(
      screen.getByText("AI-Powered Extraction Disabled (Using Fallback Heuristics)")
    ).toBeInTheDocument();
  });

  it("renders ProfileCompletenessCard only when the profile has data", async () => {
    configureSupabase({
      initialProfile: { ...EMPTY_PROFILE, full_name: "Jane Doe" },
      resumes: [{ id: "resume-1" }],
    });

    render(await ProfilePage());

    expect(screen.getByTestId("profile-completeness-card")).toBeInTheDocument();
  });

  it("hides ProfileCompletenessCard when the profile is empty", async () => {
    configureSupabase({ initialProfile: EMPTY_PROFILE, resumes: [{ id: "resume-1" }] });

    render(await ProfilePage());

    expect(screen.queryByTestId("profile-completeness-card")).not.toBeInTheDocument();
  });
});
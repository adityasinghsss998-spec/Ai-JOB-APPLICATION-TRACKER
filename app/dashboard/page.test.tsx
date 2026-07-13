import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createChainable, createSupabaseMock } from "@/tests/helpers/supabase";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/app/auth/actions", () => ({ signOut: vi.fn() }));
vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));

import DashboardPage from "./page";

describe("DashboardPage", () => {
  let supabase: ReturnType<typeof createSupabaseMock>;
  let profileSelectSpy: ReturnType<typeof vi.fn>;
  let jobApplicationsSelectSpy: ReturnType<typeof vi.fn>;

  function configureSupabase({
    profile = { full_name: "Jane Doe", email: "jane@example.com" } as
      | Record<string, unknown>
      | null,
    count = 3,
    user = {
      id: "user-1",
      email: "jane@user.com",
      user_metadata: { full_name: "Meta Jane" },
    },
  }: {
    profile?: Record<string, unknown> | null;
    count?: number | null;
    user?: Record<string, unknown> | null;
  } = {}) {
    supabase = createSupabaseMock({ user: user as any });

    const profileChain = createChainable({ data: profile });
    profileSelectSpy = vi.fn(() => profileChain);

    const jobApplicationsChain = createChainable({ count });
    jobApplicationsSelectSpy = vi.fn(() => jobApplicationsChain);

    supabase.from.mockImplementation((table: string) => {
      if (table === "profiles") return { select: profileSelectSpy };
      if (table === "job_applications") return { select: jobApplicationsSelectSpy };
      throw new Error(`Unexpected table: ${table}`);
    });

    createClient.mockResolvedValue(supabase);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    redirect.mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    });
  });

  it("redirects unauthenticated users to /sign-in", async () => {
    configureSupabase({ user: null });

    await expect(DashboardPage()).rejects.toThrow("REDIRECT:/sign-in");
    expect(redirect).toHaveBeenCalledWith("/sign-in");
  });

  it("greets the user using the profile full_name when available", async () => {
    configureSupabase({ profile: { full_name: "Jane Doe", email: "jane@example.com" } });

    render(await DashboardPage());

    expect(
      screen.getByRole("heading", { name: "Welcome back, Jane" })
    ).toBeInTheDocument();
  });

  it("falls back to user_metadata.full_name when the profile has no name", async () => {
    configureSupabase({
      profile: { full_name: null, email: null },
      user: { id: "user-1", email: "jane@user.com", user_metadata: { full_name: "Meta Jane" } },
    });

    render(await DashboardPage());

    expect(
      screen.getByRole("heading", { name: "Welcome back, Meta" })
    ).toBeInTheDocument();
  });

  it("falls back to the user's email when no name is available anywhere", async () => {
    configureSupabase({
      profile: { full_name: null, email: null },
      user: { id: "user-1", email: "plain@user.com", user_metadata: {} },
    });

    render(await DashboardPage());

    expect(
      screen.getByRole("heading", { name: "Welcome back, plain@user.com" })
    ).toBeInTheDocument();
  });

  it("displays the total application count from job_applications", async () => {
    configureSupabase({ count: 7 });

    render(await DashboardPage());

    expect(screen.getByText("7")).toBeInTheDocument();
    expect(jobApplicationsSelectSpy).toHaveBeenCalledWith("*", {
      count: "exact",
      head: true,
    });
  });

  it("displays 0 applications when count is null", async () => {
    configureSupabase({ count: null });

    render(await DashboardPage());

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("shows the profile email when present, else the auth user email", async () => {
    configureSupabase({
      profile: { full_name: "Jane Doe", email: "profile@example.com" },
      user: { id: "user-1", email: "auth@example.com", user_metadata: {} },
    });

    render(await DashboardPage());

    expect(screen.getByText("profile@example.com")).toBeInTheDocument();
  });

  it("queries only the full_name and email profile columns", async () => {
    configureSupabase();

    render(await DashboardPage());

    expect(profileSelectSpy).toHaveBeenCalledWith("full_name, email");
  });

  it("renders inside DashboardLayout and shows the Active status", async () => {
    configureSupabase();

    render(await DashboardPage());

    expect(screen.getByTestId("dashboard-layout")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });
});
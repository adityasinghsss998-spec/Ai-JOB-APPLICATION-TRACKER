import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Sidebar: ({ children }: { children: ReactNode }) => <nav data-testid="sidebar">{children}</nav>,
  SidebarHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: ReactNode }) => <ul>{children}</ul>,
  SidebarMenuItem: ({ children }: { children: ReactNode }) => <li>{children}</li>,
  // The real SidebarMenuButton accepts a `render` prop that is the JSX element
  // to render (typically a <Link>). We mimic that behaviour here.
  SidebarMenuButton: ({ render }: { render?: ReactNode }) => <>{render ?? null}</>,
  SidebarTrigger: () => <button aria-label="Toggle Sidebar" />,
  SidebarRail: () => null,
  useSidebar: () => ({ state: "expanded" }),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ComponentProps<"button">) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("@hugeicons/react", () => ({
  HugeiconsIcon: () => <span data-testid="icon" />,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import DashboardLayout from "./DashboardLayout";

describe("DashboardLayout", () => {
  it("renders its children", () => {
    render(
      <DashboardLayout>
        <p>Page content</p>
      </DashboardLayout>
    );

    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("renders the current navigation items with correct hrefs", () => {
    render(
      <DashboardLayout>
        <div />
      </DashboardLayout>
    );

    expect(screen.getByRole("link", { name: "Jobs" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Resume" })).toHaveAttribute(
      "href",
      "/dashboard/resume"
    );
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute(
      "href",
      "/dashboard/profile"
    );
  });

  it("does not render navigation items that were removed from the sidebar", () => {
    render(
      <DashboardLayout>
        <div />
      </DashboardLayout>
    );

    expect(screen.queryByRole("link", { name: /Saved Jobs/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Application Status/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^Billing$/ })).not.toBeInTheDocument();
  });

  it("does not render an onboarding dialog", () => {
    render(
      <DashboardLayout>
        <div />
      </DashboardLayout>
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the JobBuddy AI branding and settings link", () => {
    render(
      <DashboardLayout>
        <div />
      </DashboardLayout>
    );

    expect(screen.getAllByText("JobBuddy AI").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Profile Settings/ })).toHaveAttribute(
      "href",
      "/dashboard/settings"
    );
  });
});
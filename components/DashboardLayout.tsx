"use client";

import React from "react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BriefcaseIcon,
  BookmarkIcon,
  File01Icon,
  UserIcon,
  ClipboardCheckIcon,
  Settings02Icon,
  CreditCardIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import OnboardingDialog from "@/components/OnboardingDialog";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-auto bg-background">
        <div className="flex h-14 items-center border-b px-4 lg:hidden">
          <SidebarTrigger />
          <span className="ml-4 font-semibold text-primary">JobBuddy AI</span>
        </div>
        {children}
      </main>
      <OnboardingDialog />
    </SidebarProvider>
  );
}

function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const navItems = [
    { title: "Jobs", icon: BriefcaseIcon, href: "/dashboard" },
    { title: "Saved Jobs", icon: BookmarkIcon, href: "/dashboard/saved" },
    { title: "Resume", icon: File01Icon, href: "/dashboard/resume" },
    { title: "Profile", icon: UserIcon, href: "/dashboard/profile" },
    {
      title: "Status",
      icon: ClipboardCheckIcon,
      href: "/dashboard/status",
    },
    { title: "Billing", icon: CreditCardIcon, href: "/dashboard/billing" },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex items-center gap-2 px-4 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <HugeiconsIcon icon={SparklesIcon} strokeWidth={2.5} size={26} />
        </div>
        {!isCollapsed && (
          <span className="text-xl font-bold tracking-tight text-primary">
            JobBuddy AI
          </span>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                render={
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 text-base font-medium"
                  >
                    <HugeiconsIcon icon={item.icon} strokeWidth={2} size={26} />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                }
                tooltip={item.title}
              />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <div className="mb-4 rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} size={24} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-base font-semibold">50 Credits</span>
                <span className="text-sm text-muted-foreground">
                  Billing / Credits
                </span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full border-dashed text-xs"
            >
              Upgrade Now
            </Button>
          )}
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 text-base font-medium"
                >
                  <HugeiconsIcon
                    icon={Settings02Icon}
                    strokeWidth={2}
                    size={26}
                  />
                  {!isCollapsed && <span>Profile Settings</span>}
                </Link>
              }
              tooltip="Profile Settings"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

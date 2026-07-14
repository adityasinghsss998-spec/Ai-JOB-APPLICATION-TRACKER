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
import { Bot, Sparkles, Zap, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import OnboardingDialog from "@/components/OnboardingDialog";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen w-full bg-background text-foreground overflow-x-hidden selection:bg-indigo-500/30">
        {/* Background ambient radial glow */}
        <div className="fixed top-0 left-64 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none z-0" />
        <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none z-0" />

        <AppSidebar />
        
        <main className="relative z-10 flex-1 overflow-y-auto min-h-screen flex flex-col">
          {/* Top Desktop & Mobile Header Bar */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/40 bg-background/70 backdrop-blur-xl px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-xl border border-border/40 hover:bg-muted/60" />
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-foreground">
                  ApplyAgent<span className="text-indigo-500">.ai</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Bot Agent Idle & Ready
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/status"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition-all hover:scale-105"
              >
                <Sparkles className="size-3.5" />
                <span>Run Stagehand Agent</span>
              </Link>
            </div>
          </header>

          <div className="flex-1 p-6 lg:p-8">
            {children}
          </div>
        </main>
        
        <OnboardingDialog />
      </div>
    </SidebarProvider>
  );
}

function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const navItems = [
    { title: "Jobs Pipeline", icon: BriefcaseIcon, href: "/dashboard" },
    { title: "Saved Listings", icon: BookmarkIcon, href: "/dashboard/saved" },
    { title: "ATS Resumes", icon: File01Icon, href: "/dashboard/resume" },
    { title: "Candidate Profile", icon: UserIcon, href: "/dashboard/profile" },
    { title: "Agent Monitor", icon: ClipboardCheckIcon, href: "/dashboard/status" },
    { title: "Billing & Plans", icon: CreditCardIcon, href: "/dashboard/billing" },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40 bg-card/60 backdrop-blur-xl">
      <SidebarHeader className="flex items-center gap-3 px-4 py-5 border-b border-border/30">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/20 transition-transform group-hover:scale-105">
            <div className="flex size-full items-center justify-center rounded-[10px] bg-background">
              <Bot className="size-4 text-indigo-500" />
            </div>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-foreground">
                ApplyAgent<span className="text-indigo-500">.ai</span>
              </span>
              <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest -mt-1">
                Dashboard v2.0
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarMenu className="space-y-1">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                render={
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 text-xs font-semibold px-3 py-2.5 rounded-xl hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors"
                  >
                    <HugeiconsIcon icon={item.icon} strokeWidth={2} size={20} className="text-muted-foreground group-hover:text-indigo-400" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                }
                tooltip={item.title}
              />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border/30 space-y-3">
        {!isCollapsed && (
          <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-card to-background p-3.5 shadow-lg shadow-indigo-500/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Zap className="size-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">50 AI Credits</span>
                  <span className="text-[10px] text-muted-foreground">Monthly Quota</span>
                </div>
              </div>
            </div>
            <Link href="/dashboard/billing">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-[11px] font-bold h-8 rounded-xl border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-400 text-indigo-300 transition-all mt-1"
              >
                Upgrade Plan
              </Button>
            </Link>
          </div>
        )}

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 text-xs font-semibold px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors"
                >
                  <HugeiconsIcon
                    icon={Settings02Icon}
                    strokeWidth={2}
                    size={20}
                    className="text-muted-foreground"
                  />
                  {!isCollapsed && <span>Settings & Account</span>}
                </Link>
              }
              tooltip="Settings & Account"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

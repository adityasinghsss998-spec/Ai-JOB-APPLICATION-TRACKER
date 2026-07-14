import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/DashboardLayout";
import { signOut } from "@/app/auth/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  CreditCardIcon,
  File01Icon,
  ClipboardCheckIcon,
  Logout01Icon,
} from "@hugeicons/core-free-icons";
import { getPlanLimit } from "@/lib/plan-limits";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const fullName = profile?.full_name || user?.user_metadata?.full_name || "User";
  const email = profile?.email || user.email || "";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || "";
  
  const planName = profile?.plan_name || "Free";
  const subscriptionStatus = profile?.subscription_status || "inactive";
  const dailyUsage = profile?.daily_usage_count || 0;
  const lastUsageDate = profile?.last_usage_date;
  
  // Calculate if last usage was today
  const todayStr = new Date().toISOString().split("T")[0];
  const isToday = lastUsageDate === todayStr;
  const currentUsage = isToday ? dailyUsage : 0;
  
  const planLimit = getPlanLimit(planName);
  const usagePercentage = Math.min((currentUsage / planLimit) * 100, 100);

  // Initials for avatar fallback
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2) || "U";

  // Tier Badge Color Styling
  const badgeStyles: Record<string, string> = {
    Free: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    Pro: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    Unlimited: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  };

  const currentBadgeStyle = badgeStyles[planName] || badgeStyles.Free;

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Profile Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account credentials, view subscription features, and control your active session.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column: Account Details & Usage */}
          <div className="md:col-span-1 space-y-6">
            {/* Account Card */}
            <Card className="overflow-hidden">
              <div className="h-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
              <CardContent className="relative pt-0 px-6 pb-6 text-center">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                  <Avatar size="lg" className="h-20 w-20 border-4 border-background ring-offset-background flex items-center justify-center">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={fullName} />
                    ) : null}
                    <AvatarFallback className="text-lg font-bold bg-muted text-muted-foreground flex items-center justify-center h-full w-full">{initials}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="mt-12 space-y-2">
                  <h3 className="text-lg font-semibold tracking-tight">{fullName}</h3>
                  <p className="text-sm text-muted-foreground break-all">{email}</p>
                  <div className="pt-2">
                    <Badge variant="outline" className={currentBadgeStyle}>
                      {planName} Account
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Usage Progress */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Daily Run Usage</CardTitle>
                <CardDescription className="text-xs">
                  Resets daily. Plan limits apply to automatic form completions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={usagePercentage} className="w-full">
                  <ProgressLabel className="text-xs font-medium text-foreground">AI Submissions</ProgressLabel>
                  <span className="ml-auto text-xs text-muted-foreground font-medium tabular-nums">
                    {`${currentUsage} / ${planLimit === 9999 ? "∞" : planLimit}`}
                  </span>
                </Progress>
                <div className="text-xs text-muted-foreground">
                  {planName === "Free" ? (
                    <p>Upgrade to Pro to increase your limit to 50 runs daily.</p>
                  ) : planName === "Pro" ? (
                    <p>Need more applications? Try the Unlimited plan for infinite runs.</p>
                  ) : (
                    <p>You have unrestricted daily automatic job applications!</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/40 p-3 flex justify-center">
                <Link href="/dashboard/billing" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                  <HugeiconsIcon icon={CreditCardIcon} size={14} />
                  Manage Plan & Billing
                </Link>
              </CardFooter>
            </Card>
          </div>

          {/* Right Column: Features Hub & Sign Out */}
          <div className="md:col-span-2 space-y-6">
            {/* Features Hub */}
            <Card>
              <CardHeader>
                <CardTitle>Features & Profile Sections</CardTitle>
                <CardDescription>
                  Configure your job search profile, review documents, and check automation tasks.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {/* Profile Shortcut */}
                <Link
                  href="/dashboard/profile"
                  className="group flex flex-col justify-between rounded-xl border p-4 hover:border-primary hover:bg-muted/30 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <HugeiconsIcon icon={UserIcon} strokeWidth={2} size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Application Profile</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Edit personal details, professional summary, education, experience, and custom links.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 text-xs font-medium text-primary flex items-center gap-1">
                    Manage Profile &rarr;
                  </div>
                </Link>

                {/* Resume Shortcut */}
                <Link
                  href="/dashboard/resume"
                  className="group flex flex-col justify-between rounded-xl border p-4 hover:border-primary hover:bg-muted/30 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <HugeiconsIcon icon={File01Icon} strokeWidth={2} size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Resumes & Uploads</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload and configure your CV documents. Configure parser features for high-accuracy parsing.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 text-xs font-medium text-primary flex items-center gap-1">
                    Manage Resumes &rarr;
                  </div>
                </Link>

                {/* Billing Shortcut */}
                <Link
                  href="/dashboard/billing"
                  className="group flex flex-col justify-between rounded-xl border p-4 hover:border-primary hover:bg-muted/30 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Billing & Upgrades</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        View current billing invoices, manage stripe subscriptions, and check plan quotas.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 text-xs font-medium text-primary flex items-center gap-1">
                    Manage Billing &rarr;
                  </div>
                </Link>

                {/* Run Status Shortcut */}
                <Link
                  href="/dashboard/status"
                  className="group flex flex-col justify-between rounded-xl border p-4 hover:border-primary hover:bg-muted/30 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <HugeiconsIcon icon={ClipboardCheckIcon} strokeWidth={2} size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Automation Logs</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Inspect active and completed form-filling browser sessions and real-time execution replays.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 text-xs font-medium text-primary flex items-center gap-1">
                    Check Logs &rarr;
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Session Management & Sign Out */}
            <Card className="border-destructive/20 bg-destructive/5 dark:bg-destructive/10">
              <CardHeader>
                <CardTitle className="text-destructive dark:text-red-400">Session Actions</CardTitle>
                <CardDescription>
                  Perform critical actions regarding your session. Leaving this computer? Secure your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Signing out will terminate your current browser session and require you to sign back in.
                </p>
              </CardContent>
              <CardFooter className="border-t border-destructive/10 bg-destructive/5 px-6 py-4 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Active since: {new Date(user.created_at).toLocaleDateString()}
                </div>
                <form action={signOut}>
                  <Button type="submit" variant="destructive" className="flex items-center gap-2">
                    <HugeiconsIcon icon={Logout01Icon} size={18} strokeWidth={2} />
                    Sign Out Account
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}

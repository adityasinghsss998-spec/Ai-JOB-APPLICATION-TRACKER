"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { CreditCardIcon, SparklesIcon, TickDouble02Icon } from "@hugeicons/core-free-icons";
import { getPlanLimit, PLAN_LIMITS } from "@/lib/plan-limits";

interface BillingDashboardProps {
  profile: any;
}

export default function BillingDashboard({ profile }: BillingDashboardProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const planName = profile?.plan_name || "Free";
  const subscriptionStatus = profile?.subscription_status || "inactive";
  const dailyUsage = profile?.daily_usage_count || 0;
  const lastUsageDate = profile?.last_usage_date;

  // Reset daily usage locally if the last usage was not today
  const todayStr = new Date().toISOString().split("T")[0];
  const isToday = lastUsageDate === todayStr;
  const currentUsage = isToday ? dailyUsage : 0;

  const currentLimit = getPlanLimit(planName);

  const handleCheckout = async (targetPlan: string) => {
    setLoadingPlan(targetPlan);
    const toastId = toast.loading(`Creating checkout session for ${targetPlan} plan...`);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName: targetPlan }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to initiate checkout.");

      toast.success("Redirecting to Stripe...", { id: toastId });
      window.location.href = result.url;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to start checkout process.", { id: toastId });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManagePortal = async () => {
    setLoadingPortal(true);
    const toastId = toast.loading("Opening Stripe Customer Portal...");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to open portal.");

      toast.success("Redirecting to Stripe Billing Portal...", { id: toastId });
      window.location.href = result.url;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Could not open billing portal.", { id: toastId });
    } finally {
      setLoadingPortal(false);
    }
  };

  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Get started with automated job applications",
      features: [
        `Maximum ${PLAN_LIMITS.Free} AI applications/day`,
        "Standard field detection",
        "Form submission simulation",
      ],
      action: "Current Plan",
      disabled: true,
    },
    {
      name: "Pro",
      price: "$19",
      description: "Scale your job hunt with more applications",
      features: [
        `Maximum ${PLAN_LIMITS.Pro} AI applications/day`,
        "Stagehand browser automation",
        "Live session replay URLs",
        "Custom field verification",
      ],
      action: planName === "Pro" ? "Current Plan" : "Upgrade to Pro",
      disabled: planName === "Pro",
    },
    {
      name: "Unlimited",
      price: "$49",
      description: "Unrestricted search for maximum efficiency",
      features: [
        "Unlimited AI applications/day",
        "Stagehand browser automation",
        "Live session replay URLs",
        "Priority Inngest queue",
        "24/7 matching runs",
      ],
      action: planName === "Unlimited" ? "Current Plan" : "Upgrade to Unlimited",
      disabled: planName === "Unlimited",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Current Plan Overview Card */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-muted">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <HugeiconsIcon icon={CreditCardIcon} size={20} className="text-primary" />
              Current Plan
            </CardTitle>
            <CardDescription>Details of your subscription tier.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground font-medium">Plan Tier</span>
              <Badge className="font-bold uppercase tracking-wider bg-primary/10 text-primary hover:bg-primary/10 border border-primary/20">
                {planName}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground font-medium">Subscription Status</span>
              <Badge className={`font-bold uppercase tracking-wider ${
                subscriptionStatus === "active" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" : "bg-muted text-muted-foreground border"
              }`}>
                {subscriptionStatus}
              </Badge>
            </div>
            {profile?.current_period_end && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground font-medium">Next Billing Date</span>
                <span className="text-sm font-semibold">
                  {new Date(profile.current_period_end).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  })}
                </span>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-2 border-t">
            {profile?.stripe_customer_id ? (
              <Button onClick={handleManagePortal} disabled={loadingPortal} variant="outline" className="w-full flex items-center gap-2">
                <HugeiconsIcon icon={CreditCardIcon} size={16} />
                {loadingPortal ? "Loading Billing Portal..." : "Manage Subscription"}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground italic w-full text-center">
                Currently running on standard credentials. Upgrade below to scale.
              </p>
            )}
          </CardFooter>
        </Card>

        {/* Usage Card */}
        <Card className="border border-muted flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <HugeiconsIcon icon={SparklesIcon} size={20} className="text-indigo-500" />
              Usage Information
            </CardTitle>
            <CardDescription>Daily automated application usage count.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col justify-center">
            {planName === "Unlimited" ? (
              <div className="text-center py-4 space-y-1">
                <h3 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">Unlimited usage</h3>
                <p className="text-xs text-muted-foreground">No limits apply. Run parallel automation sessions.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Applications Used Today</span>
                  <span>{currentUsage} / {currentLimit}</span>
                </div>
                <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      currentUsage >= currentLimit ? "bg-rose-500" : currentUsage >= currentLimit * 0.8 ? "bg-amber-500" : "bg-primary"
                    }`}
                    style={{ width: `${Math.min(100, (currentUsage / currentLimit) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  You have <strong className="text-foreground">{Math.max(0, currentLimit - currentUsage)}</strong> remaining applies left for today.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-2 border-t text-[10px] text-muted-foreground text-center">
            Daily limit resets at midnight UTC.
          </CardFooter>
        </Card>
      </div>

      {/* Pricing Cards Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-center">Select Pricing Plan</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p) => {
            const isCurrent = planName === p.name;
            return (
              <Card key={p.name} className={`border flex flex-col justify-between ${isCurrent ? "border-primary shadow-md relative overflow-hidden" : "border-muted"}`}>
                {isCurrent && (
                  <div className="absolute right-0 top-0 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-bl-lg">
                    Current
                  </div>
                )}
                <div>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-baseline gap-1.5">
                      <span>{p.name}</span>
                      <span className="text-sm font-normal text-muted-foreground">Plan</span>
                    </CardTitle>
                    <div className="mt-2 flex items-baseline text-3xl font-extrabold">
                      {p.price}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">/ month</span>
                    </div>
                    <CardDescription className="pt-1.5 min-h-[40px]">
                      {p.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="border-t pt-4">
                    <ul className="space-y-2.5 text-xs text-muted-foreground">
                      {p.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <HugeiconsIcon icon={TickDouble02Icon} size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </div>
                <CardFooter className="border-t pt-4">
                  {p.disabled ? (
                    <Button disabled variant="outline" className="w-full">
                      {p.action}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleCheckout(p.name)} 
                      disabled={loadingPlan !== null || loadingPortal} 
                      className="w-full"
                    >
                      {loadingPlan === p.name ? "Redirecting..." : p.action}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

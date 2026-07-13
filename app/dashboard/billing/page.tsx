import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/DashboardLayout";
import BillingDashboard from "@/components/BillingDashboard";

export default async function BillingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }

  // Fetch complete profile details (includes limits and subscription metrics)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Billing & Subscription</h1>
          <p className="text-sm text-muted-foreground">
            Manage your subscription, billing portal, and monitor daily automation limits.
          </p>
        </div>

        <BillingDashboard profile={profile} />
      </main>
    </DashboardLayout>
  );
}

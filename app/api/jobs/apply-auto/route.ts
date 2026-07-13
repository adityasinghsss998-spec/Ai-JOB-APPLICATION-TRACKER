import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest";
import { detectJobPlatform } from "@/lib/browserbase/platform";
import { PLAN_LIMITS } from "@/lib/plan-limits";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Validate session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { jobId } = await req.json();
    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    // Fetch user profile to validate subscription limits
    const { data: profileRaw, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profileRaw) {
      return NextResponse.json({ error: "Candidate profile not found." }, { status: 404 });
    }

    const profile = profileRaw as any;
    const plan = profile.plan_name || "Free";
    const planLimit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.Free;

    // Atomically increment usage count with plan limit check
    const { data: incrementResult, error: rpcError } = await supabase
      .rpc("increment_daily_usage", {
        p_user_id: user.id,
        p_plan_limit: planLimit,
      });

    if (rpcError) {
      console.error("Error calling increment_daily_usage RPC:", rpcError);
      return NextResponse.json({
        error: "Failed to validate usage limits. Please try again.",
      }, { status: 500 });
    }

    // Check if limit was reached
    if (!incrementResult) {
      const limitValue = planLimit === -1 ? "unlimited" : planLimit;
      return NextResponse.json({
        error: `Daily limit reached. ${plan} users are limited to ${limitValue} AI applications per day. ${plan === "Free" ? "Please upgrade your subscription tier." : plan === "Pro" ? "Upgrade to Unlimited for unrestricted usage." : ""}`,
        limitReached: true,
        plan,
      }, { status: 403 });
    }

    // Fetch the job
    const { data: jobRaw, error: jobError } = await supabase
      .from("jobs" as any)
      .select("*")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single();

    if (jobError || !jobRaw) {
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 });
    }

    const job = jobRaw as any;

    // Detect the job board platform
    const platform = detectJobPlatform(job.job_url, job.platform);

    // Trigger the background Inngest event BEFORE updating status
    // This ensures that if the event send fails, the job status remains unchanged and retryable
    await inngest.send({
      name: "job/detect-fields",
      data: {
        jobId,
        userId: user.id,
        jobUrl: job.job_url,
        platform,
      },
    });

    // Update job status to 'detecting' and clear previous errors
    const { error: updateError } = await supabase
      .from("jobs" as any)
      .update({
        applied_status: "detecting",
        missing_fields: null,
        browserbase_session_id: null,
      } as any)
      .eq("id", jobId);

    if (updateError) {
      console.error("Error updating job status:", updateError);
      return NextResponse.json({ error: "Failed to update job status" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "AI agent started analyzing the application form.",
      platform,
    });
  } catch (error: any) {
    console.error("Auto apply endpoint error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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
    let incrementResult = null;
    let rpcError = null;

    const rpcRes = await (supabase as any)
      .rpc("increment_daily_usage", {
        p_user_id: user.id,
        p_plan_limit: planLimit,
      });
    
    incrementResult = rpcRes.data;
    rpcError = rpcRes.error;

    // Fallback: If RPC function does not exist in Supabase database, perform manual check & increment
    if (rpcError && rpcError.code === "PGRST202") {
      console.warn("increment_daily_usage RPC not found, falling back to manual validation.");
      
      const todayStr = new Date().toISOString().split("T")[0];
      const currentUsage = profile.last_usage_date === todayStr ? (profile.daily_usage_count || 0) : 0;
      
      if ((planLimit as number) === -1 || currentUsage < planLimit) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            daily_usage_count: currentUsage + 1,
            last_usage_date: todayStr,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", user.id);
          
        if (updateError) {
          console.error("Manual fallback usage update failed:", updateError);
          rpcError = updateError;
        } else {
          incrementResult = true;
          rpcError = null;
        }
      } else {
        incrementResult = false;
        rpcError = null;
      }
    }

    if (rpcError) {
      console.error("Error validating usage limits:", rpcError);
      return NextResponse.json({
        error: "Failed to validate usage limits. Please try again.",
      }, { status: 500 });
    }

    // Check if limit was reached
    if (!incrementResult) {
      const limitValue = (planLimit as number) === -1 ? "unlimited" : planLimit;
      const errorMsg = plan === "Free"
        ? "AI Autofill is a premium feature. Please upgrade to a paid subscription (Pro or Unlimited) to use the automatic AI Agent, or apply manually instead."
        : `Daily limit reached. ${plan} users are limited to ${limitValue} AI applications per day. ${plan === "Pro" ? "Upgrade to Unlimited for unrestricted usage." : ""}`;

      return NextResponse.json({
        error: errorMsg,
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

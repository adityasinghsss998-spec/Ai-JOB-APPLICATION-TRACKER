import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest";
import { PLAN_LIMITS } from "@/lib/plan-limits";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Validate session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { jobId, verifiedFields } = await req.json();
    if (!jobId || !verifiedFields) {
      return NextResponse.json({ error: "Job ID and verified fields are required" }, { status: 400 });
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
    const planLimit = profile.plan_limit ?? PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.Free;
    const todayStr = new Date().toISOString().split("T")[0];
    let usageCount = profile.daily_usage_count || 0;

    // Reset daily usage count if a new calendar day has started
    if (profile.last_usage_date !== todayStr) {
      usageCount = 0;
      await supabase
        .from("profiles")
        .update({
          daily_usage_count: 0,
          last_usage_date: todayStr,
        } as any)
        .eq("id", user.id);
    }

    // Block if user has reached daily limits based on subscription tier
    // Use configured plan limit (negative values indicate unlimited)
    if (planLimit >= 0 && usageCount >= planLimit) {
      const limitValue = planLimit;
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

    // Update job status to 'applying'
    const { error: updateError } = await supabase
      .from("jobs" as any)
      .update({
        applied_status: "applying",
      } as any)
      .eq("id", jobId);

    if (updateError) {
      console.error("Error updating job status to applying:", updateError);
      return NextResponse.json({ error: "Failed to update job status" }, { status: 500 });
    }

    // Trigger Inngest submission background function
    await inngest.send({
      name: "job/submit-application",
      data: {
        jobId,
        userId: user.id,
        jobUrl: job.job_url,
        platform: job.platform,
        detectedFields: job.detected_fields,
        verifiedFields, // Pass the verified answers directly to Inngest!
      },
    });

    return NextResponse.json({
      success: true,
      message: "Form submission started.",
    });
  } catch (error: any) {
    console.error("Submit auto endpoint error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

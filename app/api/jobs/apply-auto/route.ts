import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest";
import { detectJobPlatform } from "@/lib/browserbase/platform";

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
    if (plan === "Free" && usageCount >= 5) {
      return NextResponse.json({
        error: "Daily limit reached. Free users are limited to 5 AI applications per day. Please upgrade your subscription tier.",
        limitReached: true,
        plan,
      }, { status: 403 });
    }

    if (plan === "Pro" && usageCount >= 25) {
      return NextResponse.json({
        error: "Daily limit reached. Pro users are limited to 25 AI applications per day. Upgrade to Unlimited for unrestricted usage.",
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

    // Trigger the background Inngest event
    await inngest.send({
      name: "job/detect-fields",
      data: {
        jobId,
        userId: user.id,
        jobUrl: job.job_url,
        platform,
      },
    });

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

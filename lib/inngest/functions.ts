import { inngest } from "@/lib/inngest";
import { createAdminClient } from "@/lib/supabase/admin";
import { detectFormFields, submitJobApplication, DetectedField } from "@/lib/browserbase/stagehand-runner";

/**
 * 1. Background task to detect form fields and validate profile data
 */
export const detectFormFieldsFn = inngest.createFunction(
  { id: "detect-job-fields", triggers: [{ event: "job/detect-fields" }] },
  async ({ event, step }: any) => {
    const { jobId, userId, jobUrl, platform } = event.data;
    const supabase = createAdminClient();

    // Step 1: Detect form fields via Browserbase + Stagehand
    const { fields, sessionId } = await step.run("detect-fields", async () => {
      return await detectFormFields(jobUrl, platform);
    });

    // Save detected fields to the database
    await step.run("save-detected-fields", async () => {
      await supabase
        .from("jobs" as any)
        .update({ 
          detected_fields: fields,
          browserbase_session_id: sessionId
        } as any)
        .eq("id", jobId);
    });

    // Step 2: Fetch user profile and resume details
    const { profile, resumes } = await step.run("fetch-user-data", async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const { data: resumes } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      return { profile, resumes };
    });

    // Step 3: Compare detected fields against profile details to find missing info
    const missingFields = await step.run("compare-profile-details", () => {
      const missing: string[] = [];
      const hasResume = resumes && resumes.length > 0;

      const fieldsList = fields || [];
      for (const field of fieldsList) {
        if (!field.required) continue;

        const fieldName = field.name.toLowerCase();
        const fieldLabel = field.label.toLowerCase();

        if (field.type === "file" || fieldName.includes("resume") || fieldName.includes("cv")) {
          if (!hasResume) {
            missing.push("resume");
          }
        } else if (fieldName.includes("first_name") || fieldLabel.includes("first name")) {
          if (!profile?.full_name) {
            missing.push("full_name");
          }
        } else if (fieldName.includes("last_name") || fieldLabel.includes("last name")) {
          if (!profile?.full_name) {
            missing.push("full_name");
          }
        } else if (fieldName.includes("full_name") || fieldName === "name" || fieldLabel.includes("full name") || fieldLabel === "name") {
          if (!profile?.full_name) {
            missing.push("full_name");
          }
        } else if (fieldName.includes("email")) {
          if (!profile?.email) {
            missing.push("email");
          }
        } else if (fieldName.includes("phone")) {
          if (!profile?.phone) {
            missing.push("phone");
          }
        } else if (fieldName.includes("location") || fieldLabel.includes("location") || fieldLabel.includes("city")) {
          if (!profile?.location) {
            missing.push("location");
          }
        } else if (fieldName.includes("linkedin")) {
          const links = profile?.links || [];
          const hasLinkedin = links.some((l: string) => l.toLowerCase().includes("linkedin.com"));
          if (!hasLinkedin) {
            missing.push("links");
          }
        }
      }

      // De-duplicate list
      return Array.from(new Set(missing));
    });

    // Step 4: Always transition to 'review_details' status so the user can verify fields!
    await step.run("update-status-review-details", async () => {
      await supabase
        .from("jobs" as any)
        .update({
          applied_status: "review_details",
          missing_fields: missingFields.length > 0 ? missingFields : null,
        } as any)
        .eq("id", jobId);
    });

    return { status: "review_details", missingFields };
  }
);

/**
 * 2. Background task to submit the form using profile data.
 * Executes tasks one-by-one (concurrency: 1) to prevent conflicts or rate limit issues.
 */
export const submitJobApplicationFn = inngest.createFunction(
  { 
    id: "submit-job-application",
    triggers: [{ event: "job/submit-application" }],
    concurrency: {
      limit: 1 // Execute tasks sequentially
    }
  },
  async ({ event, step }: any) => {
    const { jobId, userId, jobUrl, platform, detectedFields, verifiedFields } = event.data;
    const supabase = createAdminClient();

    // Fetch full profile and latest resume details
    const { profile, resume } = await step.run("fetch-user-profile-and-resume", async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const { data: resumes } = await supabase
        .from("resumes")
        .select("file_url, file_name")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      return { 
        profile, 
        resume: resumes && resumes.length > 0 ? resumes[0] : null 
      };
    });

    // Execute application submission
    const result = await step.run("apply-via-browserbase", async () => {
      return await submitJobApplication(
        jobUrl,
        platform,
        profile,
        resume,
        detectedFields,
        verifiedFields // Pass user-verified fields down to the automation agent
      );
    });

    // Update database status based on result
    await step.run("update-final-status", async () => {
      if (result.success) {
        await supabase
          .from("jobs" as any)
          .update({
            applied_status: "applied",
            browserbase_session_id: result.sessionId,
            fetched_at: new Date().toISOString() // Updates dashboard activities timeline
          } as any)
          .eq("id", jobId);

        // Increment daily usage count for candidate
        const todayStr = new Date().toISOString().split("T")[0];
        const { data: currentProfile } = await supabase
          .from("profiles" as any)
          .select("daily_usage_count, last_usage_date")
          .eq("id", userId)
          .single() as any;
        
        let newCount = 1;
        if (currentProfile) {
          if (currentProfile.last_usage_date === todayStr) {
            newCount = (currentProfile.daily_usage_count || 0) + 1;
          }
        }

        await supabase
          .from("profiles" as any)
          .update({
            daily_usage_count: newCount,
            last_usage_date: todayStr,
            updated_at: new Date().toISOString()
          } as any)
          .eq("id", userId);
      } else {
        await supabase
          .from("jobs" as any)
          .update({
            applied_status: "failed",
            browserbase_session_id: result.sessionId,
          } as any)
          .eq("id", jobId);
      }
    });

    return { success: result.success, sessionId: result.sessionId };
  }
);

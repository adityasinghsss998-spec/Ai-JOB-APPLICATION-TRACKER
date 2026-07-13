import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/DashboardLayout";
import JobsDashboard from "@/components/JobsDashboard";

export default async function SavedJobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch candidate profile details
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Compile activity history to render in the sidebar
  const activities: Array<{
    id: string;
    type: "resume_upload" | "job_save" | "job_apply";
    title: string;
    timestamp: string;
  }> = [];

  const { data: recentResumes } = await supabase
    .from("resumes")
    .select("id, file_name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(2);

  const { data: recentJobs } = await (supabase
    .from("jobs" as any)
    .select("id, title, company, saved_status, applied_status, fetched_at, created_at")
    .eq("user_id", user.id)
    .or("saved_status.eq.true,applied_status.neq.not_applied")
    .order("fetched_at", { ascending: false })
    .limit(3) as any);

  if (recentResumes) {
    recentResumes.forEach((res) => {
      activities.push({
        id: res.id,
        type: "resume_upload",
        title: `Uploaded resume: ${res.file_name}`,
        timestamp: res.created_at,
      });
    });
  }

  if (recentJobs) {
    recentJobs.forEach((job: any) => {
      if (job.applied_status !== "not_applied") {
        activities.push({
          id: job.id + "-applied",
          type: "job_apply",
          title: `Applied to job: ${job.title} at ${job.company}`,
          timestamp: job.fetched_at || job.created_at,
        });
      } else if (job.saved_status) {
        activities.push({
          id: job.id + "-saved",
          type: "job_save",
          title: `Saved job: ${job.title} at ${job.company}`,
          timestamp: job.fetched_at || job.created_at,
        });
      }
    });
  }

  // Sort activities in reverse chronological order
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <DashboardLayout>
      <JobsDashboard 
        profile={profile} 
        initialActivities={activities.slice(0, 5)} 
        mode="saved" 
      />
    </DashboardLayout>
  );
}

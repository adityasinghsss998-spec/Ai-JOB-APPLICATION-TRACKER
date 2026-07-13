"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Location01Icon,
  DollarIcon,
  BriefcaseIcon,
  BookmarkIcon,
  SparklesIcon,
  SearchIcon,
} from "@hugeicons/core-free-icons";
import ProfileCompletenessCard from "@/components/ProfileCompletenessCard";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Job {
  id: string;
  platform: string;
  title: string;
  company: string;
  company_logo?: string;
  location?: string;
  salary?: string;
  job_type?: string;
  experience_level?: string;
  description?: string;
  tags?: string[];
  match_score?: number;
  job_url: string;
  saved_status: boolean;
  applied_status: string;
  fetched_at: string;
}

interface Activity {
  id: string;
  type: "resume_upload" | "job_save" | "job_apply";
  title: string;
  timestamp: string;
}

interface JobsDashboardProps {
  profile: any;
  initialActivities: Activity[];
  mode?: "all" | "saved";
}

const PLATFORMS = [
  { id: "greenhouse", name: "Greenhouse", logo: "/logos/greenhouse.png", color: "border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400" },
  { id: "lever", name: "Lever", logo: "/logos/lever.png", color: "border-amber-500/30 hover:border-amber-500 bg-amber-500/5 text-amber-700 dark:text-amber-400" },
  { id: "workable", name: "Workable", logo: "/logos/workable.png", color: "border-blue-500/30 hover:border-blue-500 bg-blue-500/5 text-blue-700 dark:text-blue-400" },
  { id: "wellfound", name: "Wellfound", logo: "/logos/wellfound.png", color: "border-rose-500/30 hover:border-rose-500 bg-rose-500/5 text-rose-700 dark:text-rose-400" },
];

export default function JobsDashboard({ profile, initialActivities, mode = "all" }: JobsDashboardProps) {
  const supabase = createClient();
  const router = useRouter();

  // Automatic Apply States
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyStep, setApplyStep] = useState<"options" | "detecting" | "missing_info" | "review_details" | "applying" | "success" | "error" | "limit_reached">("options");
  const [limitErrorMessage, setLimitErrorMessage] = useState("");
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [bbSessionId, setBbSessionId] = useState<string | null>(null);
  const [fieldAnswers, setFieldAnswers] = useState<Record<string, string>>({});

  // Missing fields inputs
  const [missingFullName, setMissingFullName] = useState("");
  const [missingEmail, setMissingEmail] = useState("");
  const [missingPhone, setMissingPhone] = useState("");
  const [missingLocation, setMissingLocation] = useState("");
  const [missingLinks, setMissingLinks] = useState("");
  const [missingResumeFile, setMissingResumeFile] = useState<File | null>(null);
  const [isSavingMissingData, setIsSavingMissingData] = useState(false);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  const handleOpenApplyOptions = (job: Job) => {
    setSelectedJob(job);
    setApplyStep("options");
    setMissingFields([]);
    setBbSessionId((job as any).browserbase_session_id || null);
    
    // Initialize missing field values from profile
    setMissingFullName(profile?.full_name || "");
    setMissingEmail(profile?.email || "");
    setMissingPhone(profile?.phone || "");
    setMissingLocation(profile?.location || "");
    
    const linkedinUrl = (profile?.links || []).find((l: string) => l.toLowerCase().includes("linkedin.com")) || "";
    setMissingLinks(linkedinUrl);
    setMissingResumeFile(null);

    setApplyDialogOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setApplyDialogOpen(open);
    if (!open && pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const handleApplyManually = () => {
    if (!selectedJob) return;
    window.open(selectedJob.job_url, "_blank", "noopener,noreferrer");
    setApplyDialogOpen(false);
  };

  const handleApplyAutomatically = async () => {
    if (!selectedJob) return;

    setApplyStep("detecting");
    const toastId = toast.loading("Launching AI application agent...");

    try {
      const response = await fetch("/api/jobs/apply-auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: selectedJob.id }),
      });

      const result = await response.json();
      if (!response.ok) {
        if (response.status === 403) {
          setLimitErrorMessage(result.error || "Daily limit reached.");
          setApplyStep("limit_reached");
          toast.dismiss(toastId);
          return;
        }
        throw new Error(result.error || "Failed to trigger auto apply.");
      }

      toast.success("AI Agent active in background.", { id: toastId });

      // Start status polling
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = setInterval(async () => {
        const { data: rawData, error } = await supabase
          .from("jobs" as any)
          .select("applied_status, missing_fields, browserbase_session_id")
          .eq("id", selectedJob.id)
          .single();

        if (error) {
          console.error("Polling error:", error);
          return;
        }

        const data = rawData as any;
        const status = data?.applied_status;
        const missing = data?.missing_fields;
        const sessionId = data?.browserbase_session_id;

        if (status === "review_details") {
          // Fetch full job to get detected fields
          const { data: fullJob } = await supabase
            .from("jobs" as any)
            .select("detected_fields")
            .eq("id", selectedJob.id)
            .single();

          const fields = (fullJob as any)?.detected_fields || [];
          
          // Pre-populate fields from profile
          const answers: Record<string, string> = {};
          for (const field of fields) {
            let val = "";
            const name = field.name.toLowerCase();
            const label = field.label.toLowerCase();
            
            if (name.includes("first_name") || label.includes("first name")) {
              val = profile?.full_name?.split(" ")[0] || "";
            } else if (name.includes("last_name") || label.includes("last name")) {
              val = profile?.full_name?.split(" ").slice(1).join(" ") || "";
            } else if (name.includes("full_name") || name === "name" || label.includes("full name") || label === "name") {
              val = profile?.full_name || "";
            } else if (name.includes("email")) {
              val = profile?.email || "";
            } else if (name === "phone" || name.includes("phone_number") || label.includes("phone")) {
              val = profile?.phone || "";
            } else if (name === "company" || name.includes("current_company") || label.includes("company")) {
              val = profile?.current_company || "";
            } else if (name === "title" || name === "job_title" || label.includes("job title") || label === "title") {
              val = profile?.current_job_title || "";
            } else if (name.includes("location") || label.includes("location") || label.includes("city")) {
              val = profile?.location || "";
            } else if (name.includes("linkedin")) {
              val = (profile?.links || []).find((l: string) => l.includes("linkedin.com")) || "";
            } else if (name.includes("portfolio") || name.includes("website") || name.includes("github")) {
              val = (profile?.links || []).find((l: string) => l.includes("github.com") || l.includes("portfolio") || !l.includes("linkedin.com")) || "";
            } else if (name.includes("summary")) {
              val = profile?.summary || "";
            }
            answers[field.name] = val;
          }

          setFieldAnswers(answers);
          setMissingFields(missing || []);
          setApplyStep("review_details");
          setSelectedJob((prev) => prev ? { ...prev, detected_fields: fields } : null);

          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else if (status === "missing_profile_info") {
          setApplyStep("missing_info");
          setMissingFields(missing || []);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else if (status === "applying") {
          setApplyStep("applying");
        } else if (status === "applied") {
          setApplyStep("success");
          setBbSessionId(sessionId || null);
          setJobs((prev) =>
            prev.map((j) => (j.id === selectedJob.id ? { ...j, applied_status: "applied" } : j))
          );
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else if (status === "failed") {
          setApplyStep("error");
          setBbSessionId(sessionId || null);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      }, 2000);

    } catch (err: any) {
      console.error("Error launching auto apply:", err);
      toast.error(err.message || "Failed to start AI application agent.", { id: toastId });
      setApplyStep("error");
    }
  };

  const handleSaveMissingFields = async () => {
    if (!selectedJob) return;

    // Validate inputs
    const validationErrors: string[] = [];
    if (missingFields.includes("full_name") && !missingFullName.trim()) {
      validationErrors.push("Full Name");
    }
    if (missingFields.includes("email") && !missingEmail.trim()) {
      validationErrors.push("Email Address");
    }
    if (missingFields.includes("phone") && !missingPhone.trim()) {
      validationErrors.push("Phone Number");
    }
    if (missingFields.includes("location") && !missingLocation.trim()) {
      validationErrors.push("Location");
    }
    if (missingFields.includes("links") && !missingLinks.trim()) {
      validationErrors.push("LinkedIn URL");
    }
    if (missingFields.includes("resume") && !missingResumeFile) {
      validationErrors.push("Resume File");
    }

    if (validationErrors.length > 0) {
      toast.error(`Please complete required fields: ${validationErrors.join(", ")}`);
      return;
    }

    setIsSavingMissingData(true);
    const toastId = toast.loading("Saving your information and resuming application...");

    try {
      // 1. Upload resume if required and file provided
      if (missingFields.includes("resume") && missingResumeFile) {
        const formData = new FormData();
        formData.append("resume", missingResumeFile);

        const resumeRes = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });

        const resumeResult = await resumeRes.json();
        if (!resumeRes.ok) {
          throw new Error(resumeResult.error || "Failed to upload and parse resume.");
        }
      }

      // 2. Build profile update payload
      let updatedLinks = [...(profile?.links || [])];
      if (missingLinks.trim()) {
        updatedLinks = updatedLinks.filter((l: string) => !l.toLowerCase().includes("linkedin.com"));
        updatedLinks.push(missingLinks.trim());
      }

      const payload = {
        ...profile,
        full_name: missingFullName.trim(),
        email: missingEmail.trim(),
        phone: missingPhone.trim(),
        location: missingLocation.trim(),
        links: updatedLinks,
      };

      // 3. Post to update-profile API
      const profileRes = await fetch("/api/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const profileResult = await profileRes.json();
      if (!profileRes.ok) {
        throw new Error(profileResult.error || "Failed to update profile details.");
      }

      toast.success("Profile details updated!", { id: toastId });

      // 4. Automatically trigger the application flow again
      await handleApplyAutomatically();

    } catch (err: any) {
      console.error("Error saving missing fields:", err);
      toast.error(err.message || "Failed to save details and resume application.", { id: toastId });
    } finally {
      setIsSavingMissingData(false);
    }
  };

  const handleConfirmAndSubmit = async () => {
    if (!selectedJob) return;

    const fields = (selectedJob as any).detected_fields || [];
    const validationErrors: string[] = [];

    // 1. Check text inputs
    for (const field of fields) {
      if (field.type === "file") continue;
      const answer = fieldAnswers[field.name] || "";
      if (field.required && !answer.trim()) {
        validationErrors.push(field.label || field.name);
      }
    }

    // 2. Check resume file
    const requiresResume = fields.some((f: any) => f.type === "file" || f.name.includes("resume") || f.name.includes("cv"));
    let databaseHasResume = false;
    
    if (requiresResume) {
      const { data: resumes } = await supabase
        .from("resumes" as any)
        .select("id")
        .eq("user_id", profile?.id);
      databaseHasResume = !!(resumes && resumes.length > 0);
    }

    if (requiresResume && !databaseHasResume && !missingResumeFile) {
      validationErrors.push("Resume File");
    }

    if (validationErrors.length > 0) {
      toast.error(`Please fill out required fields: ${validationErrors.join(", ")}`);
      return;
    }

    setIsSavingMissingData(true);
    const toastId = toast.loading("Saving inputs and submitting application...");

    try {
      // 1. If resume selected, upload it
      if (requiresResume && missingResumeFile) {
        const formData = new FormData();
        formData.append("resume", missingResumeFile);

        const resumeRes = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });

        const resumeResult = await resumeRes.json();
        if (!resumeRes.ok) {
          throw new Error(resumeResult.error || "Failed to upload and parse resume.");
        }
      }

      // 2. Save the standard text details to profile as well for future use!
      const fullName = fieldAnswers["full_name"] || fieldAnswers["name"] || profile?.full_name || "";
      const email = fieldAnswers["email"] || profile?.email || "";
      const phone = fieldAnswers["phone"] || fieldAnswers["phone_number"] || profile?.phone || "";
      const location = fieldAnswers["location"] || fieldAnswers["city"] || profile?.location || "";
      const linkedin = fieldAnswers["linkedin"] || "";

      let updatedLinks = [...(profile?.links || [])];
      if (linkedin.trim()) {
        updatedLinks = updatedLinks.filter((l: string) => !l.toLowerCase().includes("linkedin.com"));
        updatedLinks.push(linkedin.trim());
      }

      const profilePayload = {
        ...profile,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        links: updatedLinks,
      };

      await fetch("/api/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload),
      });

      // 3. Post verified fields to submit auto endpoint!
      const submitRes = await fetch("/api/jobs/submit-auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: selectedJob.id,
          verifiedFields: fieldAnswers,
        }),
      });

      const submitResult = await submitRes.json();
      if (!submitRes.ok) {
        if (submitRes.status === 403) {
          setLimitErrorMessage(submitResult.error || "Daily limit reached.");
          setApplyStep("limit_reached");
          toast.dismiss(toastId);
          return;
        }
        throw new Error(submitResult.error || "Failed to submit application.");
      }

      toast.success("AI agent is autofilling and submitting the form!", { id: toastId });
      setApplyStep("applying");

      // 4. Start polling for the submit outcome
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = setInterval(async () => {
        const { data: rawData, error } = await supabase
          .from("jobs" as any)
          .select("applied_status, browserbase_session_id")
          .eq("id", selectedJob.id)
          .single();

        if (error) return;
        const data = rawData as any;
        const status = data?.applied_status;
        const sessionId = data?.browserbase_session_id;

        if (status === "applied") {
          setApplyStep("success");
          setBbSessionId(sessionId || null);
          setJobs((prev) =>
            prev.map((j) => (j.id === selectedJob.id ? { ...j, applied_status: "applied" } : j))
          );
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else if (status === "failed") {
          setApplyStep("error");
          setBbSessionId(sessionId || null);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      }, 2000);

    } catch (err: any) {
      console.error("Submission error:", err);
      toast.error(err.message || "Failed to initiate submission.", { id: toastId });
    } finally {
      setIsSavingMissingData(false);
    }
  };

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["greenhouse", "lever", "workable", "wellfound"]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [isLoading, setIsLoading] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);

  // Fetch jobs on mount for initial platforms
  useEffect(() => {
    setMounted(true);
    fetchJobs(selectedPlatforms, true);
  }, []);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) => {
      const next = prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId];
      
      // Automatically refetch when platform selection updates
      fetchJobs(next, false);
      return next;
    });
  };

  const fetchJobs = async (platformsToFetch: string[], isInitial: boolean) => {
    if (mode === "saved") {
      setIsLoading(true);
      setWarningMessage(null);
      try {
        const { data, error } = await supabase
          .from("jobs" as any)
          .select("*")
          .eq("saved_status", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setJobs((data as any) || []);
      } catch (err: any) {
        console.error("Error fetching saved jobs:", err);
        toast.error("Failed to load saved jobs.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (platformsToFetch.length === 0) {
      setJobs([]);
      return;
    }

    setIsLoading(true);
    setWarningMessage(null);

    try {
      const response = await fetch("/api/fetch-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          platforms: platformsToFetch,
          forceRefresh: !isInitial 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch jobs.");
      }

      setJobs(result.jobs || []);
      
      if (result.warning) {
        setWarningMessage(result.warning);
      }
    } catch (err: any) {
      console.error("Error fetching jobs:", err);
      toast.error(err.message || "Failed to retrieve matching jobs.");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle saved status directly in Supabase using Client SDK
  const handleToggleSaveJob = async (jobId: string, currentSaved: boolean) => {
    const newSaved = !currentSaved;
    
    // Optimistic UI update
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, saved_status: newSaved } : j))
    );

    try {
      const { error } = await supabase
        .from("jobs" as any)
        .update({ saved_status: newSaved } as any)
        .eq("id", jobId);

      if (error) throw error;

      toast.success(newSaved ? "Job saved to your list!" : "Job removed from saved list.");
      
      if (mode === "saved" && !newSaved) {
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
      }
      
      // Update activity log dynamically
      const targetJob = jobs.find((j) => j.id === jobId);
      if (targetJob && newSaved) {
        const newAct: Activity = {
          id: Math.random().toString(),
          type: "job_save",
          title: `Saved job: ${targetJob.title} at ${targetJob.company}`,
          timestamp: new Date().toISOString(),
        };
        setActivities((prev) => [newAct, ...prev].slice(0, 5));
      }
    } catch (err: any) {
      console.error("Save job toggle error:", err);
      toast.error("Could not update job status.");
      // Rollback UI state
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, saved_status: currentSaved } : j))
      );
    }
  };

  // Match score color helper
  const getMatchScoreBadgeColor = (score: number) => {
    if (score >= 85) return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
    if (score >= 70) return "bg-amber-500/10 text-amber-600 border border-amber-500/20";
    return "bg-rose-500/10 text-rose-600 border border-rose-500/20";
  };

  const getMatchScoreBarColor = (score: number) => {
    if (score >= 85) return "bg-emerald-500";
    if (score >= 70) return "bg-amber-500";
    return "bg-rose-500";
  };

  const displayName = profile?.full_name ?? "User";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Welcome Banner */}
          {mode === "saved" ? (
            <div className="rounded-2xl border border-muted bg-gradient-to-br from-card to-muted/20 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
              <div className="space-y-2 relative z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                  <HugeiconsIcon icon={SparklesIcon} size={14} className="animate-pulse" />
                  Your Saved Positions
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  Saved Jobs
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
                  Manage, track, and apply to your bookmarked positions using the background AI recruiter.
                </p>
              </div>
              <div className="shrink-0 relative z-10">
                <Button onClick={() => fetchJobs([], false)} disabled={isLoading} className="w-full md:w-auto flex items-center gap-2">
                  <HugeiconsIcon icon={SearchIcon} size={16} />
                  {isLoading ? "Refreshing..." : "Refresh Saved"}
                </Button>
              </div>
              <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary/5 blur-3xl -translate-y-12 translate-x-12" />
            </div>
          ) : (
            <div className="rounded-2xl border border-muted bg-gradient-to-br from-card to-muted/20 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
              <div className="space-y-2 relative z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                  <HugeiconsIcon icon={SparklesIcon} size={14} className="animate-pulse" />
                  AI Recruiter Active
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  Find Your Next Role, {displayName.split(" ")[0]}!
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
                  We've analyzed your resume profile and are searching top platforms in real-time to match jobs to your technical stack.
                </p>
              </div>
              <div className="shrink-0 relative z-10">
                <Button onClick={() => fetchJobs(selectedPlatforms, false)} disabled={isLoading} className="w-full md:w-auto flex items-center gap-2">
                  <HugeiconsIcon icon={SearchIcon} size={16} />
                  {isLoading ? "Searching..." : "Search Jobs"}
                </Button>
              </div>
              <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary/5 blur-3xl -translate-y-12 translate-x-12" />
            </div>
          )}

          {/* Selectable Platform Cards - Only show in search mode */}
          {mode === "all" && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Target Job Boards</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {PLATFORMS.map((platform) => {
                  const isSelected = selectedPlatforms.includes(platform.id);
                  return (
                    <div
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={`relative cursor-pointer select-none rounded-xl border p-4 text-center transition-all ${
                        isSelected
                          ? `${platform.color} border-current ring-1 ring-current`
                          : "border-border hover:border-muted-foreground/30 bg-card"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-10 w-24 flex items-center justify-center bg-white/95 rounded-md p-1.5 shadow-sm border border-muted/30 shrink-0 select-none">
                          <img
                            src={platform.logo}
                            alt={platform.name}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <span className="text-xs font-bold tracking-tight">{platform.name}</span>
                        <div className="flex items-center gap-1.5">
                          <div className={`h-2 w-2 rounded-full ${isSelected ? "bg-current" : "bg-muted-foreground/30"}`} />
                          <span className="text-[9px] uppercase font-semibold text-muted-foreground/80">
                            {isSelected ? "Active" : "Disabled"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Warning Message (e.g. Brave API Key missing warning) */}
          {warningMessage && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs font-medium text-amber-700 dark:text-amber-400 flex items-start gap-2.5 animate-in fade-in duration-300">
              <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <span className="font-semibold block mb-0.5">Note: Simulation Mode</span>
                {warningMessage}
              </div>
            </div>
          )}

          {/* Jobs Matches List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">
                {mode === "saved" ? "Your Saved Jobs" : "Best Job Matches"}
              </h2>
              <span className="text-xs text-muted-foreground font-medium">
                {jobs.length} position{jobs.length !== 1 ? "s" : ""} {mode === "saved" ? "saved" : "matched"}
              </span>
            </div>

            {isLoading ? (
              // Loading Skeleton State
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="rounded-xl border border-muted p-5 bg-card/50 space-y-4 animate-pulse">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-muted shrink-0" />
                        <div className="space-y-2">
                          <div className="h-4 w-48 rounded bg-muted" />
                          <div className="h-3 w-32 rounded bg-muted" />
                        </div>
                      </div>
                      <div className="h-6 w-20 rounded bg-muted" />
                    </div>
                    <div className="h-10 w-full rounded bg-muted" />
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex gap-2">
                        <div className="h-5 w-16 rounded bg-muted" />
                        <div className="h-5 w-20 rounded bg-muted" />
                      </div>
                      <div className="h-8 w-24 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              // Empty State
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center bg-muted/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                  <HugeiconsIcon icon={BriefcaseIcon} size={24} />
                </div>
                <h3 className="font-semibold text-base">No Matching Jobs</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                  Select job platforms above and click "Search Jobs" to find matches using your profile skills and experience.
                </p>
              </div>
            ) : (
              // Active Jobs Cards List
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card key={job.id} className="overflow-hidden border border-muted bg-card hover:border-muted-foreground/30 transition-all shadow-sm">
                    <CardContent className="p-5 space-y-4">
                      
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {/* Company Logo with Fallback Initials */}
                          <div className="h-11 w-11 rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center shrink-0">
                            {job.company_logo ? (
                              <img
                                src={job.company_logo}
                                alt={job.company}
                                className="h-full w-full object-contain p-1"
                                onError={(e) => {
                                  // Fallback: Remove image and show initials
                                  e.currentTarget.style.display = "none";
                                  const textNode = document.createTextNode(job.company.slice(0, 2).toUpperCase());
                                  e.currentTarget.parentElement?.appendChild(textNode);
                                }}
                              />
                            ) : (
                              <span className="text-xs font-bold text-muted-foreground">{job.company.slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-base leading-snug hover:text-primary transition-all cursor-pointer">
                              {job.title}
                            </h3>
                            <p className="text-xs font-semibold text-muted-foreground">{job.company}</p>
                          </div>
                        </div>

                        {/* Match Score Badge */}
                        <div className={`rounded-full px-2.5 py-0.5 text-xs font-bold shrink-0 ${getMatchScoreBadgeColor(job.match_score || 70)}`}>
                          {job.match_score || 70}% Match
                        </div>
                      </div>

                      {/* Description */}
                      {job.description && (
                        <p className="text-xs leading-relaxed text-muted-foreground/90 line-clamp-2">
                          {job.description}
                        </p>
                      )}

                      {/* Matching Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                          <span>ATS Compatibility</span>
                          <span>{job.match_score || 70}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ease-in-out ${getMatchScoreBarColor(job.match_score || 70)}`}
                            style={{ width: `${job.match_score || 70}%` }}
                          />
                        </div>
                      </div>

                      {/* Info Metadata & Actions Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t text-xs">
                        
                        {/* Info details */}
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-muted-foreground font-medium">
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <HugeiconsIcon icon={Location01Icon} size={14} className="shrink-0 text-muted-foreground/60" />
                              {job.location}
                            </span>
                          )}
                          {job.salary && job.salary !== "Not specified" && (
                            <span className="flex items-center gap-1">
                              <HugeiconsIcon icon={DollarIcon} size={14} className="shrink-0 text-muted-foreground/60" />
                              {job.salary}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <HugeiconsIcon icon={BriefcaseIcon} size={14} className="shrink-0 text-muted-foreground/60" />
                            {job.job_type || "Full-time"} ({job.experience_level || "Mid-level"})
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {/* Platform Badge */}
                          <span className="text-[10px] uppercase font-bold bg-muted border rounded px-2 py-0.5 text-muted-foreground mr-1">
                            {job.platform}
                          </span>

                          {/* Applied Status Badge */}
                          {job.applied_status && job.applied_status !== "not_applied" && (
                            <span className={`text-[10px] uppercase font-bold border rounded px-2.5 py-0.5 mr-1 tracking-wider ${
                              job.applied_status === "applied" 
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                : job.applied_status === "missing_profile_info"
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 animate-pulse"
                                : job.applied_status === "failed"
                                ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                                : job.applied_status === "applying"
                                ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20 animate-pulse"
                                : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 animate-pulse"
                            }`}>
                              {job.applied_status === "applied" && "Submitted"}
                              {job.applied_status === "missing_profile_info" && "Missing Info"}
                              {job.applied_status === "failed" && "Failed"}
                              {job.applied_status === "applying" && "Applying"}
                              {job.applied_status === "detecting" && "In Queue"}
                            </span>
                          )}
                          
                          {/* Save toggle button */}
                          <Button
                            onClick={() => handleToggleSaveJob(job.id, job.saved_status)}
                            variant="ghost"
                            size="icon-sm"
                            className={job.saved_status ? "text-primary hover:text-primary/95" : "text-muted-foreground hover:text-foreground"}
                          >
                            <HugeiconsIcon icon={BookmarkIcon} size={16} className={job.saved_status ? "fill-current" : ""} />
                            <span className="sr-only">Save</span>
                          </Button>

                          {/* Apply Now button */}
                          <Button size="sm" onClick={() => handleOpenApplyOptions(job)}>
                            Open Job URL to Apply
                          </Button>
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Profile Completeness Gauge */}
          <ProfileCompletenessCard profile={profile} />

          {/* Recent Activity Timeline */}
          <Card className="border border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <CardDescription className="text-xs">Your job hunting timeline activities.</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-xs italic text-muted-foreground text-center py-4">No recent activity logs.</p>
              ) : (
                <div className="relative pl-4 border-l border-muted space-y-5 text-xs">
                  {activities.map((act) => (
                    <div key={act.id} className="relative space-y-1">
                      {/* Timeline Node Color based on action type */}
                      <div className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border border-card ${
                        act.type === "resume_upload" ? "bg-blue-500" : act.type === "job_save" ? "bg-amber-500" : "bg-emerald-500"
                      }`} />
                      <p className="font-semibold text-foreground/95">{act.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {mounted
                          ? `${new Date(act.timestamp).toLocaleDateString()} at ${new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Apply Options and Progress Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">
              {applyStep === "options" && "Choose Application Method"}
              {applyStep === "detecting" && "Analyzing Job Form..."}
              {applyStep === "missing_info" && "Profile Information Required"}
              {applyStep === "review_details" && "Verify Form Details"}
              {applyStep === "applying" && "Filling Out Application Form..."}
              {applyStep === "success" && "Application Submitted!"}
              {applyStep === "error" && "Application Failed"}
              {applyStep === "limit_reached" && "Daily Limit Reached"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedJob?.title} at <strong className="text-foreground">{selectedJob?.company}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {applyStep === "options" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-muted hover:border-primary/30 bg-card hover:bg-muted/10 transition-all cursor-pointer flex items-start gap-3" onClick={handleApplyManually}>
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0 text-secondary-foreground font-semibold text-sm">1</div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Apply Manually</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">We will redirect you directly to the job board in a new tab so you can fill out and submit the application manually.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10 transition-all cursor-pointer flex items-start gap-3" onClick={handleApplyAutomatically}>
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-semibold text-sm">2</div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                       Apply Automatically using AI Agent
                      <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary hover:bg-primary/10 py-0 px-1.5 leading-none">Powered by Stagehand</Badge>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Our background AI agent will launch a secure browser, automatically detect required fields, map them to your profile, attach your resume, and submit the application.</p>
                  </div>
                </div>
              </div>
            )}

            {applyStep === "detecting" && (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <div className="space-y-1">
                  <p className="font-semibold text-sm">Connecting to Browserbase session...</p>
                  <p className="text-xs text-muted-foreground">The AI agent is opening the job application page and parsing the form inputs using Stagehand...</p>
                </div>
              </div>
            )}

            {applyStep === "review_details" && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-400 text-xs flex items-start gap-2.5">
                  <svg className="h-4.5 w-4.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="font-bold block mb-0.5">Verify Application Details</span>
                    Below are the form fields detected on this job application. Please verify that the values are correct, and fill in any missing details.
                  </div>
                </div>

                <div className="space-y-3.5 border rounded-xl p-4 bg-muted/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Form Field Data:</h4>

                  {(selectedJob as any)?.detected_fields?.map((field: any) => {
                    const isMissing = missingFields.includes(field.name);
                    const isRequired = field.required;

                    if (field.type === "file") {
                      return (
                        <div key={field.name} className="space-y-1.5">
                          <label className="text-xs font-bold text-foreground/80 flex items-center gap-1">
                            {field.label || field.name}
                            {isRequired && <span className="text-rose-500">*</span>}
                          </label>
                          <div className={`relative border border-dashed rounded-lg p-4 hover:border-primary/50 transition-colors flex flex-col items-center justify-center text-center cursor-pointer bg-muted/20 ${isMissing ? "border-rose-500/50 bg-rose-500/5" : "border-input"}`}>
                            <input 
                              type="file" 
                              accept=".pdf,.doc,.docx"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setMissingResumeFile(e.target.files[0]);
                                }
                              }}
                            />
                            <svg className="h-5 w-5 text-muted-foreground mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-xs font-medium text-foreground">
                              {missingResumeFile ? missingResumeFile.name : "Select or drag resume file"}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              PDF, DOC, or DOCX (Max 5MB)
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={field.name} className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground/80 flex items-center gap-1">
                          {field.label || field.name}
                          {isRequired && <span className="text-rose-500">*</span>}
                        </label>
                        <input 
                          type="text" 
                          className={`w-full text-sm bg-background border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary ${isMissing && !fieldAnswers[field.name] ? "border-rose-500 focus:ring-rose-500 focus:border-rose-500 bg-rose-500/5" : "border-input"}`}
                          value={fieldAnswers[field.name] || ""}
                          onChange={(e) => setFieldAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                          placeholder={`Enter ${field.label || field.name}`}
                        />
                        {isMissing && !fieldAnswers[field.name] && (
                          <span className="text-[10px] text-rose-500 font-medium block">This field is required by the form but missing in your profile.</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button 
                    className="flex-1" 
                    onClick={handleConfirmAndSubmit}
                    disabled={isSavingMissingData}
                  >
                    {isSavingMissingData ? "Submitting..." : "Confirm & Submit"}
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setApplyStep("options")} disabled={isSavingMissingData}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {applyStep === "missing_info" && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 text-xs flex items-start gap-2.5">
                  <svg className="h-4.5 w-4.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <span className="font-bold block mb-0.5">Missing Required Profile Information</span>
                    The job application requires specific fields that are missing from your profile. Fill them out below to resume applying.
                  </div>
                </div>

                <div className="space-y-3.5 border rounded-xl p-4 bg-muted/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Complete Profile Fields:</h4>
                  
                  {missingFields.includes("full_name") && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground/80">Full Name</label>
                      <input 
                        type="text" 
                        className="w-full text-sm bg-background border border-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                        value={missingFullName}
                        onChange={(e) => setMissingFullName(e.target.value)}
                        placeholder="First and Last Name"
                      />
                    </div>
                  )}

                  {missingFields.includes("email") && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground/80">Email Address</label>
                      <input 
                        type="email" 
                        className="w-full text-sm bg-background border border-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                        value={missingEmail}
                        onChange={(e) => setMissingEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                  )}

                  {missingFields.includes("phone") && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground/80">Phone Number</label>
                      <input 
                        type="text" 
                        className="w-full text-sm bg-background border border-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                        value={missingPhone}
                        onChange={(e) => setMissingPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  )}

                  {missingFields.includes("location") && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground/80">City, Country</label>
                      <input 
                        type="text" 
                        className="w-full text-sm bg-background border border-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                        value={missingLocation}
                        onChange={(e) => setMissingLocation(e.target.value)}
                        placeholder="e.g. San Francisco, CA"
                      />
                    </div>
                  )}

                  {missingFields.includes("links") && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground/80">LinkedIn URL</label>
                      <input 
                        type="text" 
                        className="w-full text-sm bg-background border border-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                        value={missingLinks}
                        onChange={(e) => setMissingLinks(e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                  )}

                  {missingFields.includes("resume") && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground/80">Upload Resume (PDF, DOC, DOCX)</label>
                      <div className="relative border border-dashed border-input rounded-lg p-4 hover:border-primary/50 transition-colors flex flex-col items-center justify-center text-center cursor-pointer bg-muted/20">
                        <input 
                          type="file" 
                          accept=".pdf,.doc,.docx"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setMissingResumeFile(e.target.files[0]);
                            }
                          }}
                        />
                        <svg className="h-5 w-5 text-muted-foreground mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-xs font-medium text-foreground">
                          {missingResumeFile ? missingResumeFile.name : "Select or drag resume file"}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          PDF, DOC, or DOCX (Max 5MB)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button 
                    className="flex-1" 
                    onClick={handleSaveMissingFields}
                    disabled={isSavingMissingData}
                  >
                    {isSavingMissingData ? "Saving..." : "Save & Resume Application"}
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setApplyStep("options")} disabled={isSavingMissingData}>
                    Back
                  </Button>
                </div>
              </div>
            )}

            {applyStep === "applying" && (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                <div className="h-10 w-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                <div className="space-y-1">
                  <p className="font-semibold text-sm">Mapping fields & applying...</p>
                  <p className="text-xs text-muted-foreground">The AI agent is filling in your contact details, uploading your resume, and submitting the application form.</p>
                </div>
              </div>
            )}

            {applyStep === "success" && (
              <div className="flex flex-col items-center justify-center py-4 text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-base text-foreground">Success! Applied Successfully</p>
                  <p className="text-xs text-muted-foreground">Your job application has been successfully submitted by the AI agent.</p>
                </div>

                {bbSessionId && (
                  <div className="w-full bg-muted/30 border p-3 rounded-lg text-xs space-y-1">
                    <p className="font-semibold text-muted-foreground text-left">Browserbase Session ID:</p>
                    <p className="font-mono text-foreground text-left break-all bg-card p-2 rounded border">{bbSessionId}</p>
                    <a
                      href={`https://www.browserbase.com/sessions/${bbSessionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline font-bold mt-1.5"
                    >
                      View Live Session Recording
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}

                <Button className="w-full" onClick={() => setApplyDialogOpen(false)}>
                  Done
                </Button>
              </div>
            )}

            {applyStep === "error" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-2 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-base text-foreground">Application Automation Failed</p>
                    <p className="text-xs text-muted-foreground">The AI agent encountered an issue filling or submitting the form.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button className="flex-1" onClick={handleApplyManually}>
                    Apply Manually Instead
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setApplyDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}

            {applyStep === "limit_reached" && (
              <div className="space-y-5 text-center py-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-base text-foreground">Daily Limit Reached</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    {limitErrorMessage}
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => {
                      setApplyDialogOpen(false);
                      router.push("/dashboard/billing");
                    }}
                  >
                    Upgrade Plan
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setApplyDialogOpen(false)}>
                    Dismiss
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

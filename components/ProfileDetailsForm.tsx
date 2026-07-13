"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  BookOpen01Icon,
  Award01Icon,
  BriefcaseIcon,
  UniversityIcon,
  FolderCodeIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";

interface Project {
  title: string;
  description?: string;
  technologies?: string[];
}

interface WorkExperience {
  company: string;
  jobTitle: string;
  duration?: string;
  responsibilities?: string[];
}

interface Education {
  school: string;
  degree?: string;
  fieldOfStudy?: string;
  duration?: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  summary: string | null;
  skills: string[] | null;
  current_company: string | null;
  current_job_title: string | null;
  projects: Project[] | null;
  work_experience: WorkExperience[] | null;
  education: Education[] | null;
  certifications: string[] | null;
  links: string[] | null;
}

interface ProfileDetailsFormProps {
  initialProfile: Profile;
  missingJobId?: string;
  missingFields?: string[];
  jobTitle?: string;
  companyName?: string;
}

export default function ProfileDetailsForm({ 
  initialProfile,
  missingJobId,
  missingFields = [],
  jobTitle = "",
  companyName = "",
}: ProfileDetailsFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Form states
  const [fullName, setFullName] = useState(initialProfile.full_name || "");
  const [email, setEmail] = useState(initialProfile.email || "");
  const [phone, setPhone] = useState(initialProfile.phone || "");
  const [location, setLocation] = useState(initialProfile.location || "");
  const [summary, setSummary] = useState(initialProfile.summary || "");
  const [skillsStr, setSkillsStr] = useState((initialProfile.skills || []).join(", "));
  const [certificationsStr, setCertificationsStr] = useState((initialProfile.certifications || []).join(", "));
  const [linksStr, setLinksStr] = useState((initialProfile.links || []).join(", "));
  
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>(
    Array.isArray(initialProfile.work_experience) ? initialProfile.work_experience : []
  );
  const [education, setEducation] = useState<Education[]>(
    Array.isArray(initialProfile.education) ? initialProfile.education : []
  );
  const [projects, setProjects] = useState<Project[]>(
    Array.isArray(initialProfile.projects) ? initialProfile.projects : []
  );

  const handleCancel = () => {
    // Reset states
    setFullName(initialProfile.full_name || "");
    setEmail(initialProfile.email || "");
    setPhone(initialProfile.phone || "");
    setLocation(initialProfile.location || "");
    setSummary(initialProfile.summary || "");
    setSkillsStr((initialProfile.skills || []).join(", "));
    setCertificationsStr((initialProfile.certifications || []).join(", "));
    setLinksStr((initialProfile.links || []).join(", "));
    setWorkExperience(Array.isArray(initialProfile.work_experience) ? initialProfile.work_experience : []);
    setEducation(Array.isArray(initialProfile.education) ? initialProfile.education : []);
    setProjects(Array.isArray(initialProfile.projects) ? initialProfile.projects : []);
    setIsEditing(false);
  };

  // Projects logic
  const handleAddProject = () => {
    setProjects([...projects, { title: "", description: "", technologies: [] }]);
  };
  const handleRemoveProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };
  const handleProjectFieldChange = (index: number, field: keyof Project, value: string) => {
    const updated = [...projects];
    if (field === "technologies") {
      updated[index] = {
        ...updated[index],
        [field]: value.split(",").map((t) => t.trim()).filter((t) => t.length > 0),
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    setProjects(updated);
  };

  // Work Experience logic
  const handleAddExperience = () => {
    setWorkExperience([...workExperience, { company: "", jobTitle: "", duration: "", responsibilities: [] }]);
  };
  const handleRemoveExperience = (index: number) => {
    setWorkExperience(workExperience.filter((_, i) => i !== index));
  };
  const handleExperienceFieldChange = (index: number, field: keyof WorkExperience, value: string) => {
    const updated = [...workExperience];
    if (field === "responsibilities") {
      // Split by newlines or list bullets
      updated[index] = {
        ...updated[index],
        [field]: value.split("\n").map((r) => r.trim()).filter((r) => r.length > 0),
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    setWorkExperience(updated);
  };

  // Education logic
  const handleAddEducation = () => {
    setEducation([...education, { school: "", degree: "", fieldOfStudy: "", duration: "" }]);
  };
  const handleRemoveEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };
  const handleEducationFieldChange = (index: number, field: keyof Education, value: string) => {
    const updated = [...education];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setEducation(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Saving profile updates...");

    try {
      const parsedSkills = skillsStr
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const parsedCerts = certificationsStr
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const parsedLinks = linksStr
        .split(",")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      // Auto-derive current company & job title from the first experience if present
      const derivedCompany = workExperience?.[0]?.company || "";
      const derivedJobTitle = workExperience?.[0]?.jobTitle || "";

      const response = await fetch("/api/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName || null,
          email: email || null,
          phone: phone || null,
          location: location || null,
          summary: summary || null,
          skills: parsedSkills.length > 0 ? parsedSkills : null,
          current_company: derivedCompany || null,
          current_job_title: derivedJobTitle || null,
          projects: projects.length > 0 ? projects : null,
          work_experience: workExperience.length > 0 ? workExperience : null,
          education: education.length > 0 ? education : null,
          certifications: parsedCerts.length > 0 ? parsedCerts : null,
          links: parsedLinks.length > 0 ? parsedLinks : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile.");
      }

      toast.success("Profile updated successfully!", { id: toastId });
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      console.error("Save profile error:", err);
      toast.error(err.message || "Could not save profile changes.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResumeApply = async () => {
    if (!missingJobId) return;

    setIsResuming(true);
    const toastId = toast.loading("Verifying profile fields and resuming application...");

    // Double check if any fields are still empty on the client side
    const currentMissing: string[] = [];
    if (missingFields.includes("full_name") && !fullName.trim()) currentMissing.push("Full Name");
    if (missingFields.includes("email") && !email.trim()) currentMissing.push("Email");
    if (missingFields.includes("phone") && !phone.trim()) currentMissing.push("Phone");
    if (missingFields.includes("location") && !location.trim()) currentMissing.push("Location");
    if (missingFields.includes("links") && !linksStr.trim()) currentMissing.push("Links/LinkedIn");

    if (currentMissing.length > 0) {
      toast.error(`Please fill in required fields: ${currentMissing.join(", ")} before resuming.`, { id: toastId });
      setIsResuming(false);
      return;
    }

    try {
      const response = await fetch("/api/jobs/apply-auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: missingJobId }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to resume application.");
      }

      toast.success("AI Application resumed in background!", { id: toastId });
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Resume apply error:", err);
      toast.error(err.message || "Failed to resume application.", { id: toastId });
    } finally {
      setIsResuming(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {missingJobId && (
        <Card className="border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/10 shadow-sm animate-in fade-in duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-amber-800 dark:text-amber-400 flex items-center gap-2 text-base font-bold">
              <HugeiconsIcon icon={SparklesIcon} size={18} className="animate-pulse text-amber-500" />
              Complete Profile for {jobTitle}
            </CardTitle>
            <CardDescription className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">
              Our AI automation agent detected that applying for the role at <strong>{companyName}</strong> requires specific fields. Please complete them below, save your changes, and click resume.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {missingFields.map((field) => (
                <span
                  key={field}
                  className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-400 capitalize"
                >
                  {field.replace("_", " ")}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button onClick={handleResumeApply} disabled={isResuming} className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm" size="sm">
                {isResuming ? "Resuming Application..." : "Resume Application"}
              </Button>
              <Button onClick={() => router.push("/dashboard")} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border border-muted">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            {isEditing
              ? "Modify your parsed details below and save your changes."
              : "Your personal and professional information extracted from your resume."}
          </CardDescription>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="w-full sm:w-auto">
            Edit Details
          </Button>
        ) : (
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button onClick={handleCancel} variant="ghost" size="sm" disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} size="sm" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-muted/50 p-1 h-auto gap-1">
            <TabsTrigger value="basic" className="flex items-center gap-2 py-2">
              <HugeiconsIcon icon={UserIcon} size={16} />
              <span className="hidden sm:inline">Basic Info</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2 py-2">
              <HugeiconsIcon icon={BookOpen01Icon} size={16} />
              <span className="hidden sm:inline">Summary</span>
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2 py-2">
              <HugeiconsIcon icon={Award01Icon} size={16} />
              <span className="hidden sm:inline">Skills & Certs</span>
            </TabsTrigger>
            <TabsTrigger value="experience" className="flex items-center gap-2 py-2">
              <HugeiconsIcon icon={BriefcaseIcon} size={16} />
              <span className="hidden sm:inline">Experience</span>
            </TabsTrigger>
            <TabsTrigger value="education" className="flex items-center gap-2 py-2">
              <HugeiconsIcon icon={UniversityIcon} size={16} />
              <span className="hidden sm:inline">Education</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2 py-2">
              <HugeiconsIcon icon={FolderCodeIcon} size={16} />
              <span className="hidden sm:inline">Projects</span>
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 pt-2">
            {isEditing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className={missingFields.includes("full_name") && !fullName ? "text-rose-500 flex items-center gap-1.5" : ""}>
                    Full Name
                    {missingFields.includes("full_name") && !fullName && <span className="text-[10px] bg-rose-500/10 text-rose-600 px-1.5 py-0.5 rounded-full font-bold">Required for AI Apply</span>}
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    className={missingFields.includes("full_name") && !fullName ? "border-rose-500 ring-rose-500/20 focus-visible:ring-rose-500/30" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className={missingFields.includes("email") && !email ? "text-rose-500 flex items-center gap-1.5" : ""}>
                    Email Address
                    {missingFields.includes("email") && !email && <span className="text-[10px] bg-rose-500/10 text-rose-600 px-1.5 py-0.5 rounded-full font-bold">Required for AI Apply</span>}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={missingFields.includes("email") && !email ? "border-rose-500 ring-rose-500/20 focus-visible:ring-rose-500/30" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className={missingFields.includes("phone") && !phone ? "text-rose-500 flex items-center gap-1.5" : ""}>
                    Phone Number
                    {missingFields.includes("phone") && !phone && <span className="text-[10px] bg-rose-500/10 text-rose-600 px-1.5 py-0.5 rounded-full font-bold">Required for AI Apply</span>}
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className={missingFields.includes("phone") && !phone ? "border-rose-500 ring-rose-500/20 focus-visible:ring-rose-500/30" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className={missingFields.includes("location") && !location ? "text-rose-500 flex items-center gap-1.5" : ""}>
                    Location
                    {missingFields.includes("location") && !location && <span className="text-[10px] bg-rose-500/10 text-rose-600 px-1.5 py-0.5 rounded-full font-bold">Required for AI Apply</span>}
                  </Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="San Francisco, CA"
                    className={missingFields.includes("location") && !location ? "border-rose-500 ring-rose-500/20 focus-visible:ring-rose-500/30" : ""}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="links" className={missingFields.includes("links") && !linksStr ? "text-rose-500 flex items-center gap-1.5" : ""}>
                    Web Links (comma-separated)
                    {missingFields.includes("links") && !linksStr && <span className="text-[10px] bg-rose-500/10 text-rose-600 px-1.5 py-0.5 rounded-full font-bold">Required for AI Apply</span>}
                  </Label>
                  <Input
                    id="links"
                    value={linksStr}
                    onChange={(e) => setLinksStr(e.target.value)}
                    placeholder="https://github.com/yourusername, https://linkedin.com/in/yourusername"
                    className={missingFields.includes("links") && !linksStr ? "border-rose-500 ring-rose-500/20 focus-visible:ring-rose-500/30" : ""}
                  />
                  <p className="text-xs text-muted-foreground">Attach portfolio, GitHub, LinkedIn, or personal URLs.</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div className={`rounded-lg border p-4 ${missingFields.includes("full_name") && !fullName ? "border-rose-500/50 bg-rose-500/[0.02]" : "bg-card/40"}`}>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    Full Name
                    {missingFields.includes("full_name") && !fullName && <span className="text-[9px] bg-rose-500/10 text-rose-600 px-1.5 py-0.2 rounded-full font-bold">Missing</span>}
                  </p>
                  <p className="text-sm font-medium">{fullName || <span className="italic text-muted-foreground/60">Not provided yet</span>}</p>
                </div>
                <div className={`rounded-lg border p-4 ${missingFields.includes("email") && !email ? "border-rose-500/50 bg-rose-500/[0.02]" : "bg-card/40"}`}>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    Email Address
                    {missingFields.includes("email") && !email && <span className="text-[9px] bg-rose-500/10 text-rose-600 px-1.5 py-0.2 rounded-full font-bold">Missing</span>}
                  </p>
                  <p className="text-sm font-medium">{email || <span className="italic text-muted-foreground/60">Not provided yet</span>}</p>
                </div>
                <div className={`rounded-lg border p-4 ${missingFields.includes("phone") && !phone ? "border-rose-500/50 bg-rose-500/[0.02]" : "bg-card/40"}`}>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    Phone Number
                    {missingFields.includes("phone") && !phone && <span className="text-[9px] bg-rose-500/10 text-rose-600 px-1.5 py-0.2 rounded-full font-bold">Missing</span>}
                  </p>
                  <p className="text-sm font-medium">{phone || <span className="italic text-muted-foreground/60">Not provided yet</span>}</p>
                </div>
                <div className={`rounded-lg border p-4 ${missingFields.includes("location") && !location ? "border-rose-500/50 bg-rose-500/[0.02]" : "bg-card/40"}`}>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    Location
                    {missingFields.includes("location") && !location && <span className="text-[9px] bg-rose-500/10 text-rose-600 px-1.5 py-0.2 rounded-full font-bold">Missing</span>}
                  </p>
                  <p className="text-sm font-medium">{location || <span className="italic text-muted-foreground/60">Not provided yet</span>}</p>
                </div>
                <div className={`rounded-lg border p-4 sm:col-span-2 ${missingFields.includes("links") && !linksStr ? "border-rose-500/50 bg-rose-500/[0.02]" : "bg-card/40"}`}>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    Web Links
                    {missingFields.includes("links") && !linksStr && <span className="text-[9px] bg-rose-500/10 text-rose-600 px-1.5 py-0.2 rounded-full font-bold">Missing</span>}
                  </p>
                  {linksStr ? (
                    <div className="flex flex-wrap gap-3">
                      {linksStr.split(",").map((l) => l.trim()).filter((l) => l.length > 0).map((link, index) => (
                        <a
                          key={index}
                          href={link.startsWith("http") ? link : `https://${link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium break-all flex items-center gap-1.5"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {link}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-muted-foreground/60">No web links provided yet.</p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Professional Summary Tab */}
          <TabsContent value="summary" className="space-y-4 pt-2">
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="summary">Professional Summary</Label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Describe your professional background, strengths, and goals..."
                  rows={6}
                />
              </div>
            ) : (
              <div className="rounded-lg border bg-card/40 p-5">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Professional Summary</p>
                {summary ? (
                  <p className="text-sm leading-relaxed text-foreground/95">{summary}</p>
                ) : (
                  <p className="text-sm italic text-muted-foreground/60">No professional summary provided yet.</p>
                )}
              </div>
            )}
          </TabsContent>

          {/* Technical Skills & Certs Tab */}
          <TabsContent value="skills" className="space-y-6 pt-2">
            {isEditing ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="skills">Technical Skills (comma-separated)</Label>
                  <Input
                    id="skills"
                    value={skillsStr}
                    onChange={(e) => setSkillsStr(e.target.value)}
                    placeholder="React, Next.js, TypeScript, Node.js, Python, PostgreSQL"
                  />
                  <p className="text-xs text-muted-foreground">Separate each skill with a comma.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certifications">Certifications (comma-separated)</Label>
                  <Input
                    id="certifications"
                    value={certificationsStr}
                    onChange={(e) => setCertificationsStr(e.target.value)}
                    placeholder="AWS Solutions Architect, Google Cloud Engineer, Scrum Master"
                  />
                  <p className="text-xs text-muted-foreground">Separate each certification with a comma.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-lg border bg-card/40 p-5">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">Technical Skills</p>
                  {skillsStr ? (
                    <div className="flex flex-wrap gap-2">
                      {skillsStr.split(",").map((s) => s.trim()).filter((s) => s.length > 0).map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-muted-foreground/60">No technical skills listed yet.</p>
                  )}
                </div>

                <div className="rounded-lg border bg-card/40 p-5">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">Certifications</p>
                  {certificationsStr ? (
                    <div className="flex flex-wrap gap-2">
                      {certificationsStr.split(",").map((c) => c.trim()).filter((c) => c.length > 0).map((cert, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground border"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-muted-foreground/60">No certifications listed yet.</p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Work Experience Tab */}
          <TabsContent value="experience" className="space-y-4 pt-2">
            {isEditing ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-semibold">Work History</Label>
                  <Button type="button" onClick={handleAddExperience} variant="outline" size="sm">
                    + Add Experience
                  </Button>
                </div>
                {workExperience.length === 0 ? (
                  <p className="text-sm italic text-muted-foreground text-center py-4">No work experience items added yet.</p>
                ) : (
                  <div className="space-y-6">
                    {workExperience.map((exp, idx) => (
                      <div key={idx} className="relative rounded-lg border p-4 bg-muted/10 space-y-4">
                        <Button
                          type="button"
                          onClick={() => handleRemoveExperience(idx)}
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          Remove
                        </Button>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`exp-company-${idx}`}>Company Name</Label>
                            <Input
                              id={`exp-company-${idx}`}
                              value={exp.company}
                              onChange={(e) => handleExperienceFieldChange(idx, "company", e.target.value)}
                              placeholder="e.g. Google"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`exp-title-${idx}`}>Job Title</Label>
                            <Input
                              id={`exp-title-${idx}`}
                              value={exp.jobTitle}
                              onChange={(e) => handleExperienceFieldChange(idx, "jobTitle", e.target.value)}
                              placeholder="e.g. Software Engineer"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`exp-duration-${idx}`}>Duration</Label>
                          <Input
                            id={`exp-duration-${idx}`}
                            value={exp.duration || ""}
                            onChange={(e) => handleExperienceFieldChange(idx, "duration", e.target.value)}
                            placeholder="e.g. June 2021 - Present"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`exp-resp-${idx}`}>Responsibilities (one per line)</Label>
                          <Textarea
                            id={`exp-resp-${idx}`}
                            value={(exp.responsibilities || []).join("\n")}
                            onChange={(e) => handleExperienceFieldChange(idx, "responsibilities", e.target.value)}
                            placeholder="Developed new feature algorithms...&#10;Collaborated with multidisciplinary teams..."
                            rows={4}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Work Experience</p>
                {workExperience.length > 0 ? (
                  <div className="space-y-6">
                    {workExperience.map((exp, idx) => (
                      <div key={idx} className="relative pl-6 border-l-2 border-primary/20 space-y-2">
                        <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-primary" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4 className="font-semibold text-sm text-foreground">
                            {exp.jobTitle || "Professional"} at <span className="text-primary">{exp.company || "Company"}</span>
                          </h4>
                          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-medium">
                            {exp.duration || "N/A"}
                          </span>
                        </div>
                        {exp.responsibilities && exp.responsibilities.length > 0 && (
                          <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground leading-relaxed">
                            {exp.responsibilities.map((resp, rIdx) => (
                              <li key={rIdx}>{resp}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm italic text-muted-foreground/60">No work experience listed yet.</p>
                )}
              </div>
            )}
          </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education" className="space-y-4 pt-2">
            {isEditing ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-semibold">Education History</Label>
                  <Button type="button" onClick={handleAddEducation} variant="outline" size="sm">
                    + Add Education
                  </Button>
                </div>
                {education.length === 0 ? (
                  <p className="text-sm italic text-muted-foreground text-center py-4">No education history added yet.</p>
                ) : (
                  <div className="space-y-6">
                    {education.map((edu, idx) => (
                      <div key={idx} className="relative rounded-lg border p-4 bg-muted/10 space-y-4">
                        <Button
                          type="button"
                          onClick={() => handleRemoveEducation(idx)}
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          Remove
                        </Button>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`edu-school-${idx}`}>School/University</Label>
                            <Input
                              id={`edu-school-${idx}`}
                              value={edu.school}
                              onChange={(e) => handleEducationFieldChange(idx, "school", e.target.value)}
                              placeholder="e.g. Stanford University"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edu-degree-${idx}`}>Degree</Label>
                            <Input
                              id={`edu-degree-${idx}`}
                              value={edu.degree || ""}
                              onChange={(e) => handleEducationFieldChange(idx, "degree", e.target.value)}
                              placeholder="e.g. B.S."
                            />
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`edu-field-${idx}`}>Field of Study</Label>
                            <Input
                              id={`edu-field-${idx}`}
                              value={edu.fieldOfStudy || ""}
                              onChange={(e) => handleEducationFieldChange(idx, "fieldOfStudy", e.target.value)}
                              placeholder="e.g. Computer Science"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edu-duration-${idx}`}>Duration/Dates</Label>
                            <Input
                              id={`edu-duration-${idx}`}
                              value={edu.duration || ""}
                              onChange={(e) => handleEducationFieldChange(idx, "duration", e.target.value)}
                              placeholder="e.g. 2017 - 2021"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Education</p>
                {education.length > 0 ? (
                  <div className="grid gap-4">
                    {education.map((edu, idx) => (
                      <div key={idx} className="rounded-lg border bg-card/40 p-4 flex flex-col sm:flex-row justify-between gap-2">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm text-foreground">{edu.school || "University/School"}</h4>
                          <p className="text-xs text-muted-foreground">
                            {edu.degree || ""} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ""}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground self-start sm:self-center">
                          {edu.duration || "N/A"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm italic text-muted-foreground/60">No education items listed yet.</p>
                )}
              </div>
            )}
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4 pt-2">
            {isEditing ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-semibold">Project List</Label>
                  <Button type="button" onClick={handleAddProject} variant="outline" size="sm">
                    + Add Project
                  </Button>
                </div>
                {projects.length === 0 ? (
                  <p className="text-sm italic text-muted-foreground text-center py-4">No projects added yet.</p>
                ) : (
                  <div className="space-y-6">
                    {projects.map((proj, idx) => (
                      <div key={idx} className="relative rounded-lg border p-4 bg-muted/10 space-y-4">
                        <Button
                          type="button"
                          onClick={() => handleRemoveProject(idx)}
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          Remove
                        </Button>
                        <div className="space-y-2 pr-16">
                          <Label htmlFor={`proj-title-${idx}`}>Project Title</Label>
                          <Input
                            id={`proj-title-${idx}`}
                            value={proj.title}
                            onChange={(e) => handleProjectFieldChange(idx, "title", e.target.value)}
                            placeholder="e.g. AI Career Portal"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`proj-desc-${idx}`}>Description</Label>
                          <Textarea
                            id={`proj-desc-${idx}`}
                            value={proj.description || ""}
                            onChange={(e) => handleProjectFieldChange(idx, "description", e.target.value)}
                            placeholder="Describe what you built and achieved..."
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`proj-tech-${idx}`}>Technologies used (comma-separated)</Label>
                          <Input
                            id={`proj-tech-${idx}`}
                            value={(proj.technologies || []).join(", ")}
                            onChange={(e) => handleProjectFieldChange(idx, "technologies", e.target.value)}
                            placeholder="Next.js, Tailwind CSS, PostgreSQL"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Projects</p>
                {projects.length > 0 ? (
                  <div className="grid gap-4">
                    {projects.map((proj, idx) => (
                      <div key={idx} className="rounded-lg border bg-card/40 p-4 space-y-2">
                        <h4 className="font-semibold text-sm">{proj.title || "Untitled Project"}</h4>
                        {proj.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed">{proj.description}</p>
                        )}
                        {proj.technologies && proj.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {proj.technologies.map((tech, tIdx) => (
                              <span
                                key={tIdx}
                                className="inline-flex items-center rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm italic text-muted-foreground/60">No projects added yet.</p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    </div>
  );
}

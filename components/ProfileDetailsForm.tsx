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
  FolderCodeIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";

interface Project {
  title: string;
  description?: string;
  technologies?: string[];
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
}

interface ProfileDetailsFormProps {
  initialProfile: Profile;
}

export default function ProfileDetailsForm({ initialProfile }: ProfileDetailsFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Form states
  const [fullName, setFullName] = useState(initialProfile.full_name || "");
  const [email, setEmail] = useState(initialProfile.email || "");
  const [phone, setPhone] = useState(initialProfile.phone || "");
  const [location, setLocation] = useState(initialProfile.location || "");
  const [summary, setSummary] = useState(initialProfile.summary || "");
  const [skillsStr, setSkillsStr] = useState((initialProfile.skills || []).join(", "));
  const [currentCompany, setCurrentCompany] = useState(initialProfile.current_company || "");
  const [currentJobTitle, setCurrentJobTitle] = useState(initialProfile.current_job_title || "");
  const [projects, setProjects] = useState<Project[]>(
    Array.isArray(initialProfile.projects) ? initialProfile.projects : []
  );

  const handleCancel = () => {
    // Reset fields to initial database values
    setFullName(initialProfile.full_name || "");
    setEmail(initialProfile.email || "");
    setPhone(initialProfile.phone || "");
    setLocation(initialProfile.location || "");
    setSummary(initialProfile.summary || "");
    setSkillsStr((initialProfile.skills || []).join(", "));
    setCurrentCompany(initialProfile.current_company || "");
    setCurrentJobTitle(initialProfile.current_job_title || "");
    setProjects(Array.isArray(initialProfile.projects) ? initialProfile.projects : []);
    setIsEditing(false);
  };

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Saving profile updates...");

    try {
      const parsedSkills = skillsStr
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

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
          current_company: currentCompany || null,
          current_job_title: currentJobTitle || null,
          projects: projects.length > 0 ? projects : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile.");
      }

      toast.success("Profile updated successfully!", { id: toastId });
      setIsEditing(false);
      
      // Refresh router so parent page re-fetches data (completeness, status etc.)
      router.refresh();
    } catch (err: any) {
      console.error("Save profile error:", err);
      toast.error(err.message || "Could not save profile changes.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border border-muted">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            {isEditing
              ? "Modify your parsed details below and save your changes."
              : "Your personal and professional information extracted from your resume."}
          </CardDescription>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            Edit Details
          </Button>
        ) : (
          <div className="flex gap-2">
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
          <TabsList className="grid w-full grid-cols-5 bg-muted/50 p-1">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <HugeiconsIcon icon={UserIcon} size={16} />
              <span className="hidden sm:inline">Basic Info</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <HugeiconsIcon icon={BookOpen01Icon} size={16} />
              <span className="hidden sm:inline">Summary</span>
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <HugeiconsIcon icon={Award01Icon} size={16} />
              <span className="hidden sm:inline">Skills</span>
            </TabsTrigger>
            <TabsTrigger value="experience" className="flex items-center gap-2">
              <HugeiconsIcon icon={BriefcaseIcon} size={16} />
              <span className="hidden sm:inline">Experience</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <HugeiconsIcon icon={FolderCodeIcon} size={16} />
              <span className="hidden sm:inline">Projects</span>
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 pt-2">
            {isEditing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="San Francisco, CA"
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div className="rounded-lg border bg-card/40 p-4">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Full Name</p>
                  <p className="text-sm font-medium">{fullName || <span className="italic text-muted-foreground/60">Not provided yet</span>}</p>
                </div>
                <div className="rounded-lg border bg-card/40 p-4">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Email Address</p>
                  <p className="text-sm font-medium">{email || <span className="italic text-muted-foreground/60">Not provided yet</span>}</p>
                </div>
                <div className="rounded-lg border bg-card/40 p-4">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Phone Number</p>
                  <p className="text-sm font-medium">{phone || <span className="italic text-muted-foreground/60">Not provided yet</span>}</p>
                </div>
                <div className="rounded-lg border bg-card/40 p-4">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Location</p>
                  <p className="text-sm font-medium">{location || <span className="italic text-muted-foreground/60">Not provided yet</span>}</p>
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

          {/* Technical Skills Tab */}
          <TabsContent value="skills" className="space-y-4 pt-2">
            {isEditing ? (
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
            ) : (
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
            )}
          </TabsContent>

          {/* Current Employment Tab */}
          <TabsContent value="experience" className="space-y-4 pt-2">
            {isEditing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currentJobTitle">Job Title</Label>
                  <Input
                    id="currentJobTitle"
                    value={currentJobTitle}
                    onChange={(e) => setCurrentJobTitle(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentCompany">Company Name</Label>
                  <Input
                    id="currentCompany"
                    value={currentCompany}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                    placeholder="e.g. Google"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-lg border bg-card/40 p-5">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Current Employment</p>
                {currentJobTitle || currentCompany ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{currentJobTitle || "Professional"}</p>
                    <p className="text-sm text-muted-foreground">
                      at <span className="font-semibold text-foreground">{currentCompany || "Unspecified Company"}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-sm italic text-muted-foreground/60">No current employment details parsed yet.</p>
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
  );
}

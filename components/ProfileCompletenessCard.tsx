import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";

interface ProfileCompletenessCardProps {
  profile: any;
}

export default function ProfileCompletenessCard({ profile }: ProfileCompletenessCardProps) {
  // Calculate completeness score
  let score = 0;
  const checks = {
    fullName: !!profile?.full_name,
    email: !!profile?.email,
    phone: !!profile?.phone,
    location: !!profile?.location,
    summary: !!profile?.summary,
    skills: !!(profile?.skills && profile.skills.length > 0),
    currentJob: !!(profile?.current_company && profile?.current_job_title),
    projects: !!(profile?.projects && profile.projects.length > 0),
  };

  if (checks.fullName) score += 15;
  if (checks.email) score += 15;
  if (checks.phone) score += 10;
  if (checks.location) score += 10;
  if (checks.summary) score += 10;
  if (checks.skills) score += 15;
  if (checks.currentJob) score += 10;
  if (checks.projects) score += 15;

  // SVG circular path configuration
  const radius = 36;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className="overflow-hidden border border-muted bg-gradient-to-br from-card to-muted/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          Profile Completeness
        </CardTitle>
        <CardDescription>
          Complete all categories to ensure high ATS compatibility for job matching.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-center gap-6 pb-6">
        {/* Circular Progress SVG */}
        <div className="relative flex items-center justify-center h-24 w-24 shrink-0">
          <svg className="h-full w-full transform -rotate-90">
            <circle
              className="text-muted-foreground/10"
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="48"
              cy="48"
            />
            <circle
              className="text-primary transition-all duration-500 ease-in-out"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="48"
              cy="48"
            />
          </svg>
          <div className="absolute text-xl font-bold tracking-tight text-foreground">
            {score}%
          </div>
        </div>

        {/* Categories Checklist */}
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            {checks.fullName ? (
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="text-emerald-500 h-4.5 w-4.5 shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
            )}
            <span className={checks.fullName ? "text-foreground font-medium" : "text-muted-foreground"}>
              Full Name (15%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {checks.email ? (
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="text-emerald-500 h-4.5 w-4.5 shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
            )}
            <span className={checks.email ? "text-foreground font-medium" : "text-muted-foreground"}>
              Email Address (15%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {checks.phone ? (
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="text-emerald-500 h-4.5 w-4.5 shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
            )}
            <span className={checks.phone ? "text-foreground font-medium" : "text-muted-foreground"}>
              Phone Number (10%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {checks.location ? (
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="text-emerald-500 h-4.5 w-4.5 shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
            )}
            <span className={checks.location ? "text-foreground font-medium" : "text-muted-foreground"}>
              Location (10%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {checks.summary ? (
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="text-emerald-500 h-4.5 w-4.5 shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
            )}
            <span className={checks.summary ? "text-foreground font-medium" : "text-muted-foreground"}>
              Professional Summary (10%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {checks.skills ? (
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="text-emerald-500 h-4.5 w-4.5 shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
            )}
            <span className={checks.skills ? "text-foreground font-medium" : "text-muted-foreground"}>
              Technical Skills (15%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {checks.currentJob ? (
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="text-emerald-500 h-4.5 w-4.5 shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
            )}
            <span className={checks.currentJob ? "text-foreground font-medium" : "text-muted-foreground"}>
              Employment details (10%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {checks.projects ? (
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="text-emerald-500 h-4.5 w-4.5 shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
            )}
            <span className={checks.projects ? "text-foreground font-medium" : "text-muted-foreground"}>
              Personal Projects (15%)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

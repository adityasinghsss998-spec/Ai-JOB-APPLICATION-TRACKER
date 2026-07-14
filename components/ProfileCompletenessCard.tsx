"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { Sparkles, ShieldCheck } from "lucide-react";
import { TiltCard } from "@/components/landing/TiltCard";

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
  const radius = 38;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <TiltCard glowColor="rgba(99, 102, 241, 0.2)">
      <Card className="overflow-hidden border border-indigo-500/20 bg-card/60 backdrop-blur-2xl shadow-xl shadow-indigo-500/5">
        <CardHeader className="pb-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2 tracking-tight">
              <Sparkles className="size-4 text-indigo-400" />
              <span>ATS Profile Rating</span>
            </CardTitle>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              AI Match Index
            </span>
          </div>
          <CardDescription className="text-xs">
            Complete categories to optimize resume match accuracy for automated Stagehand apply.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 pt-6 pb-6">
          {/* Circular Progress SVG */}
          <div className="relative flex items-center justify-center h-28 w-28 shrink-0">
            <svg className="h-full w-full transform -rotate-90">
              <circle
                className="text-muted/40"
                strokeWidth={strokeWidth}
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="56"
                cy="56"
              />
              <motion.circle
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeLinecap="round"
                stroke="url(#gradientScore)"
                fill="transparent"
                r={radius}
                cx="56"
                cy="56"
              />
              <defs>
                <linearGradient id="gradientScore" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black tracking-tight text-foreground">{score}%</span>
              <span className="text-[9px] font-mono text-muted-foreground uppercase font-semibold">Ready</span>
            </div>
          </div>

          {/* Categories Checklist */}
          <div className="w-full border-t border-border/30 pt-4 space-y-2.5 text-xs">
            {[
              { label: "Full Name (15%)", check: checks.fullName },
              { label: "Email Address (15%)", check: checks.email },
              { label: "Phone Number (10%)", check: checks.phone },
              { label: "Location (10%)", check: checks.location },
              { label: "Professional Summary (10%)", check: checks.summary },
              { label: "Technical Skills (15%)", check: checks.skills },
              { label: "Employment Details (10%)", check: checks.currentJob },
              { label: "Personal Projects (15%)", check: checks.projects },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5">
                {item.check ? (
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} className="text-emerald-400 h-4 w-4 shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-border/60 shrink-0" />
                )}
                <span className={item.check ? "text-foreground font-semibold" : "text-muted-foreground"}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TiltCard>
  );
}

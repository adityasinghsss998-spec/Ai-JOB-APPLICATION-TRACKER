"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function OnboardingDialog() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  
  // Upload and parsing states
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<"idle" | "uploading" | "parsing" | "saving" | "completed">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function checkUserOnboarding() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check if user has uploaded any resumes
          const { count, error } = await supabase
            .from("resumes")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id);

          if (!error && (count === 0 || count === null)) {
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.error("Error checking onboarding status:", err);
      } finally {
        setChecking(false);
      }
    }
    checkUserOnboarding();
  }, [supabase]);

  // Keep dialog open if user tries to close it before completion
  const handleOpenChange = (open: boolean) => {
    if (currentStep === "completed" && !open) {
      setIsOpen(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await processResume(file);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processResume(file);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const processResume = async (file: File) => {
    // Validate file extension
    const validExtensions = ["pdf", "doc", "docx"];
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      setErrorMessage("Invalid file type. Please upload a PDF, DOC, or DOCX resume.");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("File is too large. Maximum size is 5MB.");
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);
    setCurrentStep("uploading");

    try {
      const formData = new FormData();
      formData.append("resume", file);

      // Transition to parsing state
      setCurrentStep("parsing");

      const response = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      // Transition to saving state
      setCurrentStep("saving");

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process resume.");
      }

      // Completed successfully
      setCurrentStep("completed");
      toast.success("Resume parsed and synced successfully! Welcome aboard.");
      
      // Short delay before closing and refreshing
      setTimeout(() => {
        setIsOpen(false);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      console.error("Onboarding upload error:", err);
      setErrorMessage(err.message || "An error occurred while uploading and parsing your resume.");
      setCurrentStep("idle");
      setIsUploading(false);
    }
  };

  if (checking || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="max-w-md w-full p-6 rounded-xl border bg-background/95 backdrop-blur-md shadow-2xl focus:outline-none pointer-events-auto"
        showCloseButton={false}
      >
        <DialogHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <svg className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">Set Up Your Profile</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Welcome to JobBuddy AI! Before you continue, please upload your resume. We will automatically build your profile dashboard.
          </DialogDescription>
        </DialogHeader>

        {currentStep === "idle" ? (
          <div className="space-y-4 py-4">
            <div
              className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-all ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleChange}
              />
              
              <svg
                className="h-8 w-8 text-muted-foreground/75 mb-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>

              <p className="mb-1 text-sm font-semibold">Drag & drop your resume file</p>
              <p className="mb-4 text-xs text-muted-foreground">PDF, DOC, or DOCX up to 5MB</p>

              <Button type="button" onClick={onButtonClick} variant="outline" size="sm">
                Choose File
              </Button>
            </div>

            {errorMessage && (
              <p className="text-xs text-destructive text-center font-medium bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">
                {errorMessage}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6 py-6">
            <div className="space-y-3">
              {/* Step 1: Uploading */}
              <div className="flex items-center gap-3 text-sm">
                {currentStep === "uploading" ? (
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <svg className="h-4 w-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span className={currentStep === "uploading" ? "font-semibold text-foreground animate-pulse" : "text-muted-foreground"}>
                  Uploading resume file to cloud storage...
                </span>
              </div>

              {/* Step 2: Parsing */}
              <div className="flex items-center gap-3 text-sm">
                {currentStep === "parsing" ? (
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                ) : currentStep === "saving" || currentStep === "completed" ? (
                  <svg className="h-4 w-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="h-4 w-4 rounded-full border shrink-0" />
                )}
                <span className={currentStep === "parsing" ? "font-semibold text-foreground animate-pulse" : "text-muted-foreground"}>
                  AI parsing & extracting data with Google Gemini...
                </span>
              </div>

              {/* Step 3: Saving */}
              <div className="flex items-center gap-3 text-sm">
                {currentStep === "saving" ? (
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                ) : currentStep === "completed" ? (
                  <svg className="h-4 w-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="h-4 w-4 rounded-full border shrink-0" />
                )}
                <span className={currentStep === "saving" ? "font-semibold text-foreground animate-pulse" : "text-muted-foreground"}>
                  Populating and syncing database profile...
                </span>
              </div>
            </div>

            {currentStep === "completed" && (
              <div className="flex flex-col items-center justify-center p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-center animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                <svg className="h-8 w-8 text-emerald-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">All set! Loading your dashboard...</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

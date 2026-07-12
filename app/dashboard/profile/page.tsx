import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardLayout from "@/components/DashboardLayout"
import ResumeUploadForm from "@/components/ResumeUploadForm"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import ProfileCompletenessCard from "@/components/ProfileCompletenessCard"
import ProfileDetailsForm from "@/components/ProfileDetailsForm"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Auto-clear logic: If the user has no resumes, clear any stale details in the profile
  const { data: userResumes } = await supabase
    .from("resumes")
    .select("id")
    .eq("user_id", user.id)

  if (!userResumes || userResumes.length === 0) {
    const hasData = profile?.full_name || profile?.email || profile?.phone || profile?.location || profile?.summary || (profile?.skills && profile.skills.length > 0) || (profile as any)?.projects
    if (hasData) {
      console.log("No resumes found but profile has data. Clearing stale profile data...")
      await supabase
        .from("profiles")
        .update({
          full_name: null,
          email: null,
          phone: null,
          location: null,
          summary: null,
          skills: null,
          current_company: null,
          current_job_title: null,
          projects: null,
        } as any)
        .eq("id", user.id)

      // Re-fetch updated profile
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      profile = updatedProfile
    }
  }

  const isAiConfigured = !!process.env.GEMINI_API_KEY
  const isProfileEmpty = !profile?.full_name && !profile?.email && !profile?.summary && (!profile?.skills || profile.skills.length === 0)

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Profile
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your profile information and resume data.
            </p>
          </div>
        </div>

        {/* AI Parser Status Banner */}
        {isAiConfigured ? (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-emerald-700 dark:text-emerald-400">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">AI-Powered Extraction Active</p>
              <p className="text-xs text-emerald-600/90 dark:text-emerald-400/80">Resume parsing uses Google Gemini 2.5 Flash for high-accuracy details extraction.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-amber-800 dark:text-amber-300">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 mt-0.5">
              <svg className="h-4 w-4 text-amber-600 dark:text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold">AI-Powered Extraction Disabled (Using Fallback Heuristics)</p>
              <p className="text-xs text-amber-700/90 dark:text-amber-400/80">Resume parsing is using basic heuristic regex extraction. For industry-grade AI extraction (summary, work history, details, skills), configure a Gemini API key.</p>
              <div className="text-xs font-mono bg-background/50 p-3 rounded border border-amber-500/10 mt-2 space-y-1.5 text-foreground/80">
                <p className="font-semibold text-foreground">To enable AI parsing:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Get an API key from <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Google AI Studio</a> (free tier available).</li>
                  <li>Add <code className="font-bold select-all bg-muted px-1 py-0.5 rounded">GEMINI_API_KEY=your_api_key_here</code> to your <code className="font-bold">.env.local</code> file.</li>
                  <li>Restart your development server (<code className="font-bold">npm run dev</code>).</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {!isProfileEmpty && (
          <ProfileCompletenessCard profile={profile} />
        )}

        <ProfileDetailsForm initialProfile={profile as any} />

        {/* Step-by-step Setup Guide */}
        <Card>
          <CardHeader>
            <CardTitle>How Resume Parsing Works</CardTitle>
            <CardDescription>Follow these simple steps to populate your profile automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex flex-col gap-2 rounded-lg border bg-card p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">1</div>
                <h4 className="font-semibold text-sm">Upload Resume</h4>
                <p className="text-xs text-muted-foreground">Upload your resume in PDF, DOC, or DOCX format. We will store it securely in your private cloud storage bucket.</p>
              </div>
              <div className="flex flex-col gap-2 rounded-lg border bg-card p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">2</div>
                <h4 className="font-semibold text-sm">AI Analysis</h4>
                <p className="text-xs text-muted-foreground">The parsing service extracts your contact details, professional summary, work history, and technical skills.</p>
              </div>
              <div className="flex flex-col gap-2 rounded-lg border bg-card p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">3</div>
                <h4 className="font-semibold text-sm">Profile Sync</h4>
                <p className="text-xs text-muted-foreground">Your profile fields are automatically updated with the extracted details, ready to be attached to new job applications.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Resume</CardTitle>
            <CardDescription>
              Upload your resume to automatically extract and update your profile information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResumeUploadForm />
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
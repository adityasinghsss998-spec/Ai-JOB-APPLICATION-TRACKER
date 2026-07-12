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

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

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

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Your personal and professional information extracted from your resume.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Basic Information</h3>
                <p className="text-sm text-muted-foreground">
                  {profile?.full_name || "No name provided"} • {profile?.email || "No email provided"}
                </p>
                {profile?.phone && (
                  <p className="text-sm text-muted-foreground">
                    Phone: {profile.phone}
                  </p>
                )}
                {profile?.location && (
                  <p className="text-sm text-muted-foreground">
                    Location: {profile.location}
                  </p>
                )}
              </div>

              {profile?.summary && (
                <div>
                  <h3 className="text-lg font-medium">Professional Summary</h3>
                  <p className="text-sm text-muted-foreground">
                    {profile.summary}
                  </p>
                </div>
              )}

              {profile?.skills && profile.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile?.current_company && (
                <div>
                  <h3 className="text-lg font-medium">Current Position</h3>
                  <p className="text-sm text-muted-foreground">
                    {profile.current_job_title} at {profile.current_company}
                  </p>
                </div>
              )}
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
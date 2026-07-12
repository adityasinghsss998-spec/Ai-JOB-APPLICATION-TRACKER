import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import DeleteResumeButton from "@/components/DeleteResumeButton";

export default async function ResumePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: resumes, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching resumes:", error);
  }

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Your Resumes
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your uploaded resumes.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/profile">Upload New Resume</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Uploaded Resumes</CardTitle>
            <CardDescription>
              A list of all resumes you have uploaded.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resumes && resumes.length > 0 ? (
              <ul className="space-y-4">
                {resumes.map((resume) => (
                  <li key={resume.id} className="flex items-center justify-between rounded-md border p-4">
                    <div>
                      <p className="font-medium">{resume.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded on: {new Date(resume.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={resume.file_url} target="_blank" rel="noopener noreferrer">
                          View Resume
                        </a>
                      </Button>
                      <DeleteResumeButton id={resume.id} filePath={resume.file_path} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No resumes uploaded yet. Go to the <Link href="/dashboard/profile" className="text-primary underline">Profile</Link> page to upload one.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  );
}

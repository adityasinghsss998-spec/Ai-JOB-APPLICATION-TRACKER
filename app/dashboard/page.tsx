import { redirect } from "next/navigation"

import { signOut } from "@/app/auth/actions"
import { createClient } from "@/lib/supabase/server"
import DashboardLayout from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single()

  const { count } = await supabase
    .from("job_applications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  const displayName =
    profile?.full_name ?? user.user_metadata?.full_name ?? user.email

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back{displayName ? `, ${displayName.split(" ")[0]}` : ""}
          </h1>
            <p className="text-sm text-muted-foreground">
              Here's an overview of your job search progress.
            </p>
          </div>

          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Total applications</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {count ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Account</CardDescription>
              <CardTitle className="truncate text-base font-medium">
                {profile?.email ?? user.email}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Status</CardDescription>
              <CardTitle className="text-base font-medium text-emerald-600 dark:text-emerald-400">
                Active
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Getting started</CardTitle>
            <CardDescription>
              Your dashboard is ready. Start adding job applications to track
              your progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Application management features will be available here soon. Your
              account and database are fully configured with secure row-level
              access.
            </p>
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}

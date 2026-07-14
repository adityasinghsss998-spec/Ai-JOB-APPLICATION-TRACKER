import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function StatusPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch all jobs where applied_status is not 'not_applied'
  const { data: jobs } = await (supabase
    .from("jobs" as any)
    .select("id, title, company, platform, applied_status, missing_fields, browserbase_session_id, fetched_at, created_at, job_url")
    .neq("applied_status", "not_applied")
    .order("fetched_at", { ascending: false }) as any);

  const applications = jobs || [];

  // Calculate status counts
  const totalCount = applications.length;
  const activeCount = applications.filter((a: any) => a.applied_status === "detecting" || a.applied_status === "applying").length;
  const missingCount = applications.filter((a: any) => a.applied_status === "missing_profile_info").length;
  const failedCount = applications.filter((a: any) => a.applied_status === "failed").length;
  const successCount = applications.filter((a: any) => a.applied_status === "applied").length;

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Application Status</h1>
            <p className="text-sm text-muted-foreground">
              Monitor and manage your AI-automated and manual job submissions.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border border-muted">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
              <p className="text-xs text-muted-foreground">Automated tracking active</p>
            </CardContent>
          </Card>

          <Card className="border border-muted">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active / In Queue</CardTitle>
              <svg className="h-4 w-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L22 4" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeCount}</div>
              <p className="text-xs text-muted-foreground">Running in background</p>
            </CardContent>
          </Card>

          <Card className="border border-muted">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Missing Profile Info</CardTitle>
              <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{missingCount}</div>
              <p className="text-xs text-muted-foreground">Requires your attention</p>
            </CardContent>
          </Card>

          <Card className="border border-muted">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Applications</CardTitle>
              <svg className="h-4 w-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{failedCount}</div>
              <p className="text-xs text-muted-foreground">Failed submissions</p>
            </CardContent>
          </Card>
        </div>

        {/* Application List */}
        <Card className="border border-muted">
          <CardHeader>
            <CardTitle>AI Application Log</CardTitle>
            <CardDescription>
              Check the step-by-step logs and Browserbase sessions of your applications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4m16 0h-2M4 13h2m10 4h2M4 17h2m2-10h8" />
                  </svg>
                </div>
                <h3 className="font-semibold text-base mb-1">No automated applications</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-4">
                  You haven't initiated any AI-assisted job applications yet.
                </p>
                <Button asChild size="sm">
                  <Link href="/dashboard">Browse Job Listings</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-muted border rounded-xl overflow-hidden bg-card">
                {applications.map((app: any) => {
                  const dateStr = new Date(app.fetched_at || app.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 hover:bg-muted/5 transition-colors">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-base text-foreground leading-tight">{app.title}</h4>
                          <span className="text-[10px] uppercase font-semibold bg-muted border px-1.5 py-0.5 rounded text-muted-foreground">
                            {app.platform}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">
                          at <strong className="text-foreground/80 font-semibold">{app.company}</strong>
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Last activity: {dateStr}
                        </p>
                      </div>

                      <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                        {/* Status Badges */}
                        {app.applied_status === "applied" && (
                          <Badge className="bg-emerald-500/10 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold py-0.5 px-2.5">
                            Submitted
                          </Badge>
                        )}
                        {app.applied_status === "detecting" && (
                          <Badge className="bg-blue-500/10 hover:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 animate-pulse font-bold py-0.5 px-2.5">
                            In Queue
                          </Badge>
                        )}
                        {app.applied_status === "applying" && (
                          <Badge className="bg-indigo-500/10 hover:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 animate-pulse font-bold py-0.5 px-2.5">
                            Autofilling
                          </Badge>
                        )}
                        {app.applied_status === "missing_profile_info" && (
                          <Badge className="bg-amber-500/10 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 animate-pulse font-bold py-0.5 px-2.5">
                            Missing Info
                          </Badge>
                        )}
                        {app.applied_status === "failed" && (
                          <Badge className="bg-rose-500/10 hover:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 font-bold py-0.5 px-2.5">
                            Failed
                          </Badge>
                        )}

                        {/* Status details & actions */}
                        <div className="flex items-center gap-2 mt-1">
                          {app.applied_status === "applied" && app.browserbase_session_id && (
                            app.browserbase_session_id.startsWith("mock-") ? (
                              <span className="text-xs text-muted-foreground font-semibold italic flex items-center gap-1">
                                <svg className="h-3.5 w-3.5 text-amber-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Simulation (No Recording)
                              </span>
                            ) : app.browserbase_session_id.startsWith("local-") ? (
                              <span className="text-xs text-emerald-600 font-semibold italic flex items-center gap-1">
                                <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Local Browser Run
                              </span>
                            ) : (
                              <a
                                href={`https://www.browserbase.com/sessions/${app.browserbase_session_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline font-bold inline-flex items-center gap-0.5"
                              >
                                Session Recording
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )
                          )}

                          {app.applied_status === "missing_profile_info" && (
                            <Button asChild size="sm" variant="outline" className="h-7 text-xs border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-600">
                              <Link href={`/dashboard/profile?missingJobId=${app.id}`}>
                                Complete Profile
                              </Link>
                            </Button>
                          )}

                          {app.applied_status === "failed" && (
                            <div className="flex gap-2">
                              <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                                <a href={app.job_url} target="_blank" rel="noopener noreferrer">
                                  Apply Manually
                                </a>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  );
}

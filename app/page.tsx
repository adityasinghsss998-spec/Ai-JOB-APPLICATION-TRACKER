import Link from "next/link"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/50 via-background to-background dark:from-indigo-950/30" />

      <main className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <span className="text-lg font-bold">JA</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Track your job search with clarity
          </h1>
          <p className="text-lg text-muted-foreground">
            Organize applications, monitor progress, and stay focused on landing
            your next role.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            className={cn(buttonVariants({ size: "lg" }), "h-11 px-8 text-sm")}
          >
            Get started free
          </Link>
          <Link
            href="/sign-in"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 px-8 text-sm"
            )}
          >
            Sign in
          </Link>
        </div>
      </main>
    </div>
  )
}

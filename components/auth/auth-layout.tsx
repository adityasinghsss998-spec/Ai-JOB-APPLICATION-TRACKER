import Link from "next/link"

import { cn } from "@/lib/utils"

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="grid min-h-full lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-zinc-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-900/40 via-zinc-950 to-zinc-950" />
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
              <span className="text-sm font-semibold text-white">JA</span>
            </div>
            <span className="text-sm font-medium text-white/90">
              Job Application Tracker
            </span>
          </Link>
        </div>

        <div className="relative space-y-6">
          <blockquote className="space-y-2">
            <p className="text-2xl font-medium leading-snug tracking-tight text-white">
              Track every application. Land your dream role.
            </p>
            <p className="text-sm leading-relaxed text-zinc-400">
              Organize applications, monitor progress, and stay on top of your
              job search — all in one place.
            </p>
          </blockquote>

          <div className="flex gap-6 text-xs text-zinc-500">
            <div>
              <p className="text-lg font-semibold text-white">AI-powered</p>
              <p>Smart insights</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Real-time</p>
              <p>Status tracking</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Secure</p>
              <p>Your data, protected</p>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} Job Application Tracker
        </p>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-12 sm:px-12">
        <div className="mb-8 flex w-full max-w-sm items-center justify-between lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-xs font-semibold">JA</span>
            </div>
            <span className="text-sm font-medium">Job Application Tracker</span>
          </Link>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}

export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

export function AuthFooterLink({
  text,
  linkText,
  href,
}: {
  text: string
  linkText: string
  href: string
}) {
  return (
    <p className="text-center text-sm text-muted-foreground">
      {text}{" "}
      <Link
        href={href}
        className={cn(
          "font-medium text-foreground underline-offset-4 hover:underline"
        )}
      >
        {linkText}
      </Link>
    </p>
  )
}

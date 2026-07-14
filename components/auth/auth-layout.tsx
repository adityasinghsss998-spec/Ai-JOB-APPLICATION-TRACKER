"use client"

import React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Bot, Sparkles, CheckCircle2, ShieldCheck, ArrowLeft } from "lucide-react"
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
    <div className="grid min-h-screen lg:grid-cols-12 bg-background text-foreground overflow-hidden selection:bg-indigo-500/30">
      {/* Left Column: Ambient 3D Aesthetic Showcase */}
      <div className="relative hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-12 bg-slate-950 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="absolute -top-32 -left-32 size-96 rounded-full bg-indigo-600/20 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 size-96 rounded-full bg-cyan-500/15 blur-[130px] pointer-events-none" />

        {/* Ambient Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <div className="flex size-full items-center justify-center rounded-[10px] bg-slate-950">
                <Bot className="size-5 text-indigo-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-white">
                ApplyAgent<span className="text-indigo-400">.ai</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                Autonomous Search
              </span>
            </div>
          </Link>
        </div>

        {/* Center Testimonial / Live Glass Showcase */}
        <div className="relative z-10 max-w-lg space-y-8 my-auto py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold"
          >
            <Sparkles className="size-3.5 text-cyan-400 animate-pulse" />
            <span>AI Autonomous Application Engine</span>
          </motion.div>

          <motion.blockquote
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <p className="text-3xl font-extrabold tracking-tight leading-snug text-white">
              “ApplyAgent auto-applied to 40+ engineering roles with tailored resumes — I landed 6 interview invites in 2 weeks.”
            </p>
            <footer className="text-sm font-medium text-slate-400">
              — Alex Rivera, Staff Software Architect
            </footer>
          </motion.blockquote>

          {/* Metric Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/80"
          >
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <p className="text-xl font-bold text-indigo-400">98.4%</p>
              <p className="text-[11px] text-slate-400 font-medium">ATS Match Fit</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <p className="text-xl font-bold text-cyan-400">100s</p>
              <p className="text-[11px] text-slate-400 font-medium">Stagehand Applications</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <p className="text-xl font-bold text-emerald-400">Real-time</p>
              <p className="text-[11px] text-slate-400 font-medium">Pipeline Tracking</p>
            </div>
          </motion.div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 font-medium">
          <p>© {new Date().getFullYear()} ApplyAgent.ai. All rights reserved.</p>
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-4 text-emerald-400" /> AES-256 Encrypted
          </span>
        </div>
      </div>

      {/* Right Column: Form Container */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-12 relative">
        {/* Top Navigation Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors p-2 rounded-xl hover:bg-muted/50"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Home</span>
          </Link>
          <div className="lg:hidden flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
              AA
            </div>
            <span className="font-bold text-sm tracking-tight">ApplyAgent.ai</span>
          </div>
        </div>

        {/* Main Glass Form Box */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-indigo-500/20 bg-card/60 backdrop-blur-2xl p-8 shadow-2xl shadow-indigo-500/5 space-y-6"
          >
            <div className="space-y-2 text-left">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
              <p className="text-xs text-muted-foreground leading-relaxed">{subtitle}</p>
            </div>

            {children}
          </motion.div>
        </div>

        {/* Footer privacy text */}
        <p className="text-center text-[11px] text-muted-foreground">
          By signing in, you agree to our Terms of Service & Privacy Policy.
        </p>
      </div>
    </div>
  )
}

export function AuthDivider({ label = "or continue with" }: { label?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border/60" />
      </div>
      <div className="relative flex justify-center text-[11px] font-medium uppercase tracking-wider">
        <span className="bg-card px-3 text-muted-foreground">{label}</span>
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
    <p className="text-center text-xs text-muted-foreground pt-2">
      {text}{" "}
      <Link
        href={href}
        className="font-bold text-indigo-500 hover:text-indigo-400 underline-offset-4 hover:underline transition-colors"
      >
        {linkText}
      </Link>
    </p>
  )
}

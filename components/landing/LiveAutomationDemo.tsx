"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Cpu,
  FileText,
  Send,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Layers,
} from "lucide-react"

const SIMULATION_STEPS = [
  {
    id: "match",
    title: "AI Semantic Matcher",
    icon: Search,
    detail: "Analyzing job description from Stripe & calculating resume relevance score...",
    score: 96,
    log: "[00:01.2] Matcher: Extracting required skills [React 19, TypeScript, Next.js, Node]...\n[00:01.8] Matcher: Candidate fit validated! Match confidence: 96%",
  },
  {
    id: "tailor",
    title: "Dynamic Bullet Tailoring",
    icon: FileText,
    detail: "Synthesizing AI resume keywords to emphasize distributed microservices experience.",
    score: 98,
    log: "[00:03.1] AI Engine: Rewriting bullet points with quantified achievements...\n[00:03.9] Gemini 2.5: Injecting contextual tech stack keywords into PDF draft.",
  },
  {
    id: "stagehand",
    title: "Stagehand Agent Automation",
    icon: Cpu,
    detail: "Autonomous headless browser navigating Workday application portal...",
    score: 100,
    log: "[00:05.4] Stagehand: Launching isolated Chrome container via Browserbase...\n[00:06.2] Stagehand: Filling input #name, #email, uploading generated resume PDF.\n[00:07.1] Stagehand: Solved anti-bot verification challenge safely.",
  },
  {
    id: "submitted",
    title: "Application Tracked",
    icon: CheckCircle2,
    detail: "Application confirmation recorded to Supabase database pipeline.",
    score: 100,
    log: "[00:08.5] Database: Saved application ID #app_98241 to Kanban status 'Applied'.\n[00:09.0] System: Set auto-followup timer in 5 days.",
  },
]

export function LiveAutomationDemo() {
  const [activeStep, setActiveStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    if (!isPlaying) return
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % SIMULATION_STEPS.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [isPlaying])

  const step = SIMULATION_STEPS[activeStep]
  const Icon = step.icon

  return (
    <div className="relative rounded-3xl border border-indigo-500/20 bg-card/60 backdrop-blur-2xl p-6 md:p-8 shadow-2xl shadow-indigo-500/10 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -right-32 size-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 size-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="relative flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/30">
            <Sparkles className="size-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-foreground tracking-tight">
                Live AI Autonomous Application Agent
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                Active Bot
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Watch real-time resume tailoring, Stagehand browser execution, and status updates
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted/60 hover:bg-muted text-foreground border border-border/50 transition-all hover:scale-105"
          >
            {isPlaying ? (
              <>
                <span className="size-2 rounded-sm bg-amber-400" />
                Pause
              </>
            ) : (
              <>
                <Play className="size-3.5 text-indigo-400 fill-indigo-400" />
                Resume
              </>
            )}
          </button>
          <button
            onClick={() => {
              setActiveStep(0)
              setIsPlaying(true)
            }}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted transition-colors border border-border/50"
            title="Reset Simulation"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Main interactive grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
        {/* Left: Step Stepper Cards */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {SIMULATION_STEPS.map((s, idx) => {
            const StepIcon = s.icon
            const isActive = idx === activeStep
            const isCompleted = idx < activeStep

            return (
              <button
                key={s.id}
                onClick={() => {
                  setActiveStep(idx)
                  setIsPlaying(false)
                }}
                className={`relative flex items-center gap-3.5 p-3.5 rounded-2xl text-left transition-all duration-300 border ${
                  isActive
                    ? "bg-indigo-600/10 border-indigo-500/40 text-foreground shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/30"
                    : isCompleted
                    ? "bg-muted/30 border-border/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    : "bg-muted/10 border-transparent text-muted-foreground opacity-60 hover:opacity-100"
                }`}
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                      : isCompleted
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="size-4" /> : <StepIcon className="size-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate tracking-tight">{s.title}</span>
                    {isActive && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-semibold">
                        Step {idx + 1}/4
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{s.detail}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Right: Live Interactive Console Display */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Active Job Target Box */}
          <div className="rounded-2xl border border-border/40 bg-background/50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-sm">
                S
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-foreground">Senior Full Stack Engineer</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Full Time
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Stripe • San Francisco, CA (Remote) • $190k - $240k</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-mono font-bold text-indigo-400">{step.score}% Match</div>
              <div className="text-[10px] text-muted-foreground">AI Fit Rating</div>
            </div>
          </div>

          {/* Console Output Screen */}
          <div className="relative flex-1 rounded-2xl border border-indigo-950/80 bg-slate-950 p-4 font-mono text-xs shadow-inner min-h-[170px] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 text-[11px]">
              <div className="flex items-center gap-2">
                <Terminal className="size-3.5 text-indigo-400" />
                <span>Stagehand Execution Runtime</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                <span className="size-1.5 rounded-full bg-indigo-500 animate-ping" />
                Streaming stdout
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="py-3 text-slate-300 space-y-2 whitespace-pre-line leading-relaxed font-mono"
              >
                <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Icon className="size-3.5" />
                  <span>Executing: {step.title}</span>
                </div>
                <div className="text-slate-400 pl-2 border-l border-indigo-500/30">{step.log}</div>
              </motion.div>
            </AnimatePresence>

            {/* Progress indicator */}
            <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden mt-2">
              <motion.div
                key={activeStep}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 4.5, ease: "linear" }}
                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

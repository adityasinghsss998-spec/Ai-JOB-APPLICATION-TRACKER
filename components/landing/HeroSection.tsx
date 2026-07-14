"use client"

import React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight, Bot, CheckCircle2, Zap, Shield, Play, TrendingUp } from "lucide-react"
import { Hero3DCanvas } from "./Hero3DCanvas"
import { TiltCard } from "./TiltCard"

export function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-16 overflow-hidden">
      {/* 3D WebGL Canvas Layer */}
      <Hero3DCanvas />

      {/* Decorative gradient radial spots */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Hero Text Content */}
        <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
          {/* Badge Tag */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 backdrop-blur-md text-xs font-semibold shadow-lg shadow-indigo-500/5"
          >
            <Sparkles className="size-3.5 text-cyan-400 animate-pulse" />
            <span>Next-Gen Autonomous AI Job Agent</span>
            <span className="flex size-1.5 rounded-full bg-cyan-400" />
            <span className="text-[10px] text-muted-foreground font-mono">Stagehand v3.6</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]"
          >
            Apply to 100s of Jobs <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400">
              Autonomously
            </span>{" "}
            with AI Precision
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed"
          >
            Stop wasting hours filling repetitive career portals. Our AI agent parses job listings, customizes your resume for ATS keywords, and submits applications on your behalf using browser automation.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-2"
          >
            <Link
              href="/sign-up"
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold rounded-2xl group bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-500 hover:scale-105 transition-all duration-300 shadow-xl shadow-indigo-500/25"
            >
              <span className="relative px-8 py-3.5 transition-all ease-in duration-75 rounded-[14px] bg-indigo-600 hover:bg-indigo-600/90 text-white flex items-center justify-center gap-2.5">
                <span>Start Applying Free</span>
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            <a
              href="#demo"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-semibold bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 backdrop-blur-md transition-all hover:scale-105 shadow-md"
            >
              <Play className="size-4 text-indigo-400 fill-indigo-400" />
              <span>Watch Interactive Demo</span>
            </a>
          </motion.div>

          {/* Trust Highlights */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap items-center gap-6 pt-4 text-xs text-muted-foreground font-medium"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span>Tailored ATS Resumes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span>Stagehand Browser Automation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span>Real-time Status Tracking</span>
            </div>
          </motion.div>
        </div>

        {/* Right Column: 3D Holographic Visual Hero Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:col-span-5 relative flex items-center justify-center"
        >
          <TiltCard className="w-full max-w-lg">
            <div className="relative rounded-3xl border border-indigo-500/30 bg-card/70 backdrop-blur-2xl p-6 shadow-2xl shadow-indigo-500/20">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Bot className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">AI Application Engine</h3>
                    <p className="text-[11px] text-muted-foreground">Autonomous Job Agent #1</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </div>
              </div>

              {/* Stats metric bar inside hero card */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Match Score</span>
                  <div className="text-xl font-extrabold text-indigo-400 mt-0.5">98.4%</div>
                  <span className="text-[10px] text-emerald-400 font-medium">+12% vs standard resume</span>
                </div>
                <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Auto-Submitted</span>
                  <div className="text-xl font-extrabold text-cyan-400 mt-0.5">42 Applications</div>
                  <span className="text-[10px] text-muted-foreground">This week</span>
                </div>
              </div>

              {/* Simulated active execution pill */}
              <div className="rounded-xl bg-indigo-950/60 border border-indigo-800/40 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-xs font-mono text-indigo-200 truncate">Applying to Google • Staff Architect</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">Step 3/4</span>
              </div>
            </div>
          </TiltCard>

          {/* Floating Micro Glass Cards around 3D hero */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-6 -left-6 z-20 hidden sm:flex items-center gap-3 p-3 rounded-2xl bg-background/80 backdrop-blur-xl border border-indigo-500/30 shadow-xl shadow-indigo-500/10"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Interview Scheduled!</p>
              <p className="text-[10px] text-muted-foreground">OpenAI • Senior Frontend Role</p>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-6 -right-4 z-20 hidden sm:flex items-center gap-3 p-3 rounded-2xl bg-background/80 backdrop-blur-xl border border-cyan-500/30 shadow-xl shadow-cyan-500/10"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <TrendingUp className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">+340% Callback Rate</p>
              <p className="text-[10px] text-muted-foreground">Keyword-matched resumes</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

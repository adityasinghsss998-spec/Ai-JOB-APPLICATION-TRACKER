"use client"

import React from "react"
import { motion } from "framer-motion"
import {
  Sparkles,
  Bot,
  FileCode,
  Kanban,
  Target,
  Clock,
  BarChart3,
  Globe2,
  ShieldCheck,
  Zap,
} from "lucide-react"
import { TiltCard } from "./TiltCard"

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI ATS Resume Optimization",
    description:
      "Our AI engine scans each job posting and customizes your resume bullets in real time, matching critical tech keywords to ensure maximum ATS score.",
    glowColor: "rgba(99, 102, 241, 0.25)",
    badge: "Gemini AI",
  },
  {
    icon: Globe2,
    title: "Stagehand Browser Automation",
    description:
      "Powered by Stagehand & Browserbase, our autonomous browser agent navigates Workday, Lever, and Greenhouse forms and auto-fills data seamlessly.",
    glowColor: "rgba(6, 182, 212, 0.25)",
    badge: "Stagehand v3.6",
  },
  {
    icon: Kanban,
    title: "Visual Kanban Pipeline",
    description:
      "Track every application from initial submission to final offer. Update interview stages, store recruiter notes, and view real-time status changes.",
    glowColor: "rgba(168, 85, 247, 0.25)",
    badge: "Real-time Sync",
  },
  {
    icon: Target,
    title: "Granular Match Analytics",
    description:
      "Get precise match percentage ratings before submitting. Identify missing skill keywords and generate instant recommendation insights.",
    glowColor: "rgba(236, 72, 153, 0.25)",
    badge: "Semantic AI",
  },
  {
    icon: Clock,
    title: "Smart Follow-Up Scheduling",
    description:
      "Never let an opportunity go cold. Automatically receive background reminders to follow up with recruiters at optimal post-apply intervals.",
    glowColor: "rgba(16, 185, 129, 0.25)",
    badge: "Background Scheduler",
  },
  {
    icon: BarChart3,
    title: "Response & Conversion Metrics",
    description:
      "Deep dive into application response rates, average interview conversion timelines, and salary benchmark breakdowns in a sleek dashboard.",
    glowColor: "rgba(245, 158, 11, 0.25)",
    badge: "Analytics",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 px-6 max-w-7xl mx-auto overflow-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto mb-16">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold"
        >
          <Zap className="size-3.5" />
          <span>Supercharged Autonomous Features</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight"
        >
          Built for Engineers & Professionals <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400">
            Who Want Results Faster
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base text-muted-foreground"
        >
          Experience an unfair advantage in your job search with intelligent automation, AI-customized resume tailoring, and real-time application management.
        </motion.p>
      </div>

      {/* Features 3D Holographic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {FEATURES.map((feat, idx) => {
          const Icon = feat.icon
          return (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <TiltCard glowColor={feat.glowColor} className="h-full">
                <div className="group relative flex flex-col justify-between h-full p-8 rounded-3xl border border-indigo-500/20 bg-card/50 backdrop-blur-xl hover:border-indigo-500/40 transition-colors duration-300 shadow-xl shadow-indigo-500/5">
                  <div>
                    {/* Icon & Badge Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-md shadow-indigo-500/20">
                        <Icon className="size-6" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-muted/60 text-muted-foreground border border-border/40">
                        {feat.badge}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight group-hover:text-indigo-400 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  {/* Micro indicator footer */}
                  <div className="pt-6 mt-6 border-t border-border/30 flex items-center justify-between text-xs font-semibold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Explore feature details</span>
                    <span>→</span>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

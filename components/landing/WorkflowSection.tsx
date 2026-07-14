"use client"

import React from "react"
import { motion } from "framer-motion"
import { Upload, SlidersHorizontal, Rocket, CheckCircle2 } from "lucide-react"

const STEPS = [
  {
    step: "01",
    title: "Upload Master Profile & Resume",
    description:
      "Drop in your current resume and link your LinkedIn/GitHub profiles. Our AI parses your career history, skills, and project accomplishments.",
    icon: Upload,
  },
  {
    step: "02",
    title: "Set Target Roles & Preferences",
    description:
      "Define job titles, preferred remote/hybrid locations, minimum compensation thresholds, and target company lists.",
    icon: SlidersHorizontal,
  },
  {
    step: "03",
    title: "Autonomous AI Execution",
    description:
      "Sit back as the AI Agent finds matching listings, tailors resume bullet points for ATS systems, and submits forms using headless Stagehand browsers.",
    icon: Rocket,
  },
]

export function WorkflowSection() {
  return (
    <section id="workflow" className="relative py-24 px-6 max-w-7xl mx-auto border-t border-border/30">
      <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto mb-16">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold"
        >
          <CheckCircle2 className="size-3.5" />
          <span>Simple 3-Step Automation Workflow</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-4xl font-extrabold tracking-tight"
        >
          From Setup to Interviews in <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            Three Effortless Steps
          </span>
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {/* Connecting progress line on desktop */}
        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500/20 via-cyan-500/40 to-indigo-500/20 -translate-y-8 z-0" />

        {STEPS.map((s, idx) => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="relative z-10 flex flex-col items-center text-center p-8 rounded-3xl bg-card/60 backdrop-blur-xl border border-indigo-500/20 shadow-xl shadow-indigo-500/5 hover:border-indigo-500/40 transition-colors"
            >
              {/* Step Badge */}
              <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white font-black text-xl mb-6 shadow-lg shadow-indigo-500/30">
                <Icon className="size-7" />
              </div>

              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest mb-2">
                Step {s.step}
              </span>

              <h3 className="text-xl font-bold text-foreground mb-3">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

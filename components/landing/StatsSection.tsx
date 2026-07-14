"use client"

import React from "react"
import { motion } from "framer-motion"
import { TrendingUp, Clock, FileCheck, Award } from "lucide-react"

const STATS = [
  {
    icon: FileCheck,
    value: "150,000+",
    label: "Applications Auto-Submitted",
    description: "Across Greenhouse, Workday & Lever",
  },
  {
    icon: TrendingUp,
    value: "4.2x",
    label: "Higher Callback Rate",
    description: "Via keyword-tailored resumes",
  },
  {
    icon: Clock,
    value: "18+ Hours",
    label: "Saved Every Week",
    description: "Zero manual form typing",
  },
  {
    icon: Award,
    value: "89%",
    label: "Interview Rate Within 14 Days",
    description: "Targeted job matching fit",
  },
]

export function StatsSection() {
  return (
    <section id="stats" className="relative py-20 px-6 max-w-7xl mx-auto">
      <div className="relative rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-card/70 to-slate-950/40 backdrop-blur-2xl p-8 lg:p-12 shadow-2xl shadow-indigo-500/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-border/40">
          {STATS.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`flex flex-col items-center sm:items-start text-center sm:text-left ${
                  idx > 0 ? "pt-6 sm:pt-0 sm:pl-8" : ""
                }`}
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-4 border border-indigo-500/20">
                  <Icon className="size-5" />
                </div>
                <div className="text-3xl lg:text-4xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground via-indigo-200 to-indigo-400">
                  {stat.value}
                </div>
                <div className="text-sm font-bold text-foreground mt-1 tracking-tight">{stat.label}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

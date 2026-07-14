"use client"

import React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import { ArrowRight, Sparkles, Bot, ShieldCheck } from "lucide-react"

export function CTASection() {
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#6366f1", "#818cf8", "#06b6d4", "#a855f7"],
    })
  }

  return (
    <section className="relative py-24 px-6 max-w-7xl mx-auto overflow-hidden">
      <div className="relative rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900/40 via-indigo-950/70 to-background backdrop-blur-2xl p-10 md:p-16 text-center shadow-2xl shadow-indigo-500/20 overflow-hidden">
        {/* Glow circles */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-[140px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-3xl mx-auto space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold">
            <Sparkles className="size-3.5 text-cyan-400 animate-pulse" />
            <span>Ready to Land Your Next Role Faster?</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Put Your Job Search on <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400">
              Autopilot Starting Today
            </span>
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Join thousands of software engineers, product managers, and designers using AI Agent to double their interview callback rates.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/sign-up"
              onClick={triggerConfetti}
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-base font-bold rounded-2xl group bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-400 hover:scale-105 transition-all duration-300 shadow-2xl shadow-indigo-500/30"
            >
              <span className="relative px-9 py-4 transition-all ease-in duration-75 rounded-[14px] bg-indigo-600 hover:bg-indigo-600/90 text-white flex items-center justify-center gap-3">
                <span>Create Free Account</span>
                <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 pt-4 text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-400" /> Free Setup
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-400" /> Secure Encryption
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-400" /> Instant Access
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

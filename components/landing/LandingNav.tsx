"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight, Bot, Compass, ShieldCheck, Zap } from "lucide-react"

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/70 backdrop-blur-xl border-b border-border/40 shadow-lg shadow-indigo-500/5 py-3.5"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-105">
            <div className="flex size-full items-center justify-center rounded-[10px] bg-background">
              <Bot className="size-5 text-indigo-500 transition-colors group-hover:text-indigo-400" />
            </div>
            <span className="absolute -top-1 -right-1 flex size-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-3 bg-cyan-500"></span>
            </span>
          </div>

          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/70">
              ApplyAgent<span className="text-indigo-500">.ai</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-medium -mt-1 tracking-wider uppercase">
              Autonomous Search
            </span>
          </div>
        </Link>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-muted/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-border/30">
          <a
            href="#features"
            className="px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-background/50"
          >
            Capabilities
          </a>
          <a
            href="#demo"
            className="px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-background/50"
          >
            Live Demo
          </a>
          <a
            href="#workflow"
            className="px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-background/50"
          >
            How it Works
          </a>
          <a
            href="#stats"
            className="px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-background/50"
          >
            Impact
          </a>
        </nav>

        {/* Auth CTA Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg"
          >
            Sign In
          </Link>

          <Link
            href="/sign-up"
            className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-xs font-semibold rounded-xl group bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 group-hover:from-indigo-500 group-hover:to-cyan-400 hover:text-white text-white shadow-md shadow-indigo-500/20 transition-all duration-300 hover:shadow-indigo-500/40 hover:scale-105"
          >
            <span className="relative px-4 py-2 transition-all ease-in duration-75 rounded-[10px] bg-gradient-to-r from-indigo-600 to-indigo-700 flex items-center gap-1.5">
              <span>Launch App</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      </div>
    </motion.header>
  )
}

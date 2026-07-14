"use client"

import React from "react"
import Link from "next/link"
import { Bot, Globe, Share2, MessageSquare, Heart } from "lucide-react"

export function LandingFooter() {
  return (
    <footer className="relative border-t border-border/40 bg-card/40 backdrop-blur-md pt-16 pb-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-border/40">
        {/* Brand column */}
        <div className="md:col-span-2 space-y-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-0.5 shadow-md">
              <div className="flex size-full items-center justify-center rounded-[10px] bg-background">
                <Bot className="size-4 text-indigo-500" />
              </div>
            </div>
            <span className="font-bold text-lg tracking-tight">
              ApplyAgent<span className="text-indigo-500">.ai</span>
            </span>
          </Link>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
            The intelligent, autonomous job application agent that tailors resumes for ATS compliance, fills job applications automatically, and tracks your pipeline status.
          </p>
          <div className="flex items-center gap-3 text-muted-foreground pt-2">
            <a href="#" className="hover:text-foreground transition-colors p-2 rounded-lg bg-muted/40 hover:bg-muted" aria-label="Website">
              <Globe className="size-4" />
            </a>
            <a href="#" className="hover:text-foreground transition-colors p-2 rounded-lg bg-muted/40 hover:bg-muted" aria-label="Social Link">
              <Share2 className="size-4" />
            </a>
            <a href="#" className="hover:text-foreground transition-colors p-2 rounded-lg bg-muted/40 hover:bg-muted" aria-label="Community">
              <MessageSquare className="size-4" />
            </a>
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">Product</h4>
          <ul className="space-y-2.5 text-xs text-muted-foreground font-medium">
            <li><a href="#features" className="hover:text-indigo-400 transition-colors">AI Resume Tailoring</a></li>
            <li><a href="#demo" className="hover:text-indigo-400 transition-colors">Stagehand Automation</a></li>
            <li><a href="#workflow" className="hover:text-indigo-400 transition-colors">Kanban Pipeline</a></li>
            <li><a href="#stats" className="hover:text-indigo-400 transition-colors">Match Analytics</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">Resources</h4>
          <ul className="space-y-2.5 text-xs text-muted-foreground font-medium">
            <li><Link href="/sign-in" className="hover:text-indigo-400 transition-colors">Sign In</Link></li>
            <li><Link href="/sign-up" className="hover:text-indigo-400 transition-colors">Create Account</Link></li>
            <li><a href="#" className="hover:text-indigo-400 transition-colors">Documentation</a></li>
            <li><a href="#" className="hover:text-indigo-400 transition-colors">API Keys</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">Legal</h4>
          <ul className="space-y-2.5 text-xs text-muted-foreground font-medium">
            <li><a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-indigo-400 transition-colors">Security Overview</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
        <p>© {new Date().getFullYear()} ApplyAgent.ai. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Designed with <Heart className="size-3 text-red-500 fill-red-500" /> for job seekers everywhere.
        </p>
      </div>
    </footer>
  )
}

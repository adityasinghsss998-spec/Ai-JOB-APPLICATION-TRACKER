import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

import { LandingNav } from "@/components/landing/LandingNav"
import { HeroSection } from "@/components/landing/HeroSection"
import { LiveAutomationDemo } from "@/components/landing/LiveAutomationDemo"
import { FeaturesSection } from "@/components/landing/FeaturesSection"
import { WorkflowSection } from "@/components/landing/WorkflowSection"
import { StatsSection } from "@/components/landing/StatsSection"
import { CTASection } from "@/components/landing/CTASection"
import { LandingFooter } from "@/components/landing/LandingFooter"

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Dynamic Header Navbar */}
      <LandingNav />

      {/* Hero Section with 3D Canvas Background & 3D Tilt Card */}
      <HeroSection />

      {/* Live AI Automation Demo Section */}
      <section id="demo" className="py-20 px-6 max-w-7xl mx-auto">
        <LiveAutomationDemo />
      </section>

      {/* Holographic 3D Feature Grid */}
      <FeaturesSection />

      {/* How it Works / 3-Step Workflow */}
      <WorkflowSection />

      {/* Impact & Performance Metrics */}
      <StatsSection />

      {/* High-Impact Conversion CTA */}
      <CTASection />

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}


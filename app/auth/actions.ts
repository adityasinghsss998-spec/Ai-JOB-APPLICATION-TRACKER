"use server"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export type AuthState = {
  error?: string
  success?: string
}

export async function signInWithEmail(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const redirectTo = (formData.get("redirect") as string) || "/dashboard"

  if (!email || !password) {
    return { error: "Email and password are required." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect(redirectTo.startsWith("/") ? redirectTo : "/dashboard")
}

export async function signUpWithEmail(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string

  if (!email || !password) {
    return { error: "Email and password are required." }
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return {
    success:
      "Check your email for a confirmation link to complete your registration.",
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/sign-in")
}

"use client"

import { useActionState } from "react"
import { useSearchParams } from "next/navigation"

import {
  signInWithEmail,
  signUpWithEmail,
  type AuthState,
} from "@/app/auth/actions"
import {
  AuthDivider,
  AuthFooterLink,
  AuthLayout,
} from "@/components/auth/auth-layout"
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const initialState: AuthState = {}

function SignInForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") ?? "/dashboard"
  const authError = searchParams.get("error")

  const [state, formAction, pending] = useActionState(
    signInWithEmail,
    initialState
  )

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue tracking applications."
    >
      <GoogleSignInButton redirectTo={redirectTo} />

      <AuthDivider />

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="redirect" value={redirectTo} />

        <FieldGroup className="space-y-4">
          <Field>
            <FieldLabel htmlFor="email" className="text-xs font-semibold">Email address</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@domain.com"
              autoComplete="email"
              required
              className="h-11 rounded-xl bg-background/50 border-border/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password" className="text-xs font-semibold">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="h-11 rounded-xl bg-background/50 border-border/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
            />
          </Field>
        </FieldGroup>

        {(state.error || authError) && (
          <FieldError className="text-xs p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium">
            {state.error ?? "Authentication failed. Please check your credentials and try again."}
          </FieldError>
        )}

        <Button
          type="submit"
          className="h-11 w-full text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.01] active:scale-95"
          disabled={pending}
        >
          {pending ? "Signing in..." : "Sign in to Dashboard"}
        </Button>
      </form>

      <AuthFooterLink
        text="Don't have an account?"
        linkText="Create free account"
        href="/sign-up"
      />
    </AuthLayout>
  )
}

function SignUpForm() {
  const [state, formAction, pending] = useActionState(
    signUpWithEmail,
    initialState
  )

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Start tracking applications and running AI auto-apply in minutes."
    >
      <GoogleSignInButton />

      <AuthDivider />

      <form action={formAction} className="space-y-4">
        <FieldGroup className="space-y-4">
          <Field>
            <FieldLabel htmlFor="fullName" className="text-xs font-semibold">Full name</FieldLabel>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Jane Doe"
              autoComplete="name"
              className="h-11 rounded-xl bg-background/50 border-border/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="email" className="text-xs font-semibold">Email address</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@domain.com"
              autoComplete="email"
              required
              className="h-11 rounded-xl bg-background/50 border-border/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password" className="text-xs font-semibold">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
              minLength={6}
              className="h-11 rounded-xl bg-background/50 border-border/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
            />
          </Field>
        </FieldGroup>

        {state.error && (
          <FieldError className="text-xs p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium">
            {state.error}
          </FieldError>
        )}
        {state.success && (
          <p className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-400">
            {state.success}
          </p>
        )}

        <Button
          type="submit"
          className="h-11 w-full text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.01] active:scale-95"
          disabled={pending}
        >
          {pending ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <AuthFooterLink
        text="Already have an account?"
        linkText="Sign in"
        href="/sign-up"
      />
    </AuthLayout>
  )
}

export { SignInForm, SignUpForm }


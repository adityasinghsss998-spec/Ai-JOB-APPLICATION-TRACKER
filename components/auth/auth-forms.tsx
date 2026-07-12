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

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="h-10"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="h-10"
            />
          </Field>
        </FieldGroup>

        {(state.error || authError) && (
          <FieldError>
            {state.error ??
              "Authentication failed. Please try again."}
          </FieldError>
        )}

        <Button
          type="submit"
          size="lg"
          className="h-10 w-full text-sm"
          disabled={pending}
        >
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <AuthFooterLink
        text="Don't have an account?"
        linkText="Sign up"
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
      subtitle="Start tracking your job applications in minutes."
    >
      <GoogleSignInButton />

      <AuthDivider />

      <form action={formAction} className="space-y-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="fullName">Full name</FieldLabel>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Jane Doe"
              autoComplete="name"
              className="h-10"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="h-10"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
              minLength={6}
              className="h-10"
            />
          </Field>
        </FieldGroup>

        {state.error && <FieldError>{state.error}</FieldError>}
        {state.success && (
          <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
            {state.success}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="h-10 w-full text-sm"
          disabled={pending}
        >
          {pending ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <AuthFooterLink
        text="Already have an account?"
        linkText="Sign in"
        href="/sign-in"
      />
    </AuthLayout>
  )
}

export { SignInForm, SignUpForm }

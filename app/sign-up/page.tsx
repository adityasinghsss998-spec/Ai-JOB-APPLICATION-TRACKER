import { Suspense } from "react"

import { SignUpForm } from "@/components/auth/auth-forms"

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  )
}

"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { api } from "@/lib/api"

function VerifyEmailFlow() {
  const router = useRouter()
  const params = useSearchParams()
  const email = params.get("email") ?? ""
  const token = params.get("token") ?? ""

  useEffect(() => {
    if (!email || !token) {
      sessionStorage.setItem("email_verification_result", "invalid")
      router.replace("/login")
      return
    }

    api
      .post("/verify-email", { email, token })
      .then(() => {
        sessionStorage.setItem("email_verification_result", "success")
      })
      .catch((err: { message?: string }) => {
        sessionStorage.setItem(
          "email_verification_result",
          err?.message?.toLowerCase().includes("expired") ? "expired" : "invalid"
        )
      })
      .finally(() => {
        router.replace("/login")
      })
  }, [email, router, token])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailFlow />
    </Suspense>
  )
}

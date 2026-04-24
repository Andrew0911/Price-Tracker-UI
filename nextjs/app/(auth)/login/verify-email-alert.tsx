"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

import { useNotification } from "@/components/notification"

export function VerifyEmailAlert() {
  const params = useSearchParams()
  const { notify } = useNotification()

  useEffect(() => {
    const verified = params.get("verified")
    const error = params.get("error")

    if (verified === "1") {
      notify({
        type: "success",
        message:
          "Email verified! Your account is now active. Sign in to get started.",
      })
    } else if (verified === "0") {
      if (error === "token_expired") {
        notify({
          type: "warning",
          message:
            "Verification link expired. Please request a new verification email.",
        })
      } else if (error === "invalid_token") {
        notify({
          type: "error",
          message:
            "Invalid verification link. This link is invalid or has already been used.",
        })
      }
    }
  }, [])

  return null
}

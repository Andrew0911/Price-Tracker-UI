"use client"

import { useEffect } from "react"

import { useNotification } from "@/components/notification"

export function VerifyEmailAlert() {
  const { notify } = useNotification()

  useEffect(() => {
    const result = sessionStorage.getItem("email_verification_result")
    if (!result) return

    sessionStorage.removeItem("email_verification_result")

    if (result === "success") {
      notify({
        type: "success",
        message:
          "Email verified! Your account is now active. Sign in to get started.",
      })
    } else if (result === "expired") {
      notify({
        type: "warning",
        message:
          "Verification link expired. Please request a new verification email.",
      })
    } else if (result === "invalid") {
      notify({
        type: "error",
        message:
          "Invalid verification link. This link is invalid or has already been used.",
      })
    }
  }, [notify])

  return null
}

"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { useNotification } from "@/components/notification"
import { useErrorHandler } from "@/lib/use-error-handler"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { notify } = useNotification()
  const { handleError } = useErrorHandler()
  const email = params.get("email") ?? ""
  const token = params.get("token") ?? ""

  const [validating, setValidating] = useState(true)
  const [valid, setValid] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!email || !token) {
      router.replace("/login")
      return
    }

    api
      .post("/reset-password/validate", { email, token })
      .then(() => setValid(true))
      .catch(() => {
        notify({
          type: "error",
          message: "This password reset link is invalid or has expired.",
        })
        router.replace("/login")
      })
      .finally(() => setValidating(false))
  }, [email, notify, router, token])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post("/reset-password", {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      })
      notify({
        type: "success",
        message: "Password reset successfully. You can now sign in.",
      })
      router.push("/login")
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  if (validating || !valid) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <KeyRound className="size-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
          <p className="text-sm text-muted-foreground">
            Choose a new password for your account.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password_confirmation">Confirm password</Label>
            <div className="relative">
              <Input
                id="password_confirmation"
                type={showConfirmation ? "text" : "password"}
                autoComplete="new-password"
                required
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmation((value) => !value)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmation ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Resetting..." : "Reset password"}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}

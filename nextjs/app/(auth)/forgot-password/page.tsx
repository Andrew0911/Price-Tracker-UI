"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail } from "lucide-react"
import { api } from "@/lib/api"
import { useNotification } from "@/components/notification"
import { useErrorHandler } from "@/lib/use-error-handler"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const { notify } = useNotification()
  const { handleError } = useErrorHandler()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post("/forgot-password", { email })
      notify({
        type: "success",
        message: res.message,
      })
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm animate-in space-y-8 duration-500 fade-in slide-in-from-bottom-4">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <Mail className="size-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Forgot password</h1>
          <p className="text-sm text-muted-foreground">
            Enter the email address associated with your account and we&apos;ll
            send you a reset link.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-base md:text-sm"
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}

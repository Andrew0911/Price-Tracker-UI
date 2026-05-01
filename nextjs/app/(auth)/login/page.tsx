"use client"

import { Suspense, useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ShoppingBag, TrendingDown, Bell, Tag, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { VerifyEmailAlert } from "./verify-email-alert"
import { api, setAuthToken } from "@/lib/api"
import { useErrorHandler } from "@/lib/use-error-handler"
import { useNotification } from "@/components/notification"

type LoginData = {
  token: string
  tokenType: string
  expiresAt: string
}

export default function LoginPage() {
  const router = useRouter()
  const { handleError } = useErrorHandler()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { notify } = useNotification()

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await api.post<LoginData>("/login", { email, password })
      setAuthToken(res.data!.token)
      notify({
        type: "success",
        message: "Login successful",
      })
      router.push("/dashboard")
    } catch (err) {
      handleError(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Suspense>
        <VerifyEmailAlert />
      </Suspense>
      <div className="flex min-h-screen">
        {/* Left decorative panel */}
        <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-20 -left-20 size-96 rounded-full bg-white/30 blur-3xl" />
            <div className="absolute -right-20 -bottom-20 size-96 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-2xl" />
          </div>

          {/* Logo */}
          <div className="relative flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <ShoppingBag className="size-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Price Pulse
            </span>
          </div>

          {/* Center content */}
          <div className="relative space-y-8">
            <div className="space-y-3">
              <h1 className="text-4xl leading-tight font-bold tracking-tight">
                Shop smarter,
                <br />
                save more.
              </h1>
              <p className="text-lg text-primary-foreground/70">
                Track prices across stores and get notified when your favorites
                drop.
              </p>
            </div>

            {/* Feature list */}
            <div className="space-y-4">
              {[
                { icon: TrendingDown, text: "Real-time price history charts" },
                { icon: Bell, text: "Instant drop alerts via email" },
                { icon: Tag, text: "Price comparison across retailers" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                    <Icon className="size-4" />
                  </div>
                  <span className="text-sm text-primary-foreground/80">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom quote */}
          <p className="relative text-xs text-primary-foreground/50">
            &copy; {new Date().getFullYear()} Price Pulse. All rights reserved.
          </p>
        </div>

        {/* Right form panel */}
        <div className="flex w-full animate-in flex-col items-center justify-center bg-background px-6 py-12 duration-500 fade-in slide-in-from-bottom-4 lg:w-1/2">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShoppingBag className="size-5" />
            </div>
            <span className="text-base font-semibold">Price Pulse</span>
          </div>

          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold tracking-tight">
                Welcome back
              </h2>
              <p className="text-sm text-muted-foreground">
                Sign in to your account to continue
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
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="#"
                    className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    autoComplete="current-password"
                    className="pr-10"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-2 text-muted-foreground">
                  Don&apos;t have an account?
                </span>
              </div>
            </div>

            <Link href="/register">
              <Button variant="outline" className="w-full" size="lg">
                Create an account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

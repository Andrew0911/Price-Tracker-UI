"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, TriangleAlert, Settings, Eye, EyeOff } from "lucide-react"
import { api, clearAuthToken } from "@/lib/api"
import { clearUserCache, useUser } from "@/lib/user-context"
import { useNotification } from "@/components/notification"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function AccountSettingsPage() {
  const router = useRouter()
  const { notify } = useNotification()
  const { user, loading: userLoading, setUser } = useUser()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [showDeletePassword, setShowDeletePassword] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [privateAccountOverride, setPrivateAccountOverride] = useState<
    boolean | null
  >(null)
  const [savingPrivacy, setSavingPrivacy] = useState(false)

  const privateAccount = privateAccountOverride ?? user?.private_account ?? true

  async function handlePrivacyChange(checked: boolean) {
    const previousValue = privateAccount
    setPrivateAccountOverride(checked)
    setSavingPrivacy(true)

    try {
      const res = await api.patch<typeof user>("/user", {
        private_account: checked,
      })
      if (res.data) {
        setUser(res.data)
      }
      notify({
        type: "success",
        message: checked
          ? "Your account is now private"
          : "Your account is now public",
      })
      setPrivateAccountOverride(null)
    } catch (err: unknown) {
      setPrivateAccountOverride(previousValue)
      const apiErr = err as { message?: string }
      notify({
        type: "error",
        message: apiErr?.message ?? "Could not update privacy settings.",
      })
    } finally {
      setSavingPrivacy(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      await api.delete("/account", { body: { password: deletePassword } })
      clearAuthToken()
      clearUserCache()
      router.push("/login")
    } catch (err: unknown) {
      const apiErr = err as {
        errors?: Record<string, string[]>
        message?: string
      }
      const msg =
        apiErr?.errors?.password?.[0] ??
        apiErr?.message ??
        "Something went wrong."
      notify({
        type: "error",
        message: msg,
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="no-scrollbar flex h-full flex-col overflow-y-auto">
      <div className="relative mb-3 shrink-0 overflow-hidden px-4 pt-4 pb-4 md:px-6 md:pt-6 md:pb-5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/3 to-transparent" />
        <div className="pointer-events-none absolute -top-10 -right-10 size-48 rounded-full bg-primary/8 blur-3xl" />
        <div className="relative">
          <div className="mb-1 flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25 md:size-9">
              <Settings className="size-4 text-primary md:size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Account settings
            </h1>
          </div>
          <p className="pl-0.5 text-sm text-muted-foreground">
            Manage your account preferences.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-xl px-4 pb-6 md:px-6">
        <div className="flex w-full flex-col gap-6">
          <div className="animate-in rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5 duration-300 fill-mode-both fade-in slide-in-from-bottom-3">
            <h2 className="mb-4 text-sm font-semibold">Profile</h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="text-sm font-medium">
                  {userLoading ? "..." : user?.name}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm font-medium">
                  {userLoading ? "..." : user?.email}
                </p>
              </div>
            </div>
          </div>

          <div
            className="animate-in rounded-3xl bg-card p-6 shadow-sm ring-1 ring-primary/50 duration-300 fill-mode-both fade-in slide-in-from-bottom-3"
            style={{ animationDelay: "75ms" }}
          >
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-primary">Privacy</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Control whether other users can discover your account.
              </p>
            </div>

            {user?.is_admin ? (
              <div className="rounded-2xl bg-primary/10 p-4 ring-1 ring-primary/15">
                <p className="text-sm font-medium text-primary">
                  Private account
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Admin accounts are always private and cannot participate in
                  social features.
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-primary/10 p-4 ring-1 ring-primary/15">
                <div className="flex flex-col gap-1">
                  <Label
                    htmlFor="private-account"
                    className="text-sm text-primary"
                  >
                    Private account
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    When enabled, other regular users cannot discover your
                    account.
                  </p>
                </div>
                <Switch
                  id="private-account"
                  checked={privateAccount}
                  onCheckedChange={handlePrivacyChange}
                  disabled={userLoading || savingPrivacy}
                />
              </div>
            )}
          </div>

          <div
            className="animate-in rounded-3xl bg-card p-6 shadow-sm ring-1 ring-destructive/30 duration-300 fill-mode-both fade-in slide-in-from-bottom-3"
            style={{ animationDelay: "150ms" }}
          >
            <h2 className="mb-1 text-sm font-semibold text-destructive">
              Danger zone
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Deleting your account is permanent. All your tracked products and
              price alerts will be removed immediately.
            </p>

            {!showDeleteConfirm ? (
              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="gap-2"
                >
                  Delete account
                </Button>
              </div>
            ) : (
              <div className="flex animate-in flex-col gap-4 duration-200 fade-in slide-in-from-top-2">
                <div className="flex items-start gap-2 rounded-2xl bg-destructive/10 p-4 text-xs text-destructive">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    This action cannot be undone. Enter your password to
                    confirm.
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="delete-password" className="text-xs">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="delete-password"
                      type={showDeletePassword ? "text" : "password"}
                      placeholder="Your current password"
                      value={deletePassword}
                      onChange={(e) => {
                        setDeletePassword(e.target.value)
                      }}
                      className="h-10 rounded-xl pr-10 text-base md:text-sm"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeletePassword((value) => !value)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showDeletePassword ? "Hide password" : "Show password"
                      }
                    >
                      {showDeletePassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeletePassword("")
                      setShowDeletePassword(false)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={!deletePassword || deleting}
                    onClick={handleDeleteAccount}
                    className="gap-2"
                  >
                    {deleting && (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    )}
                    Yes, delete my account
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, TriangleAlert } from "lucide-react"
import { api, clearAuthToken } from "@/lib/api"
import { clearUserCache, useUser } from "@/lib/user-context"
import { useNotification } from "@/components/notification"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AccountSettingsPage() {
  const router = useRouter()
  const { notify } = useNotification()
  const { user, loading: userLoading } = useUser()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDeleteAccount() {
    setDeleteError(null)
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
      setDeleteError(msg)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto px-6 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Account settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account preferences.
        </p>
      </div>

      <div className="mx-auto w-full max-w-xl">
        <div className="flex w-full flex-col gap-6">
          {/* Account info (read-only for now) */}
          <div className="animate-in rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5 duration-300 fill-mode-both fade-in slide-in-from-bottom-3">
            <h2 className="mb-4 text-sm font-semibold">Profile</h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="text-sm font-medium">
                  {userLoading ? "…" : user?.name}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm font-medium">
                  {userLoading ? "…" : user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div
            className="animate-in rounded-3xl bg-card p-6 shadow-sm ring-1 ring-destructive/30 duration-300 fill-mode-both fade-in slide-in-from-bottom-3"
            style={{ animationDelay: "75ms" }}
          >
            <h2 className="mb-1 text-sm font-semibold text-destructive">
              Danger zone
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Deleting your account is permanent. All your tracked products and
              price alerts will be removed immediately.
            </p>

            {!showDeleteConfirm ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete account
              </Button>
            ) : (
              <div className="flex animate-in flex-col gap-3 duration-200 fade-in slide-in-from-top-2">
                <div className="flex items-start gap-2 rounded-2xl bg-destructive/10 p-3 text-xs text-destructive">
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
                  <Input
                    id="delete-password"
                    type="password"
                    placeholder="Your current password"
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value)
                      setDeleteError(null)
                    }}
                    className="h-9 rounded-xl text-sm"
                    autoFocus
                  />
                  {deleteError && (
                    <p className="text-xs text-destructive">{deleteError}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={!deletePassword || deleting}
                    onClick={handleDeleteAccount}
                  >
                    {deleting && (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    )}
                    Yes, delete my account
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeletePassword("")
                      setDeleteError(null)
                    }}
                  >
                    Cancel
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

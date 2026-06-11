"use client"

import { useCallback, useEffect, useState } from "react"
import {
  ShieldUser,
  ShieldCheck,
  Search,
  Trash2,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { api } from "@/lib/api"
import { useUser } from "@/lib/user-context"
import { useNotification } from "@/components/notification"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTime } from "@/lib/utils"

type AdminUser = {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  private_account: boolean
  is_admin: boolean
  created_at: string
}

type UsersResponse = {
  data: AdminUser[]
  page: number
  lastPage: number
  perPage: number
  total: number
}

const PER_PAGE_OPTIONS = [6, 12, 24, 48]

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex animate-in flex-col items-center justify-center gap-4 py-24 duration-300 fill-mode-both fade-in slide-in-from-bottom-3">
      <div className="flex size-18 items-center justify-center rounded-3xl bg-primary/10 p-4 ring-1 ring-primary/20">
        <ShieldUser className="size-9 text-primary" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold">{title}</p>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function UserDetailsContent({
  target,
  mobile = false,
  currentUserId,
  onPromote,
  onDelete,
}: {
  target: AdminUser
  mobile?: boolean
  currentUserId?: number
  onPromote: (target: AdminUser) => void
  onDelete: (target: AdminUser) => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">{target.name}</h2>
        <p className="text-sm text-muted-foreground">{target.email}</p>
      </div>

      <div className="space-y-3 text-sm">
        <div className="rounded-2xl bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Role</p>
          <p className="font-medium">{target.is_admin ? "Admin" : "User"}</p>
        </div>
        <div className="rounded-2xl bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Visibility</p>
          <p className="font-medium">
            {target.private_account ? "Private" : "Public"}
          </p>
        </div>
        <div className="rounded-2xl bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Email verified</p>
          <p className="font-medium">
            {target.email_verified_at ? "Yes" : "No"}
          </p>
        </div>
        <div className="rounded-2xl bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Created</p>
          <p className="font-medium">{formatDateTime(target.created_at)}</p>
        </div>
      </div>

      <div className={mobile ? "mt-5 space-y-2" : "mt-auto space-y-2 pt-5"}>
        {!target.is_admin && (
          <Button
            variant="default"
            className="w-full gap-2"
            disabled={target.id === currentUserId}
            onClick={() => onPromote(target)}
          >
            <ShieldCheck className="size-4" />
            Make admin
          </Button>
        )}
        <Button
          variant="destructive"
          className="w-full gap-2"
          disabled={target.id === currentUserId}
          onClick={() => onDelete(target)}
        >
          <Trash2 className="size-4" />
          Delete account
        </Button>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const { user } = useUser()
  const { notify } = useNotification()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [perPage, setPerPage] = useState(12)
  const [total, setTotal] = useState(0)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [detailsUser, setDetailsUser] = useState<AdminUser | null>(null)
  const [detailsClosing, setDetailsClosing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [promoteTarget, setPromoteTarget] = useState<AdminUser | null>(null)
  const [promoting, setPromoting] = useState(false)

  const loadUsers = useCallback(async (
    search = "",
    targetPage = page,
    targetPerPage = perPage
  ) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        perPage: String(targetPerPage),
      })
      if (search) params.set("search", search)

      const res = await api.get<never>(`/admin/users?${params.toString()}`)
      const payload = res as unknown as UsersResponse
      setUsers(payload.data ?? [])
      setPage(payload.page ?? 1)
      setLastPage(payload.lastPage ?? 1)
      setPerPage(payload.perPage ?? targetPerPage)
      setTotal(payload.total ?? 0)
    } catch (err: unknown) {
      notify({
        type: "error",
        message: errorMessage(err, "Could not load users."),
      })
    } finally {
      setLoading(false)
    }
  }, [notify, page, perPage])

  useEffect(() => {
    const timer = setTimeout(() => loadUsers(query.trim(), page, perPage), 250)
    return () => clearTimeout(timer)
  }, [loadUsers, query, page, perPage])

  async function handleDeleteUser() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`)
      notify({
        type: "success",
        message: `${deleteTarget.name}'s account was deleted`,
      })
      if (selectedUser?.id === deleteTarget.id) {
        setSelectedUser(null)
      }
      setDeleteTarget(null)
      const nextPage = users.length === 1 && page > 1 ? page - 1 : page
      await loadUsers(query.trim(), nextPage, perPage)
    } catch (err: unknown) {
      notify({
        type: "error",
        message: errorMessage(err, "Could not delete user."),
      })
    } finally {
      setDeleting(false)
    }
  }

  async function handlePromoteUser() {
    if (!promoteTarget) return
    setPromoting(true)
    try {
      const res = await api.patch<never>(
        `/admin/users/${promoteTarget.id}/promote`
      )
      const promoted = (res as unknown as { data?: AdminUser }).data
      const nextUser = promoted ?? { ...promoteTarget, is_admin: true }

      setUsers((current) =>
        current.map((item) => (item.id === nextUser.id ? nextUser : item))
      )
      if (selectedUser?.id === nextUser.id) {
        setSelectedUser(nextUser)
      }
      if (detailsUser?.id === nextUser.id) {
        setDetailsUser(nextUser)
      }
      notify({
        type: "success",
        message: `${nextUser.name} is now an admin`,
      })
      setPromoteTarget(null)
      await loadUsers(query.trim(), page, perPage)
    } catch (err: unknown) {
      notify({
        type: "error",
        message: errorMessage(err, "Could not promote user."),
      })
    } finally {
      setPromoting(false)
    }
  }

  function closeDesktopDetails() {
    setDetailsClosing(true)
    setSelectedUser(null)
    window.setTimeout(() => {
      setDetailsUser(null)
      setDetailsClosing(false)
    }, 300)
  }

  function selectUser(target: AdminUser) {
    setSelectedUser(target)
    setDetailsUser(target)
    setDetailsClosing(false)
  }

  if (user && !user.is_admin) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        You do not have access to this page.
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="relative shrink-0 overflow-hidden px-4 pt-4 pb-4 md:px-6 md:pt-6 md:pb-5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/3 to-transparent" />
        <div className="pointer-events-none absolute -top-10 -right-10 size-48 rounded-full bg-primary/8 blur-3xl" />
        <div className="relative">
          <div className="mb-1 flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25 md:size-9">
              <ShieldUser className="size-4 text-primary md:size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Users
            </h1>
          </div>
          <p className="pl-0.5 text-sm text-muted-foreground">
            View all accounts and manage access.
          </p>
        </div>
      </div>

      <div className="shrink-0 px-4 pb-4 md:px-6 md:pb-5">
        <div className="relative">
          <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Search users by name or email..."
            className="h-12 rounded-2xl bg-muted/50 pl-11 text-base md:text-sm"
          />
        </div>
      </div>

      <div
        className={`grid min-h-0 flex-1 gap-4 overflow-hidden px-6 pb-4 transition-[grid-template-columns] duration-300 ease-out ${
          detailsUser ? "lg:grid-cols-[minmax(0,1fr)_360px]" : "lg:grid-cols-1"
        }`}
      >
        <div className="flex min-h-0 flex-col overflow-hidden">
          {!loading && total > 0 && (
            <div className="mb-4 text-sm text-muted-foreground">
              {total} user{total === 1 ? "" : "s"}
            </div>
          )}
          <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-3 pr-0 md:pr-2 md:pb-4 md:[&::-webkit-scrollbar]:w-1.5 md:[&::-webkit-scrollbar-thumb]:rounded-full md:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 md:hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50 md:[&::-webkit-scrollbar-track]:rounded-full md:[&::-webkit-scrollbar-track]:bg-transparent">
            {loading
              ? (
                  <div className="flex flex-col gap-2">
                    {Array.from({ length: perPage }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                    ))}
                  </div>
                )
              : users.length === 0 ? (
                  <EmptyState
                    title={query.trim() ? "No matches" : "No users found"}
                    description={
                      query.trim()
                        ? `No users matching "${query.trim()}"`
                        : "User accounts will appear here once they are created."
                    }
                  />
                )
              : users.map((item, i) => (
                  <button
                    key={item.id}
                    onClick={() => selectUser(item)}
                    className={`flex w-full animate-in items-center justify-between rounded-2xl border bg-muted/35 p-4 text-left transition-colors duration-300 fill-mode-both fade-in slide-in-from-bottom-3 dark:border-white/5 dark:bg-muted/55 ${
                      selectedUser?.id === item.id
                        ? "border-primary bg-primary/5 dark:bg-primary/10"
                        : "border-border hover:bg-muted/55 dark:hover:bg-muted/70"
                    }`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{item.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {item.email}
                      </p>
                    </div>
                    <div className="ml-4 flex shrink-0 gap-2 text-xs">
                      {item.is_admin && (
                        <span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">
                          Admin
                        </span>
                      )}
                      <span className="rounded-full bg-muted px-2 py-1">
                        {item.private_account ? "Private" : "Public"}
                      </span>
                    </div>
                  </button>
                ))}
          </div>
        </div>

        {detailsUser && (
          <div
            className={`hidden min-h-0 overflow-hidden rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/5 duration-300 fill-mode-both lg:block ${
              detailsClosing
                ? "animate-out fade-out slide-out-to-right-6"
                : "animate-in fade-in slide-in-from-right-6"
            }`}
          >
            <div className="relative h-full">
              <button
                onClick={closeDesktopDetails}
                className="absolute top-0 right-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close user details"
              >
                <X className="size-4" />
              </button>
              <UserDetailsContent
                target={detailsUser}
                currentUserId={user?.id}
                onPromote={setPromoteTarget}
                onDelete={setDeleteTarget}
              />
            </div>
          </div>
        )}
      </div>

      {!loading && total > 0 && (
        <div className="shrink-0 border-t border-border px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-3 md:hidden">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Per page:</span>
              <div className="flex gap-1">
                {PER_PAGE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setPerPage(option)
                      setPage(1)
                    }}
                    className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
                      perPage === option
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {lastPage > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0 p-0"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="size-4" />
                </Button>

                <div className="flex h-9 min-w-9 items-center justify-center rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground">
                  {page}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0 p-0"
                  onClick={() =>
                    setPage((current) => Math.min(lastPage, current + 1))
                  }
                  disabled={page === lastPage}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="hidden items-center justify-between gap-4 md:flex">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Users per page:</span>
              <div className="flex gap-1">
              {PER_PAGE_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setPerPage(option)
                    setPage(1)
                  }}
                  className={`rounded-lg px-1.5 py-0.5 text-[10px] font-medium transition-colors md:px-2.5 md:py-1 md:text-xs ${
                    perPage === option
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            </div>

            {lastPage > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 p-0"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="size-4" />
                </Button>

                <div className="flex h-8 min-w-8 items-center justify-center rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground">
                  {page}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 p-0"
                  onClick={() =>
                    setPage((current) => Math.min(lastPage, current + 1))
                  }
                  disabled={page === lastPage}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedUser && (
        <div
          className="fixed inset-0 z-40 flex animate-in items-center justify-center bg-black/45 p-4 backdrop-blur-sm fade-in-0 lg:hidden"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="w-full max-w-sm animate-in rounded-3xl bg-card p-5 shadow-2xl ring-1 ring-foreground/10 zoom-in-95 slide-in-from-bottom-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold">User details</p>
              <button
                onClick={() => setSelectedUser(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <UserDetailsContent
              target={selectedUser}
              mobile
              currentUserId={user?.id}
              onPromote={setPromoteTarget}
              onDelete={setDeleteTarget}
            />
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex animate-in items-start justify-center bg-black/50 px-4 pt-[20vh] backdrop-blur-sm fade-in-0 sm:px-0"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-md animate-in rounded-3xl bg-card p-8 shadow-xl ring-1 ring-foreground/10 zoom-in-95 slide-in-from-top-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Delete user</h2>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget.name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={deleting}
                className="gap-2"
              >
                {deleting && <Loader2 className="size-4 animate-spin" />}
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {promoteTarget && (
        <div
          className="fixed inset-0 z-50 flex animate-in items-start justify-center bg-black/50 px-4 pt-[20vh] backdrop-blur-sm sm:px-0 fade-in-0"
          onClick={() => setPromoteTarget(null)}
        >
          <div
            className="w-full max-w-md animate-in rounded-3xl bg-card p-8 shadow-xl ring-1 ring-foreground/10 zoom-in-95 slide-in-from-top-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Make admin</h2>
              <button
                onClick={() => setPromoteTarget(null)}
                disabled={promoting}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to make{" "}
              <span className="font-semibold text-foreground">
                {promoteTarget.name}
              </span>{" "}
              an admin? They will lose access to social features like friends and
              messaging.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setPromoteTarget(null)}
                disabled={promoting}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePromoteUser}
                disabled={promoting}
                className="gap-2"
              >
                {promoting && <Loader2 className="size-4 animate-spin" />}
                {promoting ? "Promoting..." : "Make admin"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}





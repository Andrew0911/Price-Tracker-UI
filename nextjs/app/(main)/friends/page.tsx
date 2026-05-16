"use client"

import { useCallback, useEffect, useState } from "react"
import {
  UserPlus,
  UserMinus,
  Check,
  X,
  Clock,
  Search,
  Users,
  UserCheck,
  Sparkles,
  Loader2,
  MessageCircle,
  Info,
  Ban,
} from "lucide-react"
import { api } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useNotification } from "@/components/notification"
import { ChatPanel } from "@/components/chat-panel"

type FriendshipStatus =
  | "none"
  | "pending_sent"
  | "pending_received"
  | "accepted"
type DiscoverUser = {
  id: number
  name: string
  email: string
  friendship_status: FriendshipStatus
}
type SimpleUser = { id: number; name: string; email: string }
type Tab = "discover" | "friends" | "requests"

const AVATAR_GRADIENTS = [
  "from-emerald-400 to-green-600",
  "from-green-400 to-teal-500",
  "from-teal-400 to-emerald-600",
  "from-lime-400 to-green-500",
  "from-green-500 to-emerald-700",
  "from-emerald-500 to-teal-600",
]
function getGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
  return (
    <div
      className={`flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getGradient(name)} text-sm font-bold text-white shadow-md ring-2 shadow-primary/20 ring-white/20`}
    >
      {initials}
    </div>
  )
}

function UserRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-card px-5 py-4 ring-1 ring-foreground/5">
      <Skeleton className="size-12 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-52" />
      </div>
      <Skeleton className="h-9 w-24 rounded-full" />
    </div>
  )
}

function UserRow({
  user,
  actions,
  index = 0,
  compact = false,
}: {
  user: { name: string; email: string }
  actions: React.ReactNode
  index?: number
  compact?: boolean
}) {
  return (
    <div
      className={`flex animate-in items-center rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5 duration-300 fill-mode-both fade-in slide-in-from-bottom-3 ${
        compact ? "gap-3 px-4 py-3.5" : "gap-4 px-5 py-4"
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <UserAvatar name={user.name} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-semibold no-underline [text-decoration:none] [&_a]:no-underline [&_a]:[text-decoration:none]">
          {user.name}
        </span>
        <span className="truncate text-sm text-muted-foreground">
          {user.email}
        </span>
      </div>
      <div className="flex shrink-0 gap-2">{actions}</div>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex animate-in flex-col items-center justify-center gap-4 py-24 duration-300 fill-mode-both fade-in slide-in-from-bottom-3">
      <div className="flex size-18 items-center justify-center rounded-3xl bg-primary/10 p-4 ring-1 ring-primary/20">
        <Icon className="size-9 text-primary" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold">{title}</p>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export default function FriendsPage() {
  const { notify } = useNotification()
  const [tab, setTab] = useState<Tab>("discover")
  const [query, setQuery] = useState("")

  const [discoverUsers, setDiscoverUsers] = useState<DiscoverUser[]>([])
  const [friends, setFriends] = useState<SimpleUser[]>([])
  const [requests, setRequests] = useState<SimpleUser[]>([])
  const [discoverLoading, setDiscoverLoading] = useState(false)
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set())
  const [removeTarget, setRemoveTarget] = useState<{
    id: number
    name: string
  } | null>(null)
  const [chatFriend, setChatFriend] = useState<SimpleUser | null>(null)
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({})

  const loadFriends = useCallback(async () => {
    try {
      const res = await api.get<SimpleUser[]>("/friends")
      const data = (res as any).data ?? []
      setFriends(Array.isArray(data) ? data : [])
    } catch {}
  }, [])

  const loadRequests = useCallback(async () => {
    try {
      const res = await api.get<SimpleUser[]>("/friends/requests")
      const data = (res as any).data ?? []
      setRequests(Array.isArray(data) ? data : [])
    } catch {}
  }, [])

  const loadDiscover = useCallback(async (q: string) => {
    setDiscoverLoading(true)
    try {
      const endpoint = q ? `/users?search=${encodeURIComponent(q)}` : `/users`
      const res = await api.get<DiscoverUser[]>(endpoint)
      const data = (res as any).data ?? []
      setDiscoverUsers(Array.isArray(data) ? data : [])
    } catch {
    } finally {
      setDiscoverLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const timer = setTimeout(() => {
      if (mounted) loadDiscover(query)
    }, 300)
    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [query, loadDiscover])

  useEffect(() => {
    loadFriends()
    loadRequests()
    loadUnreadCounts()
  }, [loadFriends, loadRequests])

  async function loadUnreadCounts() {
    try {
      const res = await api.get<Record<number, number>>(
        "/messages/unread-counts"
      )
      const data = (res as any).data ?? {}
      setUnreadCounts(data)
    } catch (e) {}
  }

  function setPending(id: number, on: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev)
      on ? next.add(id) : next.delete(id)
      return next
    })
  }

  async function handleAction(
    userId: number,
    action: "send" | "cancel" | "accept" | "decline" | "remove",
    userName: string
  ) {
    setPending(userId, true)
    try {
      switch (action) {
        case "send":
          await api.post(`/friends/${userId}`)
          notify({
            type: "success",
            message: `Friend request sent to ${userName}`,
          })
          break
        case "cancel":
          await api.delete(`/friends/${userId}`)
          notify({ type: "success", message: "Friend request cancelled" })
          break
        case "accept":
          await api.post(`/friends/${userId}/accept`)
          notify({
            type: "success",
            message: `You are now friends with ${userName}`,
          })
          break
        case "decline":
          await api.delete(`/friends/${userId}/decline`)
          notify({ type: "success", message: "Friend request declined" })
          break
        case "remove":
          await api.delete(`/friends/${userId}`)
          notify({
            type: "success",
            message: `${userName} removed from friends`,
          })
          break
      }
      await Promise.all([loadDiscover(query), loadFriends(), loadRequests()])
    } catch (e: any) {
      notify({ type: "error", message: e?.message ?? "Something went wrong" })
    } finally {
      setPending(userId, false)
    }
  }

  const lq = query.toLowerCase()
  const filteredFriends = lq
    ? friends.filter(
        (f) =>
          f.name.toLowerCase().includes(lq) ||
          f.email.toLowerCase().includes(lq)
      )
    : friends
  const filteredRequests = lq
    ? requests.filter(
        (r) =>
          r.name.toLowerCase().includes(lq) ||
          r.email.toLowerCase().includes(lq)
      )
    : requests

  function discoverActions(u: DiscoverUser) {
    const p = pendingIds.has(u.id)
    switch (u.friendship_status) {
      case "accepted":
        return (
          <Button
            variant="destructive"
            size="sm"
            disabled={p}
            onClick={() => setRemoveTarget({ id: u.id, name: u.name })}
            className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
          >
            <UserMinus className="size-3.5 sm:size-4" />
            <span className="hidden sm:inline">Remove</span>
          </Button>
        )
      case "pending_sent":
        return (
          <Button
            variant="destructive"
            size="sm"
            disabled={p}
            onClick={() => handleAction(u.id, "cancel", u.name)}
            className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:gap-1.5 sm:px-3 sm:text-sm"
          >
            <Ban className="size-3.5 sm:size-4" />
            <span className="hidden sm:inline">Cancel friend request</span>
          </Button>
        )
      case "pending_received":
        return (
          <>
            <Button
              variant="default"
              size="sm"
              disabled={p}
              onClick={() => handleAction(u.id, "accept", u.name)}
              className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:gap-1.5 sm:px-3 sm:text-sm"
            >
              <Check className="size-3.5 sm:size-4" />
              <span className="hidden sm:inline">Accept</span>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={p}
              onClick={() => handleAction(u.id, "decline", u.name)}
              className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
            >
              <X className="size-3.5 sm:size-4" />
              <span className="hidden sm:inline">Decline</span>
            </Button>
          </>
        )
      default:
        return (
          <Button
            variant="default"
            size="sm"
            disabled={p}
            onClick={() => handleAction(u.id, "send", u.name)}
            className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:gap-1.5 sm:px-3 sm:text-sm"
          >
            <UserPlus className="size-3.5 sm:size-4" />
            <span className="hidden sm:inline">Add friend</span>
          </Button>
        )
    }
  }

  const tabConfig: {
    id: Tab
    label: string
    icon: React.ElementType
    count?: number
  }[] = [
    { id: "discover", label: "Discover", icon: Sparkles },
    { id: "friends", label: "Friends", icon: UserCheck, count: friends.length },
    { id: "requests", label: "Requests", icon: Users, count: requests.length },
  ]

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Hero Header */}
      <div className="relative shrink-0 overflow-hidden px-6 pt-6 pb-5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/3 to-transparent" />
        <div className="pointer-events-none absolute -top-10 -right-10 size-48 rounded-full bg-primary/8 blur-3xl" />

        <div className="relative flex items-end justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
                <Users className="size-5 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
            </div>
            <p className="pl-0.5 text-sm text-muted-foreground">
              Discover people and manage your connections
            </p>
          </div>

          {/* Stat pills */}
          <div className="hidden items-center gap-2 pb-0.5 sm:flex">
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-chart-3 ring-1 ring-primary/20">
              <UserCheck className="size-3.5" />
              {friends.length} friend{friends.length !== 1 ? "s" : ""}
            </div>
            {requests.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
                <Clock className="size-3.5" />
                {requests.length} pending
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Tabs + Search */}
      <div className="flex shrink-0 flex-col gap-3 px-6 pb-5">
        {/* Mobile tabs */}
        <div className="grid grid-cols-3 rounded-2xl bg-muted/70 p-1 ring-1 ring-foreground/5 sm:hidden">
          {tabConfig.map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => {
                setTab(id)
                setQuery("")
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-sm font-semibold transition-all duration-200 ${
                tab === id
                  ? "bg-card text-foreground shadow-sm ring-1 ring-foreground/5"
                  : "text-muted-foreground"
              }`}
            >
              <span>{label}</span>
              {count !== undefined && (
                <span
                  className={`flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold ${
                    id === "requests"
                      ? "bg-amber-500 text-white"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Desktop tabs */}
        <div className="hidden gap-1.5 rounded-2xl bg-muted/70 p-1.5 ring-1 ring-foreground/5 sm:flex">
          {tabConfig.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => {
                setTab(id)
                setQuery("")
              }}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                tab === id
                  ? "bg-card text-foreground shadow-sm ring-1 ring-foreground/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`size-4 ${tab === id ? "text-primary" : ""}`} />
              {label}
              {count !== undefined && (
                <span
                  className={`flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold ${
                    id === "requests"
                      ? "bg-amber-500 text-white"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "discover" && (
          <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-sm ring-1 ring-foreground/5">
            <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Info className="size-4" />
            </div>
            <div className="text-sm leading-5">
              <p className="font-medium text-foreground">
                Discover shows friends and public users.
              </p>
              <p className="text-muted-foreground">
                To find any user, search by their exact email address.
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
            placeholder={
              tab === "discover"
                ? "Search by exact email..."
                : tab === "friends"
                  ? "Filter friends..."
                  : "Filter requests..."
            }
            className="h-12 rounded-2xl bg-muted/50 pl-11 text-sm focus-visible:border-primary focus-visible:ring-primary/30"
          />
        </div>
      </div>
      {/* Content scrollable */}
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-6 pt-2 pb-6">
        {/* Discover */}
        {tab === "discover" &&
          (discoverLoading ? (
            Array.from({ length: 5 }).map((_, i) => <UserRowSkeleton key={i} />)
          ) : discoverUsers.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No users found"
              description={
                query
                  ? `No results for "${query}"`
                  : "Check back later for new people to connect with"
              }
            />
          ) : (
            discoverUsers.map((u, i) => (
              <UserRow
                key={u.id}
                user={u}
                actions={discoverActions(u)}
                index={i}
              />
            ))
          ))}

        {/* Friends */}
        {tab === "friends" &&
          (filteredFriends.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title={lq ? "No matches" : "No friends yet"}
              description={
                lq
                  ? `No friends matching "${query}"`
                  : "Start by discovering people in the Discover tab"
              }
            />
          ) : (
            filteredFriends.map((u, i) => (
              <UserRow
                key={u.id}
                user={u}
                index={i}
                compact
                actions={
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setChatFriend(u)
                        setUnreadCounts((prev) => {
                          const next = { ...prev }
                          delete next[u.id]
                          return next
                        })
                      }}
                      className="relative h-8 w-8 border-transparent bg-blue-500 p-0 text-white shadow-sm hover:bg-blue-600 sm:h-9 sm:w-auto sm:gap-1.5 sm:px-3 sm:text-sm"
                    >
                      <MessageCircle className="size-3.5 sm:size-4" />
                      <span className="hidden sm:inline">Message</span>
                      {(unreadCounts[u.id] ?? 0) > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 py-0.5 text-[9px] font-bold leading-none text-white">
                          {(unreadCounts[u.id] ?? 0) > 99
                            ? "99+"
                            : (unreadCounts[u.id] ?? 0)}
                        </span>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={pendingIds.has(u.id)}
                      onClick={() =>
                        setRemoveTarget({ id: u.id, name: u.name })
                      }
                      className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:gap-1.5 sm:px-3 sm:text-sm"
                    >
                      <UserMinus className="size-3.5 sm:size-4" />
                      <span className="hidden sm:inline">Remove</span>
                    </Button>
                  </>
                }
              />
            ))
          ))}

        {/* Requests */}
        {tab === "requests" &&
          (filteredRequests.length === 0 ? (
            <EmptyState
              icon={Users}
              title={lq ? "No matches" : "No pending requests"}
              description={
                lq
                  ? `No requests matching "${query}"`
                  : "You have no incoming friend requests right now"
              }
            />
          ) : (
            filteredRequests.map((u, i) => (
              <UserRow
                key={u.id}
                user={u}
                index={i}
                actions={
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      disabled={pendingIds.has(u.id)}
                      onClick={() => handleAction(u.id, "accept", u.name)}
                      className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:gap-1.5 sm:px-3 sm:text-sm"
                    >
                      <Check className="size-3.5 sm:size-4" />
                      <span className="hidden sm:inline">Accept</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={pendingIds.has(u.id)}
                      onClick={() => handleAction(u.id, "decline", u.name)}
                      className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                    >
                      <X className="size-3.5 sm:size-4" />
                      <span className="hidden sm:inline">Decline</span>
                    </Button>
                  </>
                }
              />
            ))
          ))}
      </div>
      {/* Remove friend confirmation modal */}
      {removeTarget && (
        <div
          className="fixed inset-0 z-50 flex animate-in items-start justify-center bg-black/50 px-4 pt-[20vh] backdrop-blur-sm sm:px-0 fade-in-0"
          onClick={() => setRemoveTarget(null)}
        >
          <div
            className="w-full max-w-md animate-in rounded-3xl bg-card p-8 shadow-xl ring-1 ring-foreground/10 zoom-in-95 slide-in-from-top-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Remove friend</h2>
              <button
                onClick={() => setRemoveTarget(null)}
                disabled={pendingIds.has(removeTarget.id)}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">
                {removeTarget.name}
              </span>{" "}
              from your friends list? You can always send a new request later.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRemoveTarget(null)}
                disabled={pendingIds.has(removeTarget.id)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={pendingIds.has(removeTarget.id)}
                onClick={async () => {
                  await handleAction(
                    removeTarget.id,
                    "remove",
                    removeTarget.name
                  )
                  setRemoveTarget(null)
                }}
                className="gap-2"
              >
                {pendingIds.has(removeTarget.id) && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {pendingIds.has(removeTarget.id) ? "Removing..." : "Remove"}
              </Button>
            </div>
          </div>
        </div>
      )}{" "}
      {/* Chat panel overlay */}
      {chatFriend && (
        <div
          className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/40 p-4 backdrop-blur-sm fade-in-0 sm:items-stretch sm:justify-end sm:p-0"
          onClick={() => setChatFriend(null)}
        >
          <div
            className="h-[85vh] w-full max-w-md animate-in duration-500 ease-in-out zoom-in-95 fade-in sm:h-full sm:w-[520px] sm:max-w-none sm:slide-in-from-right-10"
            onClick={(e) => e.stopPropagation()}
          >
            <ChatPanel
              friend={chatFriend}
              onClose={() => setChatFriend(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}















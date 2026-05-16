"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  X,
  Send,
  ShoppingBag,
  ExternalLink,
  Loader2,
  MessageCircle,
  ChevronLeft,
  BookmarkPlus,
  BookmarkCheck,
} from "lucide-react"
import { api } from "@/lib/api"
import { useNotification } from "@/components/notification"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatDateTime } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type SharedProduct = {
  id: number
  name: string
  url: string
  image_url: string | null
  store: string | null
  current_price: string | null
  currency: string
}

type Message = {
  id: number
  body: string | null
  is_mine: boolean
  product: SharedProduct | null
  read_at: string | null
  created_at: string
}

type WishlistProduct = {
  id: number
  name: string
  image_url: string | null
  store: string | null
  current_price: string | null
  currency: string
}

type WishlistResponse = {
  data: WishlistProduct[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  if (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  )
    return "Today"
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  )
    return "Yesterday"
  return d.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
// ─── Product Card (shared inside chat) ───────────────────────────────────────

function SharedProductCard({
  product,
  isOwnMessage,
}: {
  product: SharedProduct
  isOwnMessage: boolean
}) {
  const { notify } = useNotification()
  const [addState, setAddState] = useState<"idle" | "loading" | "added">("idle")

  async function handleAddToWishlist(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (addState !== "idle") return
    setAddState("loading")
    try {
      await api.post("/products", { url: product.url })
      setAddState("added")
      notify({
        type: "success",
        message: "Product added to wishlist",
      })
    } catch (err: any) {
      const msg: string = err?.message ?? ""
      if (msg.toLowerCase().includes("already")) {
        setAddState("added")
        notify({
          type: "info",
          message: "This product is already in your wishlist",
        })
      } else {
        setAddState("idle")
        notify({
          type: "error",
          message: msg || "Could not add product. Please try again.",
        })
      }
    }
  }

  return (
    <div className="mt-2 flex items-center gap-3 rounded-2xl border border-foreground/10 bg-background/60 p-3">
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="size-12 shrink-0 rounded-xl object-contain"
        />
      ) : (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted">
          <ShoppingBag className="size-5 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{product.name}</p>
        {product.current_price && (
          <p className="text-xs font-bold text-chart-3">
            {product.current_price} {product.currency}
          </p>
        )}
        {product.store && (
          <p className="truncate text-[11px] text-muted-foreground capitalize">
            {product.store}
          </p>
        )}
      </div>
      <TooltipProvider delayDuration={300}>
        {!isOwnMessage && addState !== "added" ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleAddToWishlist}
                disabled={addState === "loading"}
                className="shrink-0 rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary disabled:opacity-60"
              >
                {addState === "loading" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <BookmarkPlus className="size-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>Add to wishlist</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {addState === "added" ? (
                  <BookmarkCheck className="size-4 text-primary" />
                ) : (
                  <ExternalLink className="size-4" />
                )}
              </Link>
            </TooltipTrigger>
            <TooltipContent>View product</TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  )
}

// ─── Product Picker ───────────────────────────────────────────────────────────

function ProductPicker({
  onSelect,
  onClose,
}: {
  onSelect: (product: WishlistProduct) => void
  onClose: () => void
}) {
  const [products, setProducts] = useState<WishlistProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    api
      .get<never>("/products?perPage=100")
      .then((res) => {
        const r = res as unknown as WishlistResponse
        setProducts(r.data ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = search
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : products

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-foreground/10 px-4 py-3">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> Back
        </button>
        <span className="text-sm font-semibold">Share a product</span>
        <div className="w-16" />
      </div>

      <div className="shrink-0 p-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search wishlist..."
          className="h-9 text-base md:text-sm"
          autoFocus
        />
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="mb-2 flex items-center gap-3 rounded-2xl bg-card p-3"
            >
              <Skeleton className="size-11 rounded-xl" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {search ? `No results for "${search}"` : "Your wishlist is empty"}
          </p>
        ) : (
          filtered.map((p, i) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="mb-1.5 flex w-full animate-in items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors duration-250 fill-mode-both fade-in slide-in-from-bottom-2 hover:bg-accent"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt={p.name}
                  referrerPolicy="no-referrer"
                  className="size-11 shrink-0 rounded-xl object-contain"
                />
              ) : (
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <ShoppingBag className="size-4 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                {p.current_price && (
                  <p className="text-xs font-bold text-chart-3">
                    {p.current_price} {p.currency}
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Main ChatPanel ───────────────────────────────────────────────────────────

type ChatPanelProps = {
  friend: { id: number; name: string; email: string }
  onClose: () => void
}

const POLL_INTERVAL = 4000

export function ChatPanel({ friend, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState("")
  const [pendingProduct, setPendingProduct] = useState<WishlistProduct | null>(
    null
  )
  const [sending, setSending] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastIdRef = useRef(0)
  const isSendingRef = useRef(false)
  const isPollRunningRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const initials = friend.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")

  // Initial load
  useEffect(() => {
    setLoading(true)
    setMessages([])
    lastIdRef.current = 0

    api
      .get<never>(`/messages/${friend.id}?limit=50`)
      .then((res) => {
        const data = ((res as any).data ?? []) as Message[]
        setMessages(data)
        if (data.length > 0) lastIdRef.current = data[data.length - 1].id
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [friend.id])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: messages.length <= 50 ? "instant" : "smooth",
    })
  }, [messages])

  // Polling for new messages
  useEffect(() => {
    const poll = setInterval(async () => {
      // Skip if initial load not done, a send is in-flight, or a poll is already running
      if (lastIdRef.current === 0) return
      if (isSendingRef.current) return
      if (isPollRunningRef.current) return
      isPollRunningRef.current = true
      try {
        const res = await api.get<never>(
          `/messages/${friend.id}?after_id=${lastIdRef.current}&limit=50`
        )
        const fresh = ((res as any).data ?? []) as Message[]
        if (fresh.length > 0) {
          lastIdRef.current = fresh[fresh.length - 1].id
          setMessages((prev) => [...prev, ...fresh])
        }
      } catch {
      } finally {
        isPollRunningRef.current = false
      }
    }, POLL_INTERVAL)

    return () => clearInterval(poll)
  }, [friend.id])

  const handleSend = useCallback(async () => {
    if ((!body.trim() && !pendingProduct) || sending) return
    setSending(true)
    isSendingRef.current = true

    try {
      const payload: { body?: string; product_id?: number } = {}
      if (body.trim()) payload.body = body.trim()
      if (pendingProduct) payload.product_id = pendingProduct.id

      const res = await api.post<never>(`/messages/${friend.id}`, payload)
      const msg = (res as any).data as Message

      lastIdRef.current = msg.id
      setMessages((prev) => [...prev, msg])
      setBody("")
      setPendingProduct(null)
    } catch {
    } finally {
      isSendingRef.current = false
      setSending(false)
      inputRef.current?.focus()
    }
  }, [body, pendingProduct, sending, friend.id])

  // Map message id -> index to allow staggered animation delays
  const messageIndexMap = useMemo(() => {
    const map = new Map<number, number>()
    messages.forEach((m, idx) => map.set(m.id, idx))
    return map
  }, [messages])

  // Group messages by date for date separators
  const grouped: { date: string; items: Message[] }[] = []
  for (const msg of messages) {
    const date = formatDate(msg.created_at)
    if (grouped.length === 0 || grouped[grouped.length - 1].date !== date) {
      grouped.push({ date, items: [msg] })
    } else {
      grouped[grouped.length - 1].items.push(msg)
    }
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-3xl bg-card shadow-2xl ring-1 ring-foreground/10">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-foreground/10 px-5 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-xs font-bold text-white shadow">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{friend.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {friend.email}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Body: either the picker or the message list */}
      {showPicker ? (
        <div className="flex-1 overflow-hidden">
          <ProductPicker
            onSelect={(p) => {
              setPendingProduct(p)
              setShowPicker(false)
              inputRef.current?.focus()
            }}
            onClose={() => setShowPicker(false)}
          />
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex size-14 items-center justify-center rounded-3xl bg-primary/10 ring-1 ring-primary/20">
                  <MessageCircle className="size-7 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Start a conversation</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Send a message or share a product with {friend.name}
                  </p>
                </div>
              </div>
            ) : (
              grouped.map((group) => (
                <div key={group.date}>
                  {/* Date separator */}
                  <div className="my-3 flex items-center gap-3">
                    <div className="h-px flex-1 bg-foreground/10" />
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {group.date}
                    </span>
                    <div className="h-px flex-1 bg-foreground/10" />
                  </div>

                  {group.items.map((msg) => {
                    const idx = messageIndexMap.get(msg.id) ?? 0
                    const delay = Math.min(idx * 40, 1200)
                    return (
                      <div
                        key={msg.id}
                        className={`mb-2 flex ${msg.is_mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          style={{ animationDelay: `${delay}ms` }}
                          className={`max-w-[78%] animate-in duration-300 fill-mode-both fade-in slide-in-from-bottom-3 ${
                            msg.is_mine
                              ? "rounded-3xl rounded-br-md bg-primary text-primary-foreground"
                              : "rounded-3xl rounded-bl-md bg-muted text-foreground"
                          } px-4 py-2.5`}
                        >
                          {msg.body && (
                            <p className="text-sm break-words whitespace-pre-wrap">
                              {msg.body}
                            </p>
                          )}
                          {msg.product && (
                            <SharedProductCard
                              product={msg.product}
                              isOwnMessage={msg.is_mine}
                            />
                          )}
                          <p
                            className={`mt-1 text-right text-[10px] ${
                              msg.is_mine
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Pending product preview */}
          {pendingProduct && (
            <div className="shrink-0 border-t border-foreground/10 px-4 py-2">
              <div className="flex items-center gap-2 rounded-2xl bg-primary/10 px-3 py-2 ring-1 ring-primary/20">
                {pendingProduct.image_url ? (
                  <img
                    src={pendingProduct.image_url}
                    alt={pendingProduct.name}
                    referrerPolicy="no-referrer"
                    className="size-9 shrink-0 rounded-lg object-contain"
                  />
                ) : (
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <ShoppingBag className="size-4 text-muted-foreground" />
                  </div>
                )}
                <p className="flex-1 truncate text-xs font-medium">
                  {pendingProduct.name}
                </p>
                <button
                  onClick={() => setPendingProduct(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 border-t border-foreground/10 px-4 py-3">
            <div className="flex items-end gap-2">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowPicker(true)}
                      className="mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary"
                    >
                      <ShoppingBag className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Share a product</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                ref={inputRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write a message…"
                className="flex-1 rounded-2xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <Button
                size="icon"
                disabled={(!body.trim() && !pendingProduct) || sending}
                onClick={handleSend}
                className="mb-0.5 size-9 shrink-0 rounded-full"
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}


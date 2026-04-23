"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType = "success" | "error" | "warning" | "info"

export interface NotificationOptions {
  type: NotificationType
  title: string
  message?: string
  duration?: number
}

interface NotificationItem extends NotificationOptions {
  id: string
}

interface NotificationContextValue {
  notify: (opts: NotificationOptions) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx)
    throw new Error(
      "useNotification must be used inside <NotificationProvider>"
    )
  return ctx
}

// ─── Per-type config ──────────────────────────────────────────────────────────

const variantConfig: Record<
  NotificationType,
  {
    icon: React.ElementType
    wrapperClass: string
    iconBgClass: string
    iconClass: string
    barClass: string
    progressClass: string
  }
> = {
  success: {
    icon: CheckCircle2,
    wrapperClass: "bg-white text-gray-900 dark:bg-zinc-900 dark:text-zinc-100",
    iconBgClass: "bg-emerald-100 dark:bg-emerald-900/60",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    barClass: "bg-emerald-500",
    progressClass: "bg-emerald-400/40",
  },
  error: {
    icon: XCircle,
    wrapperClass: "bg-white text-gray-900 dark:bg-zinc-900 dark:text-zinc-100",
    iconBgClass: "bg-red-100 dark:bg-red-900/60",
    iconClass: "text-red-600 dark:text-red-400",
    barClass: "bg-red-500",
    progressClass: "bg-red-400/40",
  },
  warning: {
    icon: TriangleAlert,
    wrapperClass: "bg-white text-gray-900 dark:bg-zinc-900 dark:text-zinc-100",
    iconBgClass: "bg-amber-100 dark:bg-amber-900/60",
    iconClass: "text-amber-600 dark:text-amber-400",
    barClass: "bg-amber-400",
    progressClass: "bg-amber-400/40",
  },
  info: {
    icon: Info,
    wrapperClass: "bg-white text-gray-900 dark:bg-zinc-900 dark:text-zinc-100",
    iconBgClass: "bg-blue-100 dark:bg-blue-900/60",
    iconClass: "text-blue-600 dark:text-blue-400",
    barClass: "bg-blue-500",
    progressClass: "bg-blue-400/40",
  },
}

// ─── Single toast item ────────────────────────────────────────────────────────

function Toast({
  item,
  onRemove,
}: {
  item: NotificationItem
  onRemove: (id: string) => void
}) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [progress, setProgress] = useState(100)
  const removedRef = useRef(false)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const accRef = useRef(0)
  const pausedRef = useRef(false)

  const {
    icon: Icon,
    wrapperClass,
    iconBgClass,
    iconClass,
    barClass,
    progressClass,
  } = variantConfig[item.type]
  const duration = item.duration ?? 5000

  // Enter animation
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  // Progress bar + auto-dismiss with pause on hover support
  useEffect(() => {
    if (duration === 0) return

    function tick(now: number) {
      if (startRef.current === null) startRef.current = now
      const totalElapsed = accRef.current + (now - startRef.current)
      const remaining = Math.max(0, 100 - (totalElapsed / duration) * 100)
      setProgress(remaining)
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        dismiss()
      }
    }

    // start loop
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [duration])

  function dismiss() {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    setLeaving(true)
    setVisible(false)
  }

  function handleMouseEnter() {
    if (duration === 0) return
    if (pausedRef.current) return
    if (startRef.current !== null) {
      accRef.current += performance.now() - startRef.current
    }
    pausedRef.current = true
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  function handleMouseLeave() {
    if (duration === 0) return
    if (!pausedRef.current) return
    pausedRef.current = false
    startRef.current = performance.now()
    rafRef.current = requestAnimationFrame(function tick(now: number) {
      if (startRef.current === null) startRef.current = now
      const totalElapsed = accRef.current + (now - startRef.current)
      const remaining = Math.max(0, 100 - (totalElapsed / duration) * 100)
      setProgress(remaining)
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        dismiss()
      }
    })
  }

  function handleTransitionEnd() {
    if (leaving && !removedRef.current) {
      removedRef.current = true
      onRemove(item.id)
    }
  }

  return (
    <div
      onTransitionEnd={handleTransitionEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative flex w-full overflow-hidden rounded-2xl shadow-xl",
        "transition-all duration-300 ease-in-out",
        visible
          ? "translate-y-0 scale-100 opacity-100"
          : "-translate-y-4 scale-95 opacity-0",
        wrapperClass
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3 px-4 py-4">
        {/* Icon with colored background */}
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            iconBgClass
          )}
        >
          <Icon className={cn("size-5", iconClass)} />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5 pt-0.5">
          <p className="text-sm leading-tight font-bold">{item.title}</p>
          {item.message && (
            <p className="text-sm leading-snug text-muted-foreground">
              {item.message}
            </p>
          )}
        </div>

        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="mt-0.5 shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Progress bar */}
      {duration > 0 && (
        <div
          className={cn(
            "absolute right-0 bottom-0 left-0 h-0.5",
            progressClass
          )}
        >
          <div
            className={cn("h-full transition-none", "bg-white/0")}
            style={{ width: `${progress}%`, backgroundColor: undefined }}
          />
          <div
            className={cn("absolute top-0 left-0 h-full", barClass)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [items, setItems] = useState<NotificationItem[]>([])

  const notify = useCallback((opts: NotificationOptions) => {
    const id = Math.random().toString(36).slice(2)
    setItems((prev) => [...prev, { ...opts, id }])
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}

      {/* Toast portal — fixed, top-center */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed top-4 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4"
      >
        {items.map((item) => (
          <div key={item.id} className="pointer-events-auto w-full">
            <Toast item={item} onRemove={remove} />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

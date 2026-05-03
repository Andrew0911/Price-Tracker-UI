"use client"

import { useEffect, useState } from "react"
import {
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Bell,
  LayoutDashboard,
} from "lucide-react"
import { api } from "@/lib/api"
import { useErrorHandler } from "@/lib/use-error-handler"
import { useUser } from "@/lib/user-context"
import { Skeleton } from "@/components/ui/skeleton"

type Stats = {
  total_tracked: number
  price_drops: number
  price_increases: number
  active_alerts: number
}

type StatsResponse = {
  data: Stats
}

const STAT_CARDS = (stats: Stats) => [
  {
    label: "Tracked products",
    value: stats.total_tracked,
    icon: ShoppingCart,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Price drops",
    value: stats.price_drops,
    icon: TrendingDown,
    color: "text-chart-3",
    bg: "bg-chart-3/10",
  },
  {
    label: "Price increases",
    value: stats.price_increases,
    icon: TrendingUp,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  {
    label: "Active alerts",
    value: stats.active_alerts,
    icon: Bell,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
]

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const { handleError } = useErrorHandler()
  const { user } = useUser()

  useEffect(() => {
    api
      .get<never>("/dashboard/stats")
      .then((res) => {
        const r = res as unknown as StatsResponse
        setStats(r.data)
      })
      .catch(handleError)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Header */}
      <div className="relative mb-3 shrink-0 overflow-hidden px-6 pt-6 pb-5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/3 to-transparent" />
        <div className="pointer-events-none absolute -top-10 -right-10 size-48 rounded-full bg-primary/8 blur-3xl" />
        <div className="relative">
          <div className="mb-1 flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
              <LayoutDashboard className="size-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          </div>
          <p className="pl-0.5 text-sm text-muted-foreground">
            Here&apos;s a summary of your tracked products.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 px-6 pb-6 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-4 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5"
              >
                <Skeleton className="size-10 rounded-2xl" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-16" />
                </div>
              </div>
            ))
          : stats &&
            STAT_CARDS(stats).map((card, i) => (
              <div
                key={card.label}
                className="flex animate-in flex-col gap-4 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5 duration-300 fill-mode-both fade-in slide-in-from-bottom-3"
                style={{ animationDelay: `${i * 75}ms` }}
              >
                <div
                  className={`flex size-10 items-center justify-center rounded-2xl ${card.bg}`}
                >
                  <card.icon className={`size-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${card.color}`}>
                    {card.value}
                  </p>
                </div>
              </div>
            ))}
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { ShoppingCart, TrendingDown, TrendingUp, Bell } from "lucide-react"
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
    <div className="flex h-full flex-col overflow-y-auto px-6 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's a summary of your tracked products.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

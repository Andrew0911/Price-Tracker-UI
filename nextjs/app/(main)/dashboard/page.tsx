"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Bell,
  LayoutDashboard,
  Store,
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
  top_price_drops: {
    id: number
    name: string
    store: string | null
    image_url: string | null
    initial_price: number
    current_price: number
    currency: string
    drop_amount: number
    drop_percent: number
  }[]
  top_price_increases: {
    id: number
    name: string
    store: string | null
    image_url: string | null
    initial_price: number
    current_price: number
    currency: string
    increase_amount: number
    increase_percent: number
  }[]
  store_breakdown: {
    store: string
    count: number
  }[]
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
  const [movementView, setMovementView] = useState<"drops" | "increases">(
    "drops"
  )
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

  const movementRows = useMemo(() => {
    if (!stats) return []
    return movementView === "drops"
      ? stats.top_price_drops
      : stats.top_price_increases
  }, [movementView, stats])

  return (
    <div className="no-scrollbar flex h-full flex-col overflow-y-auto">
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

      <div className="grid grid-cols-1 gap-4 px-6 pb-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                {movementView === "drops"
                  ? "Top price drops"
                  : "Top price increases"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {movementView === "drops"
                  ? "Biggest savings since tracking started"
                  : "Biggest increases since tracking started"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex rounded-xl bg-muted p-1">
                <button
                  onClick={() => setMovementView("drops")}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                    movementView === "drops"
                      ? "bg-card text-chart-3 shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  Drops
                </button>
                <button
                  onClick={() => setMovementView("increases")}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                    movementView === "increases"
                      ? "bg-card text-destructive shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  Increases
                </button>
              </div>
              {movementView === "drops" ? (
                <TrendingDown className="size-5 text-chart-3" />
              ) : (
                <TrendingUp className="size-5 text-destructive" />
              )}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : movementRows.length ? (
            <div className="space-y-3">
              {movementRows.map((product) => (
                <Link
                  key={product.id}
                  href={`/wishlist/${product.id}`}
                  className="flex flex-col gap-4 rounded-2xl bg-muted/40 p-4 transition-colors hover:bg-muted/65 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="size-12 shrink-0 rounded-xl bg-white object-contain p-1"
                      />
                    ) : (
                      <div className="size-12 shrink-0 rounded-xl bg-background" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {product.name}
                      </p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {product.store ?? "unknown store"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:hidden">
                    <div className="flex min-w-0 items-center gap-2 whitespace-nowrap text-sm">
                      <span className="font-medium">
                        {product.initial_price.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span
                        className={`font-semibold ${
                          movementView === "drops"
                            ? "text-chart-3"
                            : "text-destructive"
                        }`}
                      >
                        {product.current_price.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {product.currency}
                      </span>
                    </div>

                    <div
                      className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                        movementView === "drops"
                          ? "bg-chart-3/10 text-chart-3"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {movementView === "drops" ? "-" : "+"}
                      {"drop_percent" in product
                        ? product.drop_percent.toFixed(2)
                        : product.increase_percent.toFixed(2)}
                      %
                    </div>
                  </div>

                  <div className="hidden flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:flex md:flex-nowrap">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className="text-muted-foreground">From</span>
                      <span className="font-medium">
                        {product.initial_price.toFixed(2)} {product.currency}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-muted-foreground">Now</span>
                      <span
                        className={`font-semibold ${
                          movementView === "drops"
                            ? "text-chart-3"
                            : "text-destructive"
                        }`}
                      >
                        {product.current_price.toFixed(2)} {product.currency}
                      </span>
                    </div>

                    <div
                      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold ${
                        movementView === "drops"
                          ? "bg-chart-3/10 text-chart-3"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {movementView === "drops" ? "-" : "+"}
                      {"drop_amount" in product
                        ? product.drop_amount.toFixed(2)
                        : product.increase_amount.toFixed(2)}{" "}
                      {product.currency}
                      <span className="ml-1 rounded-full bg-background/70 px-2 py-0.5 text-xs font-medium opacity-80">
                        (
                        {movementView === "drops" ? "-" : "+"}
                        {"drop_percent" in product
                          ? product.drop_percent.toFixed(2)
                          : product.increase_percent.toFixed(2)}
                        %)
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex min-h-52 items-center justify-center rounded-2xl bg-muted/30 text-sm text-muted-foreground">
              {movementView === "drops"
                ? "No price drops yet."
                : "No price increases yet."}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Store breakdown</h2>
              <p className="text-xs text-muted-foreground">
                Products tracked by retailer
              </p>
            </div>
            <Store className="size-5 text-primary" />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-2xl" />
              ))}
            </div>
          ) : stats?.store_breakdown.length ? (
            <div className="space-y-3">
              {stats.store_breakdown.map((item) => (
                <div
                  key={item.store}
                  className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3"
                >
                  <span className="text-sm font-medium capitalize">
                    {item.store}
                  </span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-52 items-center justify-center rounded-2xl bg-muted/30 text-sm text-muted-foreground">
              No tracked products yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}




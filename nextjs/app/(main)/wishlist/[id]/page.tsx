"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  ExternalLink,
  Bell,
  BellOff,
  Loader2,
  Store,
  Clock,
  Trash,
  X,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
} from "recharts"
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { useErrorHandler } from "@/lib/use-error-handler"
import { useNotification } from "@/components/notification"

type PriceHistory = {
  id: number
  price: string
  currency: string
  checked_at: string
}

type PriceAlert = {
  id: number
  target_price: string
}

type Product = {
  id: number
  name: string
  url: string
  image_url: string | null
  store: string | null
  current_price: string | null
  currency: string
  last_checked_at: string | null
  scrape_error: string | null
  price_history: PriceHistory[]
  price_alerts: PriceAlert[]
}

type ProductResponse = {
  data: Product
}

const chartConfig: ChartConfig = {
  price: {
    label: "Price",
    color: "var(--color-chart-3)",
  },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { handleError } = useErrorHandler()
  const { notify } = useNotification()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  const [alertPrice, setAlertPrice] = useState("")
  const [savingAlert, setSavingAlert] = useState(false)
  const [deletingAlert, setDeletingAlert] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  useEffect(() => {
    api
      .get<never>(`/products/${id}`)
      .then((res) => {
        const r = res as unknown as ProductResponse
        setProduct(r.data)
      })
      .catch((err) => {
        handleError(err)
        router.push("/wishlist")
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleSaveAlert() {
    if (!alertPrice || !product) return
    setSavingAlert(true)
    try {
      const res = await api.post<never>(`/products/${product.id}/alerts`, {
        target_price: parseFloat(alertPrice),
      })
      const alert = (res as unknown as { data: PriceAlert }).data
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              price_alerts: [alert],
            }
          : prev
      )
      setAlertPrice("")
      notify({ type: "success", message: "Alert saved" })
    } catch (err) {
      handleError(err)
    } finally {
      setSavingAlert(false)
    }
  }

  async function handleDeleteAlert() {
    if (!product) return
    const alert = product.price_alerts[0]
    if (!alert) return
    setDeletingAlert(true)
    try {
      await api.delete(`/products/${product.id}/alerts/${alert.id}`)
      setProduct((prev) => (prev ? { ...prev, price_alerts: [] } : prev))
      notify({ type: "success", message: "Alert removed" })
    } catch (err) {
      handleError(err)
    } finally {
      setDeletingAlert(false)
    }
  }

  async function performDeleteProduct() {
    if (!product) return
    setDeletingProduct(true)
    try {
      await api.delete(`/products/${product.id}`)
      notify({ type: "success", message: "Product deleted" })
      router.push("/wishlist")
    } catch (err) {
      handleError(err)
    } finally {
      setDeletingProduct(false)
      setDeleteModalOpen(false)
    }
  }

  const chartData =
    product?.price_history.map((h) => ({
      date: formatDate(h.checked_at),
      price: parseFloat(h.price),
    })) ?? []

  // Add current price as the last point if it differs from the last history entry
  if (product?.current_price) {
    const currentPrice = parseFloat(product.current_price)
    const last = chartData[chartData.length - 1]
    if (!last || last.price !== currentPrice) {
      chartData.push({ date: "Now", price: currentPrice })
    }
  }

  const currentDot = chartData[chartData.length - 1] ?? null

  const activeAlert = product?.price_alerts?.[0] ?? null

  if (loading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-3 px-6 py-4">
          <Skeleton className="h-8 w-20 rounded-2xl" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="min-h-0 flex-1 px-6 pb-6">
          <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-full rounded-3xl" />
            <div className="flex flex-col gap-6">
              <Skeleton className="flex-1 rounded-3xl" />
              <Skeleton className="h-48 shrink-0 rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-3 px-6 py-4">
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 hover:text-chart-3"
          onClick={() => router.push("/wishlist")}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <h1 className="line-clamp-1 text-base font-semibold">{product.name}</h1>
      </div>

      {/* Cards fill remaining space */}
      <div className="min-h-0 flex-1 px-6 pb-6">
        <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LEFT — Product details card */}
          <div className="flex animate-in flex-col overflow-y-auto rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5 duration-300 fill-mode-both fade-in slide-in-from-bottom-3">
            {/* Image */}
            <div className="relative h-80 w-full shrink-0 overflow-hidden rounded-t-3xl bg-white">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-contain p-8"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No image
                </div>
              )}
              {product.scrape_error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[3px]">
                  <span className="text-sm font-semibold tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    Product unavailable
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col justify-between gap-8 p-8">
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl leading-snug font-semibold">
                  {product.name}
                </h2>

                {product.current_price ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                      Current price
                    </span>
                    <span className="text-5xl font-bold text-chart-3">
                      {product.current_price}{" "}
                      <span className="text-2xl font-normal text-muted-foreground">
                        {product.currency}
                      </span>
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Price unavailable
                  </span>
                )}

                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
                  {product.store && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        Store
                      </span>
                      <span className="flex items-center gap-2 text-base font-medium capitalize">
                        <Store className="size-4 text-muted-foreground" />
                        {product.store}
                      </span>
                    </div>
                  )}
                  {product.last_checked_at && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        Last checked
                      </span>
                      <span className="flex items-center gap-2 text-base">
                        <Clock className="size-4 text-muted-foreground" />
                        {formatDateTime(product.last_checked_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex w-full justify-end gap-2">
                  <Link
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className=""
                  >
                    <Button
                      variant="outline"
                      className="gap-2 hover:text-chart-3"
                    >
                      <ExternalLink className="size-4" />
                      View on {product.store ?? "store"}
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    className="shrink-0 gap-2 text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteModalOpen(true)}
                    disabled={deletingProduct}
                  >
                    {deletingProduct ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash className="size-4" />
                    )}
                    <span className="text-sm">Delete</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Chart + Alerts */}
          <div
            className="flex animate-in flex-col gap-6 duration-300 fill-mode-both fade-in slide-in-from-bottom-3"
            style={{ animationDelay: "75ms" }}
          >
            {/* Price history chart — grows to fill */}
            <div className="flex min-h-0 flex-1 flex-col gap-4 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5">
              <div className="flex shrink-0 items-start justify-between">
                <div>
                  <h3 className="font-semibold">Price history</h3>
                  <p className="text-xs text-muted-foreground">
                    Last {chartData.length} data points
                  </p>
                </div>
                {chartData.length >= 1 && (
                  <div className="flex gap-2 text-xs">
                    <span className="rounded-lg bg-muted px-2.5 py-1 font-medium">
                      Min:{" "}
                      <span className="text-chart-3">
                        {Math.min(...chartData.map((d) => d.price)).toFixed(2)}
                      </span>
                    </span>
                    <span className="rounded-lg bg-muted px-2.5 py-1 font-medium">
                      Max:{" "}
                      <span className="text-destructive/80">
                        {Math.max(...chartData.map((d) => d.price)).toFixed(2)}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {chartData.length < 2 ? (
                <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                  Not enough data yet
                </div>
              ) : (
                <div className="min-h-0 flex-1">
                  <ChartContainer
                    config={chartConfig}
                    className="h-full w-full"
                  >
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="priceGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="var(--color-chart-3)"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--color-chart-3)"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        vertical={false}
                        stroke="currentColor"
                        strokeOpacity={0.06}
                      />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                        width={60}
                        domain={[
                          (min: number) => Math.floor(min * 0.97),
                          (max: number) => Math.ceil(max * 1.03),
                        ]}
                      />
                      <Tooltip content={<ChartTooltipContent />} />
                      {activeAlert && (
                        <ReferenceLine
                          y={parseFloat(activeAlert.target_price)}
                          stroke="var(--color-chart-3)"
                          strokeDasharray="5 4"
                          strokeOpacity={0.55}
                          label={{
                            value: `Alert · ${activeAlert.target_price}`,
                            fontSize: 10,
                            fill: "var(--color-chart-3)",
                            position: "insideTopRight",
                          }}
                        />
                      )}
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="var(--color-chart-3)"
                        strokeWidth={2.5}
                        fill="url(#priceGrad)"
                        dot={false}
                        activeDot={{
                          r: 5,
                          strokeWidth: 0,
                          fill: "var(--color-chart-3)",
                        }}
                      />
                      {currentDot && (
                        <ReferenceDot
                          x={currentDot.date}
                          y={currentDot.price}
                          r={5}
                          fill="var(--color-chart-3)"
                          stroke="var(--background)"
                          strokeWidth={2}
                        />
                      )}
                    </AreaChart>
                  </ChartContainer>
                </div>
              )}
            </div>

            {/* Price alert — fixed height */}
            <div className="flex shrink-0 flex-col gap-4 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5">
              <div>
                <h3 className="font-semibold">Price alert</h3>
                <p className="text-xs text-muted-foreground">
                  Get notified when the price drops below your target
                </p>
              </div>

              {activeAlert ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between rounded-2xl bg-chart-3/10 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Bell className="size-4 text-chart-3" />
                      <span className="text-sm font-medium">
                        Alert at{" "}
                        <span className="text-chart-3">
                          {activeAlert.target_price} {product.currency}
                        </span>
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:text-destructive-foreground h-7 gap-1 text-xs text-destructive hover:bg-destructive"
                      onClick={handleDeleteAlert}
                      disabled={deletingAlert}
                    >
                      {deletingAlert ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <BellOff className="size-3" />
                      )}
                      Remove
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can set a new target to overwrite the current alert.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BellOff className="size-4 opacity-50" />
                  No active alert
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={`Target price (${product.currency})`}
                  value={alertPrice}
                  onChange={(e) => setAlertPrice(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveAlert()}
                  disabled={savingAlert}
                  min={0}
                  step={0.01}
                />
                <Button
                  onClick={handleSaveAlert}
                  disabled={
                    savingAlert || !alertPrice || !!product.scrape_error
                  }
                  className="shrink-0 gap-2"
                >
                  {savingAlert ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Bell className="size-4" />
                  )}
                  {activeAlert ? "Update" : "Set alert"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex animate-in items-start justify-center bg-black/50 pt-[20vh] backdrop-blur-sm fade-in-0"
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            className="w-full max-w-md animate-in rounded-3xl bg-card p-8 shadow-xl ring-1 ring-foreground/10 zoom-in-95 slide-in-from-top-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Delete product</h2>
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deletingProduct}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this product? This action cannot
              be undone.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deletingProduct}
              >
                Cancel
              </Button>
              <Button
                onClick={performDeleteProduct}
                disabled={deletingProduct}
                className="text-destructive-foreground gap-2 bg-destructive hover:bg-destructive/90"
              >
                {deletingProduct && <Loader2 className="size-4 animate-spin" />}
                {deletingProduct ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

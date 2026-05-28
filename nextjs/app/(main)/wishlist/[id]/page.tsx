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
  Sparkles,
  TrendingDown,
  TrendingUp,
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
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { useErrorHandler } from "@/lib/use-error-handler"
import { useNotification } from "@/components/notification"
import { formatDate, formatDateTime } from "@/lib/utils"

type PriceHistory = {
  id: number
  price: string
  currency: string
  checked_at: string
}

type AlertType = "target_price" | "price_drop"

type PriceAlert = {
  id: number
  type: AlertType
  target_price: string | null
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
  is_in_wishlist: boolean
}

type ProductResponse = {
  data: Product
}

type ChartPoint = {
  checkedAt: string
  price: number
}

const chartConfig: ChartConfig = {
  price: {
    label: "Price",
    color: "var(--color-chart-3)",
  },
}

function renderFilledPriceDot({ cx, cy }: { cx?: number; cy?: number }) {
  if (cx === undefined || cy === undefined) return null

  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="var(--color-chart-3)"
      stroke="var(--color-chart-3)"
      strokeWidth={2}
    />
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
    <div className="flex min-h-0 flex-1 animate-in flex-col items-center justify-center gap-4 duration-300 fill-mode-both fade-in">
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
  const [togglingDropAlert, setTogglingDropAlert] = useState(false)
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
    if (!alertPrice || !product || !canManageWishlistProduct) return
    setSavingAlert(true)
    try {
      const res = await api.post<never>(`/products/${product.id}/alerts`, {
        type: "target_price",
        target_price: parseFloat(alertPrice),
      })
      const alert = (res as unknown as { data: PriceAlert }).data
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              price_alerts: [
                ...prev.price_alerts.filter((a) => a.type !== "target_price"),
                alert,
              ],
            }
          : prev
      )
      setAlertPrice("")
      notify({ type: "success", message: "Target price alert saved" })
    } catch (err) {
      handleError(err)
    } finally {
      setSavingAlert(false)
    }
  }

  async function handleDeleteAlert() {
    if (!product || !canManageWishlistProduct) return
    const alert = product.price_alerts.find((a) => a.type === "target_price")
    if (!alert) return
    setDeletingAlert(true)
    try {
      await api.delete(`/products/${product.id}/alerts/${alert.id}`)
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              price_alerts: prev.price_alerts.filter((a) => a.id !== alert.id),
            }
          : prev
      )
      notify({ type: "success", message: "Target price alert removed" })
    } catch (err) {
      handleError(err)
    } finally {
      setDeletingAlert(false)
    }
  }

  async function handleToggleDropAlert(checked: boolean) {
    if (!product || togglingDropAlert || !canManageWishlistProduct) return

    const dropAlert = product.price_alerts.find((a) => a.type === "price_drop")

    if (checked) {
      setTogglingDropAlert(true)
      try {
        const res = await api.post<never>(`/products/${product.id}/alerts`, {
          type: "price_drop",
        })
        const alert = (res as unknown as { data: PriceAlert }).data
        setProduct((prev) =>
          prev
            ? {
                ...prev,
                price_alerts: [
                  ...prev.price_alerts.filter((a) => a.type !== "price_drop"),
                  alert,
                ],
              }
            : prev
        )
        notify({ type: "success", message: "Price drop alerts enabled" })
      } catch (err) {
        handleError(err)
      } finally {
        setTogglingDropAlert(false)
      }

      return
    }

    if (!dropAlert) return

    setTogglingDropAlert(true)
    try {
      await api.delete(`/products/${product.id}/alerts/${dropAlert.id}`)
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              price_alerts: prev.price_alerts.filter(
                (a) => a.id !== dropAlert.id
              ),
            }
          : prev
      )
      notify({ type: "success", message: "Price drop alerts disabled" })
    } catch (err) {
      handleError(err)
    } finally {
      setTogglingDropAlert(false)
    }
  }

  async function performDeleteProduct() {
    if (!product || !canManageWishlistProduct) return
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

  const chartData: ChartPoint[] =
    product?.price_history.map((h) => ({
      checkedAt: h.checked_at,
      price: parseFloat(h.price),
    })) ?? []

  // Add current price as the last point if it differs from the last history entry
  if (product?.current_price) {
    const currentPrice = parseFloat(product.current_price)
    const last = chartData[chartData.length - 1]
    if (!last || last.price !== currentPrice) {
      chartData.push({
        checkedAt: product.last_checked_at ?? new Date().toISOString(),
        price: currentPrice,
      })
    }
  }

  const currentDot = chartData[chartData.length - 1] ?? null

  const targetAlert =
    product?.price_alerts?.find((alert) => alert.type === "target_price") ??
    null
  const dropAlert =
    product?.price_alerts?.find((alert) => alert.type === "price_drop") ?? null
  const canManageWishlistProduct = product?.is_in_wishlist === true

  const firstHistoryPrice =
    product?.price_history && product.price_history.length > 0
      ? parseFloat(product.price_history[0].price)
      : null
  const currentPriceFloat = product?.current_price
    ? parseFloat(product.current_price)
    : null
  const priceChange =
    firstHistoryPrice !== null && currentPriceFloat !== null
      ? currentPriceFloat - firstHistoryPrice
      : null
  const priceChangePercent =
    priceChange !== null &&
    firstHistoryPrice !== null &&
    firstHistoryPrice !== 0
      ? (priceChange / firstHistoryPrice) * 100
      : null

  if (loading) {
    return (
      <div className="flex min-h-full flex-col">
        <div className="flex shrink-0 items-center gap-3 px-6 py-4">
          <Skeleton className="h-8 w-20 rounded-2xl" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="min-h-0 flex-1 px-6 pb-10">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
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
    <div className="flex min-h-full flex-col">
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
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LEFT — Product details card */}
          <div className="flex animate-in flex-col overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5 duration-300 fill-mode-both fade-in slide-in-from-bottom-3">
            {/* Image */}
            <div className="relative h-72 w-full shrink-0 overflow-hidden bg-white">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  unoptimized
                  referrerPolicy="no-referrer"
                  className="object-contain p-6 transition-transform duration-500 hover:scale-[1.03]"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No image
                </div>
              )}
              {/* Store badge */}
              {product.store && (
                <div className="absolute top-3 left-3">
                  <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-semibold capitalize shadow-sm ring-1 ring-foreground/10 backdrop-blur-sm">
                    {product.store}
                  </span>
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
            <div className="flex flex-1 flex-col gap-5 p-6">
              {/* Name */}
              <h2 className="text-lg leading-snug font-semibold">
                {product.name}
              </h2>

              {/* Price block */}
              {product.current_price ? (
                <div className="rounded-2xl bg-chart-3/10 p-4 ring-1 ring-chart-3/20">
                  <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    Current price
                  </span>
                  <div className="mt-1 flex items-end gap-2">
                    <span className="text-4xl font-bold text-chart-3">
                      {product.current_price}
                    </span>
                    <span className="mb-1 text-lg font-medium text-muted-foreground">
                      {product.currency}
                    </span>
                  </div>
                  {priceChange !== null &&
                    priceChange !== 0 &&
                    priceChangePercent !== null && (
                      <div
                        className={
                          priceChange < 0
                            ? "mt-2 inline-flex items-center gap-1 rounded-full bg-chart-3/15 px-2.5 py-0.5 text-xs font-semibold text-chart-3"
                            : "mt-2 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive"
                        }
                      >
                        {priceChange < 0 ? (
                          <TrendingDown className="size-3" />
                        ) : (
                          <TrendingUp className="size-3" />
                        )}
                        {priceChange < 0 ? "−" : "+"}
                        {Math.abs(priceChange).toFixed(2)} {product.currency} (
                        {priceChange < 0 ? "−" : "+"}
                        {Math.abs(priceChangePercent).toFixed(1)}%) since
                        tracking
                      </div>
                    )}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Price unavailable
                </span>
              )}

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-3">
                {product.store && (
                  <div className="flex flex-col gap-1 rounded-2xl bg-muted/50 p-3">
                    <span className="text-xs text-muted-foreground">Store</span>
                    <span className="flex items-center gap-1.5 text-sm font-medium capitalize">
                      <Store className="size-3.5 shrink-0 text-muted-foreground" />
                      {product.store}
                    </span>
                  </div>
                )}
                {product.last_checked_at && (
                  <div className="flex flex-col gap-1 rounded-2xl bg-muted/50 p-3">
                    <span className="text-xs text-muted-foreground">
                      Last checked
                    </span>
                    <span className="flex items-center gap-1.5 text-sm">
                      <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                      {formatDateTime(product.last_checked_at)}
                    </span>
                  </div>
                )}
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Link
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button className="w-full gap-2">
                    <ExternalLink className="size-4" />
                    View on {product.store ?? "store"}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full gap-2 text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteModalOpen(true)}
                  disabled={deletingProduct || !canManageWishlistProduct}
                >
                  {deletingProduct ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash className="size-4" />
                  )}
                  Remove from wishlist
                </Button>
              </div>
            </div>
          </div>

          {/* RIGHT — Chart + Alerts */}
          <div
            className="flex animate-in flex-col gap-6 duration-300 fill-mode-both fade-in slide-in-from-bottom-3"
            style={{ animationDelay: "75ms" }}
          >
            {/* Price history chart — grows to fill */}
            <div className="flex h-[360px] flex-col gap-4 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5">
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
                <EmptyState
                  icon={Sparkles}
                  title="Not enough data yet"
                  description="We need more price checks to show the chart. The app will collect prices automatically over time."
                />
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
                        dataKey="checkedAt"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                        interval="preserveStartEnd"
                        tickFormatter={formatDate}
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
                      <Tooltip
                        labelFormatter={(value) =>
                          formatDateTime(String(value))
                        }
                        content={<ChartTooltipContent />}
                      />
                      {targetAlert?.target_price && (
                        <ReferenceLine
                          y={parseFloat(targetAlert.target_price)}
                          stroke="var(--color-chart-3)"
                          strokeDasharray="5 4"
                          strokeOpacity={0.55}
                          label={{
                            value: `Alert - ${targetAlert.target_price}`,
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
                        dot={renderFilledPriceDot}
                        activeDot={{
                          r: 5,
                          strokeWidth: 0,
                          fill: "var(--color-chart-3)",
                        }}
                      />
                      {currentDot && (
                        <ReferenceDot
                          x={currentDot.checkedAt}
                          y={currentDot.price}
                          r={5}
                          fill="var(--color-chart-3)"
                          stroke="var(--color-chart-3)"
                          strokeWidth={2}
                        />
                      )}
                    </AreaChart>
                  </ChartContainer>
                </div>
              )}
            </div>

            {/* Price alerts */}
            <div className="flex shrink-0 flex-col gap-5 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5">
              <div>
                <h3 className="font-semibold">Price alerts</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Set a target price or get notified whenever the tracked price
                  drops.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-4 rounded-2xl bg-muted/40 p-4 transition-colors hover:bg-muted/65">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-chart-3/10">
                        <Bell className="size-5 text-chart-3" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          Target price
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Notify me when this product reaches my chosen price.
                        </p>
                      </div>
                    </div>

                    {targetAlert ? (
                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        <div className="rounded-full bg-chart-3/10 px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-chart-3">
                          {targetAlert.target_price} {product.currency}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:text-destructive-foreground h-8 shrink-0 gap-1.5 px-2.5 text-xs font-semibold text-destructive hover:bg-destructive"
                          onClick={handleDeleteAlert}
                          disabled={deletingAlert || !canManageWishlistProduct}
                        >
                          {deletingAlert ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <BellOff className="size-3" />
                          )}
                          Remove
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2 md:flex-row md:pl-15">
                    <Input
                      type="number"
                      placeholder={`Target price (${product.currency})`}
                      value={alertPrice}
                      onChange={(e) => setAlertPrice(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveAlert()}
                      disabled={
                        savingAlert ||
                        !!product.scrape_error ||
                        !canManageWishlistProduct
                      }
                      min={0}
                      step={0.01}
                      className="bg-card"
                    />
                    <Button
                      onClick={handleSaveAlert}
                      disabled={
                        savingAlert ||
                        !alertPrice ||
                        !!product.scrape_error ||
                        !canManageWishlistProduct
                      }
                      className="shrink-0 gap-2"
                    >
                      {savingAlert ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Bell className="size-4" />
                      )}
                      {targetAlert ? "Update" : "Set alert"}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted/40 p-4 transition-colors hover:bg-muted/65">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-chart-3/10">
                      <TrendingDown className="size-5 text-chart-3" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        Any price drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Notify me whenever this product gets cheaper.
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center">
                    <Switch
                      checked={!!dropAlert}
                      onCheckedChange={handleToggleDropAlert}
                      disabled={
                        !!product.scrape_error ||
                        togglingDropAlert ||
                        !canManageWishlistProduct
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {canManageWishlistProduct && deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex animate-in items-start justify-center bg-black/50 px-4 pt-[20vh] backdrop-blur-sm fade-in-0 sm:px-0"
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            className="w-full max-w-md animate-in rounded-3xl bg-card p-8 shadow-xl ring-1 ring-foreground/10 zoom-in-95 slide-in-from-top-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Remove product</h2>
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deletingProduct}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Are you sure you want to remove this product from your wishlist ?
              You will be able to add it again at need.
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
                {deletingProduct ? "Removing..." : "Remove"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

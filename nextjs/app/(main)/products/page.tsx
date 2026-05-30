"use client"

import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Loader2,
  PackageSearch,
  Search,
  SlidersHorizontal,
  Trash2,
  Users,
  X,
} from "lucide-react"
import { api } from "@/lib/api"
import { Store } from "@/lib/enums"
import { ProductFilterModal } from "@/components/product-filter-modal"
import { useNotification } from "@/components/notification"
import { useUser } from "@/lib/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTime } from "@/lib/utils"

type AdminProduct = {
  id: number
  name: string
  url: string
  image_url: string | null
  store: string | null
  current_price: string | null
  currency: string
  last_checked_at: string | null
  scrape_error: string | null
  created_at: string
  users_count: number
  price_alerts_count: number
}

type ProductsResponse = {
  data: AdminProduct[]
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
        <PackageSearch className="size-9 text-primary" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold">{title}</p>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export default function AdminProductsPage() {
  const router = useRouter()
  const { user } = useUser()
  const { notify } = useNotification()
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [perPage, setPerPage] = useState(12)
  const [total, setTotal] = useState(0)
  const [filterOpen, setFilterOpen] = useState(false)
  const [storeDraft, setStoreDraft] = useState<Store | "">("")
  const [statusDraft, setStatusDraft] = useState<1 | 0 | null>(null)
  const [addedAfterDraft, setAddedAfterDraft] = useState<Date | undefined>(
    undefined
  )
  const [activeStore, setActiveStore] = useState<Store | "">("")
  const [activeStatus, setActiveStatus] = useState<1 | 0 | null>(null)
  const [activeAddedAfter, setActiveAddedAfter] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null)
  const [deleting, setDeleting] = useState(false)

  const activeFiltersCount =
    (activeStore ? 1 : 0) +
    (activeStatus !== null ? 1 : 0) +
    (activeAddedAfter ? 1 : 0)

  const loadProducts = useCallback(
    async (
      search = query.trim(),
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
        if (activeStore) params.set("store", activeStore)
        if (activeStatus !== null) params.set("status", String(activeStatus))
        if (activeAddedAfter) params.set("added_after", activeAddedAfter)

        const res = await api.get<never>(`/admin/products?${params.toString()}`)
        const payload = res as unknown as ProductsResponse

        setProducts(payload.data ?? [])
        setPage(payload.page ?? targetPage)
        setLastPage(payload.lastPage ?? 1)
        setPerPage(payload.perPage ?? targetPerPage)
        setTotal(payload.total ?? 0)
      } catch (err) {
        notify({
          type: "error",
          message: errorMessage(err, "Could not load products."),
        })
      } finally {
        setLoading(false)
      }
    },
    [activeAddedAfter, activeStatus, activeStore, notify, page, perPage, query]
  )

  useEffect(() => {
    const timer = setTimeout(
      () => loadProducts(query.trim(), page, perPage),
      250
    )
    return () => clearTimeout(timer)
  }, [loadProducts, page, perPage, query])

  function openFilter() {
    setStoreDraft(activeStore)
    setStatusDraft(activeStatus)
    setAddedAfterDraft(
      activeAddedAfter ? new Date(activeAddedAfter) : undefined
    )
    setFilterOpen(true)
  }

  function applyFilter() {
    setActiveStore(storeDraft)
    setActiveStatus(statusDraft)
    setActiveAddedAfter(
      addedAfterDraft ? addedAfterDraft.toISOString().split("T")[0] : ""
    )
    setPage(1)
    setFilterOpen(false)
  }

  function clearFilter() {
    setStoreDraft("")
    setStatusDraft(null)
    setAddedAfterDraft(undefined)
    setActiveStore("")
    setActiveStatus(null)
    setActiveAddedAfter("")
    setPage(1)
    setFilterOpen(false)
  }

  async function hardDeleteProduct() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/admin/products/${deleteTarget.id}`)
      notify({ type: "success", message: "Product permanently deleted" })
      setDeleteTarget(null)
      const nextPage = products.length === 1 && page > 1 ? page - 1 : page
      setPage(nextPage)
      await loadProducts(query.trim(), nextPage, perPage)
    } catch (err) {
      notify({
        type: "error",
        message: errorMessage(err, "Could not delete product."),
      })
    } finally {
      setDeleting(false)
    }
  }

  if (user && !user.is_admin) {
    return null
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="relative shrink-0 overflow-hidden px-4 pt-4 pb-4 md:px-6 md:pt-6 md:pb-5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/3 to-transparent" />
        <div className="pointer-events-none absolute -top-10 -right-10 size-48 rounded-full bg-primary/8 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25 md:size-9">
                <PackageSearch className="size-4 text-primary md:size-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Products
              </h1>
            </div>
            <p className="pl-0.5 text-sm text-muted-foreground">
              Operate on every tracked product across the app.
            </p>
          </div>

          {!loading && (
            <div className="flex gap-2 text-sm">
              <span className="rounded-full bg-primary/10 px-3 py-1.5 font-semibold text-primary">
                {total} tracked products
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-3 px-4 pb-4 md:px-6 md:pb-5 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            placeholder="Search products by name or URL..."
            className="h-12 rounded-2xl bg-muted/50 pl-11 text-base md:text-sm"
          />
        </div>
        <Button
          variant="outline"
          onClick={openFilter}
          className={`h-12 gap-2 rounded-2xl ${
            activeFiltersCount > 0 ? "border-primary text-primary" : ""
          }`}
        >
          <SlidersHorizontal className="size-4" />
          Filter
          {activeFiltersCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 pb-6 md:pr-8 md:[&::-webkit-scrollbar]:w-1.5 md:[&::-webkit-scrollbar-thumb]:rounded-full md:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 md:hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50 md:[&::-webkit-scrollbar-track]:rounded-full md:[&::-webkit-scrollbar-track]:bg-transparent">
        {loading ? (
          Array.from({ length: perPage }).map((_, i) => (
            <div
              key={i}
              className="grid gap-4 rounded-2xl border border-border bg-muted/35 p-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(230px,0.5fr)_minmax(260px,0.65fr)_auto] xl:items-center dark:border-white/5 dark:bg-muted/55"
            >
              <div className="flex min-w-0 gap-4">
                <Skeleton className="size-24 shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1 pt-1">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <Skeleton className="mt-2 h-6 w-28 rounded-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-border bg-card/80 p-3 dark:border-white/5 dark:bg-muted/60">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="mt-2 h-5 w-24" />
                </div>
                <div className="rounded-2xl border border-border bg-card/80 p-3 dark:border-white/5 dark:bg-muted/60">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="mt-2 h-5 w-12" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-2">
                {Array.from({ length: 4 }).map((__, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-border bg-card/80 p-3 dark:border-white/5 dark:bg-muted/60"
                  >
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="mt-2 h-4 w-20" />
                  </div>
                ))}
              </div>

              <div className="flex items-start justify-end gap-2 xl:flex-col xl:items-stretch">
                <div className="ml-auto flex shrink-0 flex-row gap-2 xl:ml-0 xl:flex-col xl:items-stretch">
                  <Skeleton className="h-9 w-20 rounded-xl" />
                  <Skeleton className="h-9 w-20 rounded-xl" />
                </div>
              </div>
            </div>
          ))
        ) : products.length === 0 ? (
          <EmptyState
            title={query.trim() ? "No matches" : "No products found"}
            description={
              query.trim()
                ? `No products matching "${query.trim()}"`
                : "Tracked products will appear here once they are added."
            }
          />
        ) : (
          products.map((product, i) => (
            <div
              key={product.id}
              role="button"
              tabIndex={0}
              className="grid animate-in cursor-pointer gap-4 rounded-2xl border border-border bg-muted/35 p-4 duration-300 fill-mode-both fade-in slide-in-from-bottom-3 hover:bg-muted/55 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none xl:grid-cols-[minmax(0,1.5fr)_minmax(230px,0.5fr)_minmax(260px,0.65fr)_auto] xl:items-center dark:border-white/5 dark:bg-muted/55 dark:hover:bg-muted/70"
              onClick={() => router.push(`/wishlist/${product.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  router.push(`/wishlist/${product.id}`)
                }
              }}
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <div className="flex min-w-0 gap-4">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    width={96}
                    height={96}
                    unoptimized
                    className="size-24 shrink-0 rounded-2xl bg-white object-contain p-2 shadow-sm ring-1 ring-black/5"
                  />
                ) : (
                  <div className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-background text-xs text-muted-foreground ring-1 ring-border">
                    No image
                  </div>
                )}
                <div className="min-w-0 pt-1">
                  <p className="line-clamp-2 text-sm leading-snug font-semibold">
                    {product.name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs break-all text-muted-foreground">
                    {product.url}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-border bg-card/80 px-2.5 py-1 font-medium capitalize dark:border-white/5 dark:bg-muted/60">
                      {product.store ?? "unknown store"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-border bg-card/80 p-3 dark:border-white/5 dark:bg-muted/60">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Current price
                  </p>
                  <p
                    className={`mt-1 text-base font-bold ${
                      product.current_price
                        ? "text-chart-3"
                        : "text-muted-foreground"
                    }`}
                  >
                    {product.current_price
                      ? `${product.current_price} ${product.currency}`
                      : "Unavailable"}
                  </p>
                </div>
                <div
                  className={`rounded-2xl border p-3 ${
                    product.scrape_error
                      ? "border-destructive/20 bg-destructive/10 dark:bg-destructive/15"
                      : "border-border bg-card/80 dark:border-white/5 dark:bg-muted/60"
                  }`}
                >
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Status
                  </p>
                  {product.scrape_error ? (
                    <div className="mt-1 text-destructive">
                      <p className="inline-flex items-center gap-1.5 text-sm font-bold">
                        <AlertTriangle className="size-3.5" />
                        Error
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-4">
                        {product.scrape_error}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm font-bold text-chart-3">OK</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-chart-3/20 bg-chart-3/10 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-chart-3/80">
                    <Users className="size-3" />
                    Tracking
                  </p>
                  <p className="mt-1 text-sm font-semibold text-chart-3">
                    {product.users_count} user
                    {product.users_count === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-yellow-600 dark:text-yellow-400">
                    <Bell className="size-3" />
                    Alerts
                  </p>
                  <p className="mt-1 text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                    {product.price_alerts_count}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card/80 p-3 dark:border-white/5 dark:bg-muted/60">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <Clock3 className="size-3" />
                    Checked
                  </p>
                  <p className="mt-1 text-xs leading-4 font-medium">
                    {product.last_checked_at
                      ? formatDateTime(product.last_checked_at)
                      : "Never"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card/80 p-3 dark:border-white/5 dark:bg-muted/60">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <CalendarDays className="size-3" />
                    Added
                  </p>
                  <p className="mt-1 text-xs leading-4 font-medium">
                    {formatDateTime(product.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-start justify-end gap-2 xl:flex-col xl:items-stretch">
                <div className="ml-auto flex shrink-0 flex-row gap-2 xl:ml-0 xl:flex-col xl:items-stretch">
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-card/80 px-3 text-xs font-semibold transition-colors hover:bg-muted/60 hover:text-chart-3 dark:border-white/5 dark:bg-muted/60 dark:hover:bg-muted/80"
                  >
                    <ExternalLink className="size-3" />
                    Open
                  </a>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-9 gap-1.5 rounded-xl px-3 text-xs font-semibold"
                    onClick={(event) => {
                      event.stopPropagation()
                      setDeleteTarget(product)
                    }}
                  >
                    <Trash2 className="size-3" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && total > 0 && (
        <div className="shrink-0 border-t border-border px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground md:text-sm">
              <span>Per page:</span>
              <div className="flex gap-1">
                {PER_PAGE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setPerPage(option)
                      setPage(1)
                    }}
                    className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-colors md:px-2.5 md:text-xs ${
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
                  className="h-9 w-9 shrink-0 p-0 md:h-8 md:w-8"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="size-4" />
                </Button>

                <div className="flex h-9 min-w-9 items-center justify-center rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground md:h-8 md:min-w-8 md:text-xs">
                  {page}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0 p-0 md:h-8 md:w-8"
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

      <ProductFilterModal
        addedAfterDraft={addedAfterDraft}
        onAddedAfterDraftChange={setAddedAfterDraft}
        onApply={applyFilter}
        onClear={clearFilter}
        onClose={() => setFilterOpen(false)}
        open={filterOpen}
        statusDraft={statusDraft}
        onStatusDraftChange={setStatusDraft}
        storeDraft={storeDraft}
        onStoreDraftChange={setStoreDraft}
      />

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex animate-in items-start justify-center bg-black/50 px-4 pt-[20vh] backdrop-blur-sm fade-in-0 sm:px-0"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-md animate-in rounded-3xl bg-card p-8 shadow-xl ring-1 ring-foreground/10 zoom-in-95 slide-in-from-top-2"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Delete product forever</h2>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              This will permanently delete the product, its price history,
              alerts, and remove it from every user&apos;s wishlist.
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
                onClick={hardDeleteProduct}
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
    </div>
  )
}

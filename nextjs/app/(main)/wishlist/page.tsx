"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShoppingCart,
  Plus,
  X,
  Loader2,
  ArrowRight,
  SlidersHorizontal,
  CalendarIcon,
  Bell,
  Heart,
  Search,
} from "lucide-react"
import { api } from "@/lib/api"
import { Store, STORES } from "@/lib/enums"
import { useErrorHandler } from "@/lib/use-error-handler"
import { useNotification } from "@/components/notification"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"

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
  price_alerts: { id: number }[]
}

type ProductsResponse = {
  message: string
  data: Product[]
  page: number
  lastPage: number
  perPage: number
  total: number
}

const PER_PAGE_OPTIONS = [6, 12, 24, 48]

export default function Wishlist() {
  const [products, setProducts] = useState<Product[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [perPage, setPerPage] = useState(12)
  const [loading, setLoading] = useState(true)
  const { handleError } = useErrorHandler()
  const { notify } = useNotification()
  const isMobile = useIsMobile()

  const [modalOpen, setModalOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [adding, setAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [filterOpen, setFilterOpen] = useState(false)
  const [addedAfterDraft, setAddedAfterDraft] = useState<Date | undefined>(
    undefined
  )
  const [storeDraft, setStoreDraft] = useState<Store | "">("")
  const [statusDraft, setStatusDraft] = useState<1 | 0 | null>(null)
  const [storePopoverOpen, setStorePopoverOpen] = useState(false)
  const [storeSearch, setStoreSearch] = useState("")
  const storeSearchRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const [activeAddedAfter, setActiveAddedAfter] = useState("")
  const [activeStore, setActiveStore] = useState<Store | "">("")
  const [activeStatus, setActiveStatus] = useState<1 | 0 | null>(null)

  function openFilter() {
    setAddedAfterDraft(
      activeAddedAfter ? new Date(activeAddedAfter) : undefined
    )
    setStoreDraft(activeStore)
    setStatusDraft(activeStatus)
    setFilterOpen(true)
  }

  function closeFilter() {
    setFilterOpen(false)
    setStorePopoverOpen(false)
    setStoreSearch("")
  }

  function applyFilter() {
    setActiveAddedAfter(
      addedAfterDraft ? addedAfterDraft.toISOString().split("T")[0] : ""
    )
    setActiveStore(storeDraft)
    setActiveStatus(statusDraft)
    setPage(1)
    setFilterOpen(false)
  }

  function clearFilter() {
    setAddedAfterDraft(undefined)
    setStoreDraft("")
    setStatusDraft(null)
    setActiveAddedAfter("")
    setActiveStore("")
    setActiveStatus(null)
    setPage(1)
    setFilterOpen(false)
  }

  function openStorePopover() {
    setStorePopoverOpen(true)
    setStoreSearch("")
  }

  function closeStorePopover() {
    setStorePopoverOpen(false)
    setStoreSearch("")
  }

  const storeOptions = (
    [
      ["", "All stores"],
      ...STORES.map((store) => [
        store,
        store.charAt(0).toUpperCase() + store.slice(1),
      ]),
    ] as [Store | "", string][]
  ).filter(([value, label]) => {
    const query = storeSearch.trim().toLowerCase()
    if (!query) return true

    return (
      label.toLowerCase().includes(query) ||
      String(value).toLowerCase().includes(query)
    )
  })

  const activeFiltersCount =
    (activeAddedAfter ? 1 : 0) +
    (activeStore ? 1 : 0) +
    (activeStatus !== null ? 1 : 0)

  function openModal() {
    setUrl("")
    setModalOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function closeModal() {
    if (adding) return
    setModalOpen(false)
  }

  async function handleAdd() {
    if (!url.trim()) return
    setAdding(true)
    try {
      await api.post("/products", { url: url.trim() })
      notify({ type: "success", message: "Product added to wishlist" })
      setModalOpen(false)
      setPage(1)
      // re-trigger fetch
      setLoading(true)
      api
        .get<never>(
          `/products?page=1&perPage=${perPage}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ""}${activeAddedAfter ? `&added_after=${activeAddedAfter}` : ""}${activeStore ? `&store=${activeStore}` : ""}${activeStatus !== null ? `&status=${activeStatus}` : ""}`
        )
        .then((res) => {
          const r = res as unknown as ProductsResponse
          setProducts(r.data ?? [])
          setLastPage(r.lastPage ?? 1)
          setTotal(r.total ?? 0)
        })
        .catch(handleError)
        .finally(() => setLoading(false))
    } catch (err) {
      handleError(err)
    } finally {
      setAdding(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    api
      .get<never>(
        `/products?page=${page}&perPage=${perPage}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ""}${activeAddedAfter ? `&added_after=${activeAddedAfter}` : ""}${activeStore ? `&store=${activeStore}` : ""}${activeStatus !== null ? `&status=${activeStatus}` : ""}`
      )
      .then((res) => {
        const r = res as unknown as ProductsResponse
        setProducts(r.data ?? [])
        setLastPage(r.lastPage ?? 1)
        setTotal(r.total ?? 0)
      })
      .catch(handleError)
      .finally(() => setLoading(false))
  }, [
    page,
    perPage,
    activeAddedAfter,
    activeStore,
    activeStatus,
    debouncedSearch,
  ])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      return
    }
    const t = setTimeout(() => {
      api
        .get<never>(
          `/products?page=1&perPage=5&search=${encodeURIComponent(searchQuery.trim())}`
        )
        .then((res) => {
          const r = res as unknown as ProductsResponse
          setSuggestions(r.data ?? [])
        })
        .catch(() => {})
    }, 250)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handlePerPageChange(value: number) {
    setPerPage(value)
    setPage(1)
  }

  const pageNumbers = Array.from({ length: lastPage }, (_, i) => i + 1)
  const visiblePages =
    lastPage <= 7
      ? pageNumbers
      : [
          1,
          ...(page > 3 ? ["…"] : []),
          ...pageNumbers.slice(
            Math.max(1, page - 2),
            Math.min(lastPage - 1, page + 1)
          ),
          ...(page < lastPage - 2 ? ["…"] : []),
          lastPage,
        ]

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="relative shrink-0 px-4 pt-4 pb-4 md:px-6 md:pt-6 md:pb-5">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/3 to-transparent" />
          <div className="absolute -top-10 -right-10 size-48 rounded-full bg-primary/8 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-3 md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:gap-4">
          <div className="shrink-0">
            <div className="mb-1 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25 md:size-9">
                <Heart className="size-4 text-primary md:size-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Wishlist
              </h1>
            </div>
            {!loading && (
              <p className="pl-0.5 text-sm text-muted-foreground">
                {total} {total === 1 ? "product" : "products"}
              </p>
            )}
          </div>

          {/* Search */}
          <div className="flex w-full justify-center md:w-auto">
            <div className="relative w-full md:w-200" ref={searchRef}>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  placeholder="Search products..."
                  className="pr-9 pl-9 text-base md:text-sm"
                  onFocus={() => setSearchFocused(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setSearchFocused(false)
                    if (e.key === "Enter") {
                      setDebouncedSearch(searchQuery.trim())
                      setPage(1)
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("")
                      setDebouncedSearch("")
                      setPage(1)
                      setSearchFocused(false)
                    }}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
              {searchFocused && searchQuery && suggestions.length > 0 && (
                <div className="absolute right-0 left-0 z-50 mt-1.5 overflow-hidden rounded-2xl bg-popover shadow-lg ring-1 ring-foreground/5">
                  <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    Products
                  </p>
                  {suggestions.slice(0, 5).map((product, i) => (
                    <Link
                      key={product.id}
                      href={`/wishlist/${product.id}`}
                      onClick={() => setSearchFocused(false)}
                      className="flex animate-in items-center gap-3 px-3 py-2.5 transition-colors duration-200 fill-mode-both fade-in slide-in-from-top-1 hover:bg-accent hover:text-chart-3"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="size-9 shrink-0 rounded-lg object-contain"
                        />
                      ) : (
                        <div className="size-9 shrink-0 rounded-lg bg-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.store ?? "—"}
                          {product.current_price
                            ? ` · ${product.current_price} ${product.currency}`
                            : ""}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex w-full shrink-0 items-center gap-2 md:w-auto">
            <Button
              variant="outline"
              onClick={openFilter}
              size="sm"
              className={`flex-1 gap-1 text-xs md:flex-none md:gap-2 md:text-sm${activeFiltersCount > 0 ? "border-primary text-primary" : ""}`}
            >
              <SlidersHorizontal className="size-3 md:size-4" />
              <span className="hidden sm:inline">Filter</span>
              <span className="sm:hidden">Filter</span>
              {activeFiltersCount > 0 && (
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            <Button
              onClick={openModal}
              size="sm"
              className="flex-1 gap-1 bg-primary text-xs hover:bg-primary/80 md:flex-none md:gap-2 md:text-sm"
            >
              <Plus className="size-3 md:size-4" />
              <span className="hidden sm:inline">Add product</span>
              <span className="sm:hidden">Add product</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 md:mr-3 md:px-6 md:pr-8">
        {loading ? (
          <div className="mx-auto grid w-full max-w-sm grid-cols-1 gap-3 sm:max-w-none sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: perPage > 12 ? 12 : perPage }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5"
              >
                <Skeleton className="h-52 w-full rounded-none" />
                <div className="flex flex-col gap-2.5 p-4">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-2/3" />
                  <div className="mt-2 flex items-center justify-between">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-8 w-16 rounded-2xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-32 text-muted-foreground">
            <ShoppingCart className="size-12 opacity-30" />
            <p className="text-base">Your wishlist is empty.</p>
          </div>
        ) : (
          <div className="mx-auto grid w-full max-w-sm grid-cols-1 gap-3 sm:max-w-none sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, i) => (
              <Link
                key={product.id}
                href={`/wishlist/${product.id}`}
                className="group relative flex animate-in flex-col overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5 transition-shadow duration-300 fill-mode-both fade-in slide-in-from-bottom-3 hover:shadow-md"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Image */}
                <div className="relative h-52 w-full shrink-0 overflow-hidden bg-white">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      unoptimized
                      referrerPolicy="no-referrer"
                      className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      No image
                    </div>
                  )}
                  {product.store && (
                    <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white uppercase backdrop-blur-sm">
                      {product.store}
                    </span>
                  )}
                  {product.price_alerts?.length > 0 && (
                    <span className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow backdrop-blur-sm">
                      <Bell className="size-3.5" />
                    </span>
                  )}
                  {product.scrape_error && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-[3px]">
                      <span className="text-sm font-semibold tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                        Product unavailable
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <p className="line-clamp-2 text-sm leading-snug font-medium">
                    {product.name}
                  </p>

                  <div className="mt-auto flex items-center justify-between">
                    <div>
                      {product.current_price ? (
                        <span className="text-base font-semibold text-chart-3">
                          {product.current_price}{" "}
                          <span className="text-sm font-normal text-muted-foreground">
                            {product.currency}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Price unavailable
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs hover:text-chart-3"
                    >
                      <ArrowRight className="size-3" />
                      View
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="shrink-0 border-t border-border px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-3 md:hidden">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Per page:</span>
              <div className="flex gap-1">
                {PER_PAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handlePerPageChange(opt)}
                    className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
                      perPage === opt
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {lastPage > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 shrink-0 p-0"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="size-4" />
                </Button>

                <div className="flex h-9 min-w-9 items-center justify-center rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground">
                  {page}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 shrink-0 p-0"
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={page === lastPage}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="hidden items-center justify-between gap-4 md:flex">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Products per page:</span>
              <div className="flex gap-1">
              {PER_PAGE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handlePerPageChange(opt)}
                  className={`rounded-lg px-1.5 py-0.5 text-[10px] font-medium transition-colors md:px-2.5 md:py-1 md:text-xs ${
                    perPage === opt
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            </div>

            {lastPage > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="size-4" />
                </Button>

                <div className="flex h-8 min-w-8 items-center justify-center rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground">
                  {page}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={page === lastPage}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {filterOpen && (
        <div
          className="fixed inset-0 z-50 flex animate-in items-start justify-center bg-black/50 px-4 pt-[20vh] backdrop-blur-sm sm:px-0 fade-in-0"
          onClick={closeFilter}
        >
          <div
            className="w-full max-w-sm animate-in rounded-3xl bg-card p-8 shadow-xl ring-1 ring-foreground/10 zoom-in-95 slide-in-from-top-2 md:max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filter products</h2>
              <button
                onClick={closeFilter}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Store</label>
                  {storeDraft && (
                    <button
                      onClick={() => setStoreDraft("")}
                      className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/70"
                    >
                      <X className="size-3" />
                      Clear
                    </button>
                  )}
                </div>
                <Popover
                  open={storePopoverOpen}
                  onOpenChange={(open) => {
                    if (open) {
                      openStorePopover()
                    } else {
                      closeStorePopover()
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <button type="button" className="relative w-full text-left">
                      <Input
                        value={
                          storeDraft
                            ? storeDraft.charAt(0).toUpperCase() +
                              storeDraft.slice(1)
                            : ""
                        }
                        placeholder="All stores"
                        readOnly
                        tabIndex={-1}
                        className="pointer-events-none cursor-pointer pr-8 text-base md:text-sm"
                      />
                      <ChevronDown
                        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] gap-2 p-2"
                    align="start"
                    onOpenAutoFocus={(event) => {
                      event.preventDefault()
                      if (isMobile) return
                      storeSearchRef.current?.focus()
                    }}
                  >
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        ref={storeSearchRef}
                        value={storeSearch}
                        onChange={(e) => setStoreSearch(e.target.value)}
                        placeholder="Search stores..."
                        className="h-9 pl-9 text-base md:text-sm"
                      />
                    </div>
                    <div className="max-h-[172px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                      {storeOptions.length > 0 ? (
                        storeOptions.map(([value, label]) => (
                          <button
                            key={value || "_all"}
                            onClick={() => {
                              setStoreDraft(value)
                              closeStorePopover()
                            }}
                            className={`flex w-full items-center rounded-2xl px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground ${storeDraft === value ? "text-chart-3" : ""}`}
                          >
                            {label}
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                          No stores found
                        </p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Status</label>
                <div className="flex gap-2">
                  {([null, 1, 0] as const).map((val) => (
                    <button
                      key={val ?? "_all"}
                      onClick={() => setStatusDraft(val)}
                      className={`flex-1 rounded-2xl px-3 py-2 text-sm font-medium transition-colors ${
                        statusDraft === val
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {val === null
                        ? "All"
                        : val === 1
                          ? "Available"
                          : "Unavailable"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Added after</label>{" "}
                  {addedAfterDraft && (
                    <button
                      onClick={() => setAddedAfterDraft(undefined)}
                      className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/70"
                    >
                      <X className="size-3" />
                      Clear
                    </button>
                  )}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 font-normal"
                    >
                      <CalendarIcon className="size-4 text-muted-foreground" />
                      {addedAfterDraft ? (
                        addedAfterDraft.toLocaleDateString("ro-RO", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      ) : (
                        <span className="text-muted-foreground">
                          Pick a date
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={addedAfterDraft}
                      onSelect={setAddedAfterDraft}
                      disabled={(date: Date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={clearFilter}>
                  Clear
                </Button>
                <Button onClick={applyFilter} className="gap-2">
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex animate-in items-start justify-center bg-black/50 px-4 pt-[20vh] backdrop-blur-sm sm:px-0 fade-in-0"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-sm animate-in rounded-3xl bg-card p-8 shadow-xl ring-1 ring-foreground/10 zoom-in-95 slide-in-from-top-2 md:max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add product</h2>
              <button
                onClick={closeModal}
                disabled={adding}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-red-600 disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Product URL</label>
                <Input
                  ref={inputRef}
                  type="url"
                  placeholder="https://www.emag.ro/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  disabled={adding}
                  className="text-base md:text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  disabled={adding}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={adding || !url.trim()}
                  className="gap-2"
                >
                  {adding && <Loader2 className="size-4 animate-spin" />}
                  {adding ? "Adding..." : "Add"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}





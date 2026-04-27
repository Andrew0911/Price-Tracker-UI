"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Plus,
  X,
  Loader2,
  ArrowRight,
} from "lucide-react"
import { api } from "@/lib/api"
import { useErrorHandler } from "@/lib/use-error-handler"
import { useNotification } from "@/components/notification"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

  const [modalOpen, setModalOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [adding, setAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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
        .get<never>(`/products?page=1&perPage=${perPage}`)
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
      .get<never>(`/products?page=${page}&perPage=${perPage}`)
      .then((res) => {
        const r = res as unknown as ProductsResponse
        setProducts(r.data ?? [])
        setLastPage(r.lastPage ?? 1)
        setTotal(r.total ?? 0)
      })
      .catch(handleError)
      .finally(() => setLoading(false))
  }, [page, perPage])

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
      <div className="flex shrink-0 items-center justify-between px-6 pt-6 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Wishlist</h1>
          {!loading && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {total} {total === 1 ? "product" : "products"}
            </p>
          )}
        </div>{" "}
        <Button
          onClick={openModal}
          className="gap-2 bg-primary hover:bg-primary/80"
        >
          <Plus className="size-4" />
          Add product
        </Button>{" "}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/wishlist/${product.id}`}
                className="group flex flex-col overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5 transition-shadow hover:shadow-md"
              >
                {/* Image */}
                <div className="relative h-52 w-full shrink-0 overflow-hidden bg-white">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
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
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-border px-6 py-4">
          {/* Per page */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page:</span>
            <div className="flex gap-1">
              {PER_PAGE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handlePerPageChange(opt)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
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

          {/* Pages */}
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

              {visiblePages.map((p, i) =>
                p === "…" ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 text-xs"
                    onClick={() => setPage(p as number)}
                  >
                    {p}
                  </Button>
                )
              )}

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
      )}

      {/* Add Product Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[20vh] backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-card p-8 shadow-xl ring-1 ring-foreground/10"
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

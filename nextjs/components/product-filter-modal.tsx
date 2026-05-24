"use client"

import { useRef, useState } from "react"
import { CalendarIcon, ChevronDown, Search, X } from "lucide-react"
import { Store, STORES } from "@/lib/enums"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type ProductFilterModalProps = {
  addedAfterDraft: Date | undefined
  onAddedAfterDraftChange: (date: Date | undefined) => void
  onApply: () => void
  onClear: () => void
  onClose: () => void
  open: boolean
  statusDraft: 1 | 0 | null
  onStatusDraftChange: (status: 1 | 0 | null) => void
  storeDraft: Store | ""
  onStoreDraftChange: (store: Store | "") => void
}

export function ProductFilterModal({
  addedAfterDraft,
  onAddedAfterDraftChange,
  onApply,
  onClear,
  onClose,
  open,
  statusDraft,
  onStatusDraftChange,
  storeDraft,
  onStoreDraftChange,
}: ProductFilterModalProps) {
  const isMobile = useIsMobile()
  const [storePopoverOpen, setStorePopoverOpen] = useState(false)
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)
  const [storeSearch, setStoreSearch] = useState("")
  const storeSearchRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  function openStorePopover() {
    setStorePopoverOpen(true)
    setStoreSearch("")
  }

  function closeStorePopover() {
    setStorePopoverOpen(false)
    setStoreSearch("")
  }

  function handleClose() {
    closeStorePopover()
    setDatePopoverOpen(false)
    onClose()
  }

  function handleApply() {
    closeStorePopover()
    setDatePopoverOpen(false)
    onApply()
  }

  function handleClear() {
    closeStorePopover()
    setDatePopoverOpen(false)
    onClear()
  }

  function handleDateSelect(date: Date | undefined) {
    onAddedAfterDraftChange(date)
    if (date) setDatePopoverOpen(false)
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

  return (
    <div
      className="fixed inset-0 z-50 flex animate-in items-start justify-center bg-black/50 px-4 pt-[20vh] backdrop-blur-sm fade-in-0 sm:px-0"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm animate-in rounded-3xl bg-card p-8 shadow-xl ring-1 ring-foreground/10 zoom-in-95 slide-in-from-top-2 md:max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Filter products</h2>
          <button
            onClick={handleClose}
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
                  onClick={() => onStoreDraftChange("")}
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
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
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
                          onStoreDraftChange(value)
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
                  onClick={() => onStatusDraftChange(val)}
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
                  onClick={() => {
                    onAddedAfterDraftChange(undefined)
                    setDatePopoverOpen(false)
                  }}
                  className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/70"
                >
                  <X className="size-3" />
                  Clear
                </button>
              )}
            </div>
            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
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
                    <span className="text-muted-foreground">Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={addedAfterDraft}
                  onSelect={handleDateSelect}
                  disabled={(date: Date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
            <Button onClick={handleApply} className="gap-2">
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

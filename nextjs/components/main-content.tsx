"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { AccessGuard } from "@/components/access-guard"

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isProductDetailPage = /^\/wishlist\/[^/]+$/.test(pathname)

  return (
    <main
      className={cn(
        "flex min-h-0 flex-1 flex-col pt-16 md:pt-0",
        isProductDetailPage
          ? "no-scrollbar overflow-y-auto"
          : "overflow-hidden"
      )}
    >
      <AccessGuard>{children}</AccessGuard>
    </main>
  )
}

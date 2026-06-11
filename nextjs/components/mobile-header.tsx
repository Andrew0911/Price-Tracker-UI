"use client"

import Image from "next/image"
import Link from "next/link"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"

export function MobileHeader() {
  return (
    <div className="fixed top-0 right-0 left-0 z-40 border-b border-border bg-background md:hidden">
      <div className="flex h-16 items-center justify-between gap-3 px-4">
        {/* Sidebar Trigger */}
        <SidebarTrigger
          variant="outline"
          className="h-10 w-10 flex-shrink-0 rounded-lg border-1 border-border bg-background transition-all duration-200 hover:border-accent hover:bg-accent"
        />

        {/* Logo & Brand Name */}
        <Link
          href="/dashboard"
          className="flex flex-1 items-center justify-center gap-2"
        >
          <Image
            src="/images/price-pulse-logo.png"
            alt="PricePulse"
            width={32}
            height={32}
          />
          <span className="text-lg font-semibold text-chart-4">
            Price Pulse
          </span>
        </Link>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </div>
  )
}

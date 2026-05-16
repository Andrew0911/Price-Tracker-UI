"use client"

import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Switch } from "@/components/ui/switch"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [checked, setChecked] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      setChecked(resolvedTheme === "dark")
    }
  }, [mounted, resolvedTheme])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (!mounted) return null

  const handleToggle = (nextChecked: boolean) => {
    setChecked(nextChecked)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setTheme(nextChecked ? "dark" : "light")
    }, 180)
  }

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4 text-muted-foreground" />
      <Switch checked={checked} onCheckedChange={handleToggle} />
      <Moon className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}

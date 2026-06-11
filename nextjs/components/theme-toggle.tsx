"use client"

import { useTheme } from "next-themes"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { Moon, Sun } from "lucide-react"
import { Switch } from "@/components/ui/switch"

const subscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  )
  const [optimisticChecked, setOptimisticChecked] = useState<boolean | null>(
    null
  )
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (!mounted) return null

  const checked = optimisticChecked ?? resolvedTheme === "dark"

  const handleToggle = (nextChecked: boolean) => {
    setOptimisticChecked(nextChecked)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setTheme(nextChecked ? "dark" : "light")
      setOptimisticChecked(null)
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

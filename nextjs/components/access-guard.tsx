"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useUser } from "@/lib/user-context"

const COMMON_ROUTES = ["/dashboard", "/wishlist", "/profile", "/account-settings"]
const ADMIN_ROUTES = ["/users"]
const USER_ROUTES = ["/friends"]

function isAllowedPath(pathname: string, isAdmin: boolean) {
  if (COMMON_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return true
  }

  const roleRoutes = isAdmin ? ADMIN_ROUTES : USER_ROUTES
  return roleRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export function AccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useUser()

  const allowed = !!user && isAllowedPath(pathname, user.is_admin)

  useEffect(() => {
    if (!loading && user && !allowed) {
      router.replace("/dashboard")
    }
  }, [allowed, loading, router, user])

  if (loading) return null
  if (!user) return null
  if (!allowed) return null

  return children
}

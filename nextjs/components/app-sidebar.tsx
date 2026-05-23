"use client"

import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  User2,
  BadgeCheck,
  Settings,
  LogOut,
  X,
  ChevronRight,
  Heart,
  Users,
  ShieldUser,
  PanelLeft,
  Loader2,
} from "lucide-react"
import { api, clearAuthToken } from "@/lib/api"
import { useNotification } from "@/components/notification"
import { useUser, clearUserCache } from "@/lib/user-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { ThemeToggle } from "@/components/theme-toggle"
import { getAvatarGradient, getInitials } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { notify } = useNotification()
  const { user } = useUser()
  const { toggleSidebar, state, setOpenMobile } = useSidebar()
  const isMobile = useIsMobile()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const navItems = user?.is_admin
    ? [
        { title: "Dashboard", icon: LayoutDashboard, url: "dashboard" },
        { title: "Wishlist", icon: Heart, url: "wishlist" },
        { title: "Users", icon: ShieldUser, url: "users" },
      ]
    : [
        { title: "Dashboard", icon: LayoutDashboard, url: "dashboard" },
        { title: "Wishlist", icon: Heart, url: "wishlist" },
        { title: "Friends", icon: Users, url: "friends" },
      ]

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const openLogoutConfirm = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
    setShowLogoutConfirm(true)
  }

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await api.post("/logout")
    } catch {
      // best-effort — clear locally regardless
    } finally {
      clearUserCache()
      clearAuthToken()
      notify({ type: "success", message: "Logout successful" })
      router.push("/login")
      setLoggingOut(false)
      setShowLogoutConfirm(false)
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Sidebar collapsible="icon">
        {/* 1. PARTEA DE SUS: Icon și Numele Aplicației */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-1">
                <Tooltip open={state === "collapsed" ? undefined : false}>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      onClick={() => {
                        if (state === "collapsed") {
                          toggleSidebar()
                        } else {
                          router.push("/dashboard")
                          handleNavClick()
                        }
                      }}
                      className="group/logo flex-1 transition-colors hover:bg-primary/5 hover:text-chart-3 group-data-[collapsible=icon]:!h-16 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0"
                    >
                      {/* Icon — hidden on hover when collapsed, shown otherwise */}
                      <div className="shrink-0 transition-opacity group-data-[collapsible=icon]:group-hover/logo:opacity-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/price-pulse-logo.png"
                          alt="PricePulse"
                          className="size-9 object-contain sm:size-10"
                        />
                      </div>
                      {/* PanelLeft — only shown on hover when collapsed */}
                      <PanelLeft className="absolute !size-5 scale-75 opacity-0 transition-all group-data-[collapsible=icon]:group-hover/logo:scale-100 group-data-[collapsible=icon]:group-hover/logo:opacity-100" />
                      <div className="flex min-w-0 flex-col gap-0 leading-none transition-colors group-data-[collapsible=icon]:hidden">
                        <span className="truncate text-sm font-semibold sm:text-base">Price Pulse</span>
                        <span className="hidden text-sm text-muted-foreground sm:block">
                          Shop smarter
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">Open sidebar</TooltipContent>
                </Tooltip>
                <Tooltip open={state === "expanded" ? undefined : false}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={toggleSidebar}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors group-data-[state=collapsed]:hidden hover:bg-sidebar-accent hover:text-foreground"
                    >
                      <PanelLeft className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Close sidebar</TooltipContent>
                </Tooltip>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* 2. PARTEA DE MIJLOC: Tab-urile de navigare */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-sm font-medium group-data-[collapsible=icon]:hidden">
              Menus
            </SidebarGroupLabel>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Tooltip open={state === "collapsed" ? undefined : false}>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        asChild
                        size="lg"
                        isActive={pathname === `/${item.url}`}
                        className="text-base transition-colors group-data-[collapsible=icon]:!h-14 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0 hover:bg-transparent hover:text-chart-3 data-[active=true]:bg-sidebar-accent data-[active=true]:text-chart-3"
                      >
                        <Link href={`/${item.url}`} onClick={handleNavClick}>
                          <item.icon className="!size-5 shrink-0 group-data-[collapsible=icon]:!size-6" />
                          <span className="group-data-[collapsible=icon]:hidden">
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        {/* 3. PARTEA DE JOS: Utilizatorul */}
        <SidebarFooter>
          <SidebarMenu>
            {/* Theme Toggle for Desktop */}
            {!isMobile && (
              <SidebarMenuItem className="group-data-[state=collapsed]:hidden">
                <div className="mb-2 flex items-center justify-between rounded-md px-2 py-3 transition-colors hover:bg-sidebar-accent/50">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
              </SidebarMenuItem>
            )}

            <SidebarMenuItem>
              <DropdownMenu>
                <Tooltip open={state === "collapsed" ? undefined : false}>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton
                        size="lg"
                        className="group-data-[collapsible=icon]:!h-16 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0"
                      >
                        <div
                          className={`flex aspect-square size-10 shrink-0 items-center justify-center rounded-full group-data-[collapsible=icon]:!size-12 ${
                            user
                              ? `bg-gradient-to-br ${getAvatarGradient(user.name)} text-sm font-bold text-white shadow-sm`
                              : "bg-muted"
                          }`}
                        >
                          {user ? (
                            getInitials(user.name)
                          ) : (
                            <User2 className="size-8 group-data-[collapsible=icon]:!size-6" />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-col gap-0 text-left leading-none group-data-[collapsible=icon]:hidden">
                          <span className="truncate text-base">
                            {user?.name ?? "…"}
                          </span>
                          <span className="truncate text-sm text-muted-foreground">
                            {user?.email ?? "…"}
                          </span>
                        </div>
                        <ChevronRight className="ml-auto size-5 group-data-[collapsible=icon]:hidden" />
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {user?.name ?? "Account"}
                  </TooltipContent>
                </Tooltip>

                <DropdownMenuContent
                  side="right"
                  align="end"
                  sideOffset={isMobile ? 14 : 15}
                  className="w-36 min-w-0 rounded-lg text-sm sm:w-56 sm:min-w-48 sm:text-base"
                >
                  <DropdownMenuItem
                    className="cursor-pointer py-2 text-base"
                    onClick={() => {
                      router.push("/profile")
                      handleNavClick()
                    }}
                  >
                    <BadgeCheck className="size-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="cursor-pointer py-2 text-base"
                    onClick={() => {
                      router.push("/account-settings")
                      handleNavClick()
                    }}
                  >
                    <Settings className="size-4" />
                    <span>Account Settings</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="cursor-pointer py-2 text-base text-destructive focus:text-destructive"
                    onClick={openLogoutConfirm}
                  >
                    <LogOut className="size-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[100] flex animate-in items-start justify-center bg-black/50 px-4 pt-[20vh] backdrop-blur-sm sm:px-0 fade-in-0"
          onClick={() => !loggingOut && setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-md animate-in rounded-3xl bg-card p-8 shadow-xl ring-1 ring-foreground/10 zoom-in-95 slide-in-from-top-2"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Logout</h2>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Are you sure you want to log out? You will need to sign in again
              to access your wishlist, friends, and alerts.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                disabled={loggingOut}
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={loggingOut}
                onClick={handleLogout}
                className="text-destructive-foreground gap-2 bg-destructive hover:bg-destructive/90"
              >
                {loggingOut && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {loggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </TooltipProvider>
  )
}






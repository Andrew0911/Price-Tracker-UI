"use client"

import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
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
  ChevronRight,
  Heart,
  Users,
  PanelLeft,
} from "lucide-react"
import { api, clearAuthToken } from "@/lib/api"
import { useNotification } from "@/components/notification"
import { useUser, clearUserCache } from "@/lib/user-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { ThemeToggle } from "@/components/theme-toggle"

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, url: "dashboard" },
  { title: "Wishlist", icon: Heart, url: "wishlist" },
  { title: "Friends", icon: Users, url: "friends" },
]

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { notify } = useNotification()
  const { user } = useUser()
  const { toggleSidebar, state, setOpenMobile } = useSidebar()
  const isMobile = useIsMobile()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  async function handleLogout() {
    try {
      await api.post("/logout")
    } catch {
      // best-effort — clear locally regardless
    } finally {
      clearUserCache()
      clearAuthToken()
      notify({ type: "success", message: "Logout successful" })
      router.push("/login")
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
                        if (state === "collapsed") toggleSidebar()
                      }}
                      className="group/logo flex-1 group-data-[collapsible=icon]:!h-16 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0"
                    >
                      {/* Icon — hidden on hover when collapsed, shown otherwise */}
                      <div className="shrink-0 transition-opacity group-data-[collapsible=icon]:group-hover/logo:opacity-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/price-pulse-logo.png"
                          alt="PricePulse"
                          className="size-10 object-contain"
                        />
                      </div>
                      {/* PanelLeft — only shown on hover when collapsed */}
                      <PanelLeft className="absolute !size-5 scale-75 opacity-0 transition-all group-data-[collapsible=icon]:group-hover/logo:scale-100 group-data-[collapsible=icon]:group-hover/logo:opacity-100" />
                      <div className="flex flex-col gap-0 leading-none group-data-[collapsible=icon]:hidden">
                        <span className="text-base">Price Pulse</span>
                        <span className="text-sm text-muted-foreground">
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
            {mounted && !isMobile && (
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
                        <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-lg bg-muted group-data-[collapsible=icon]:!size-12">
                          <User2 className="size-8 group-data-[collapsible=icon]:!size-6" />
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
                  sideOffset={15}
                  className="w-56 rounded-lg text-base"
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
                    onClick={handleLogout}
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
    </TooltipProvider>
  )
}

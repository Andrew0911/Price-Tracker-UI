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
} from "@/components/ui/sidebar"
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
} from "lucide-react"

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, url: "dashboard" },
  { title: "Wishlist", icon: Heart, url: "wishlist" },
]

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      {/* 1. PARTEA DE SUS: Icon și Numele Aplicației */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="group-data-[collapsible=icon]:!h-16 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0"
            >
              <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-lg bg-primary group-data-[collapsible=icon]:!size-10">
                PT
              </div>
              <div className="flex flex-col gap-0 leading-none group-data-[collapsible=icon]:hidden">
                <span className="text-base">Price Tracker</span>
                <span className="text-sm text-muted-foreground">
                  Shop smarter
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* 2. PARTEA DE MIJLOC: Tab-urile de navigare */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-medium group-data-[collapsible=icon]:hidden">
            Meniuri
          </SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  className="text-base transition-colors group-data-[collapsible=icon]:!h-14 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0 hover:text-chart-3"
                >
                  <a href={item.url}>
                    <item.icon className="!size-5 shrink-0 group-data-[collapsible=icon]:!size-6" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {item.title}
                    </span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* 3. PARTEA DE JOS: Utilizatorul */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="group-data-[collapsible=icon]:!h-16 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0"
                >
                  <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-lg bg-muted group-data-[collapsible=icon]:!size-12">
                    <User2 className="size-8 group-data-[collapsible=icon]:!size-6" />
                  </div>
                  <div className="flex flex-col gap-0 text-left leading-none group-data-[collapsible=icon]:hidden">
                    <span className="text-base">Nume Utilizator</span>
                    <span className="text-sm text-muted-foreground">
                      user@exemplu.ro
                    </span>
                  </div>
                  <ChevronRight className="ml-auto size-5 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="right"
                align="end"
                sideOffset={15}
                className="w-56 rounded-lg text-base"
              >
                <DropdownMenuItem className="cursor-pointer py-2 text-base">
                  <BadgeCheck className="size-4" />
                  <span>Profil</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer py-2 text-base">
                  <Settings className="size-4" />
                  <span>Setări cont</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="cursor-pointer py-2 text-base text-red-600 focus:text-red-600">
                  <LogOut className="size-4" />
                  <span>Deconectare</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

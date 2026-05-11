import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileHeader } from "@/components/mobile-header"
import { UserProvider } from "@/lib/user-context"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserProvider>
      <SidebarProvider>
        <AppSidebar />
        <MobileHeader />
        <main className="flex flex-1 flex-col overflow-auto pt-16 md:pt-0">
          {children}
        </main>
      </SidebarProvider>
    </UserProvider>
  )
}

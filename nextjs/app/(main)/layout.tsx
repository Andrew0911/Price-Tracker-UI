import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileHeader } from "@/components/mobile-header"
import { MainContent } from "@/components/main-content"
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
        <MainContent>{children}</MainContent>
      </SidebarProvider>
    </UserProvider>
  )
}

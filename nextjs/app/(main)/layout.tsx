import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
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
        <main className="flex flex-1 flex-col overflow-auto">
          <SidebarTrigger />
          {children}
        </main>
      </SidebarProvider>
    </UserProvider>
  )
}

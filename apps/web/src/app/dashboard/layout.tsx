"use client";

import { Button, SidebarInset, SidebarProvider, useSidebar } from "@inochi/ui";

import { AppSidebar } from "./_components/app-sidebar";
import { PixelMenu } from "./_components/pixel-icons";

function SidebarTriggerButton() {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="retro -ml-1 size-7"
      onClick={toggleSidebar}
    >
      <PixelMenu className="size-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="h-screen">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTriggerButton />
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

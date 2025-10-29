"use client";

import { UserButton } from "@clerk/clerk-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@inochi/ui/Sidebar";

export function NavUser() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <UserButton showName={true} />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

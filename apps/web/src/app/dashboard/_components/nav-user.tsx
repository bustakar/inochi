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
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full [&>*]:w-full [&>*]:flex [&>*]:flex-row-reverse [&>*]:justify-start [&>*]:items-center [&>*]:gap-2 group-data-[collapsible=icon]:[&>*]:justify-center group-data-[collapsible=icon]:[&_span]:hidden"
        >
          <UserButton showName={true} />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

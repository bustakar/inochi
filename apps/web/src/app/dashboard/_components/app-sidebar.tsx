"use client";

import type * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@inochi/ui";

import "../../styles/retro.css";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { PixelGrid, PixelUser } from "./pixel-icons";

const platformData = {
  navMain: [
    {
      title: "Inventory",
      url: "/dashboard/exercises",
      icon: PixelGrid,
    },
    {
      title: "Character",
      url: "/dashboard/profile",
      icon: PixelUser,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" className="retro" {...props}>
      <SidebarHeader></SidebarHeader>
      <SidebarContent>
        <NavMain items={platformData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

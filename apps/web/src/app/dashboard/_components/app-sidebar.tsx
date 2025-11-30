"use client";

import type * as React from "react";
import { Dumbbell, User } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@inochi/ui";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

const platformData = {
  navMain: [
    {
      title: "Exercises",
      url: "/dashboard/exercises",
      icon: Dumbbell,
    },
  ],
};

const userData = {
  navMain: [
    {
      title: "Profile",
      url: "/dashboard/profile",
      icon: User,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader></SidebarHeader>
      <SidebarContent>
        <NavMain items={platformData.navMain} />
        <NavMain items={userData.navMain} groupLabel="User" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

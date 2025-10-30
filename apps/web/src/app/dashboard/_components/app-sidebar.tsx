"use client";

import { FileText, GraduationCap } from "lucide-react";
import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@inochi/ui/Sidebar";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

const platformData = {
  navMain: [
    {
      title: "Skills",
      url: "/dashboard/skills",
      icon: GraduationCap,
    },
  ],
};

const userData = {
  navMain: [
    {
      title: "Submissions",
      url: "/dashboard/submissions",
      icon: FileText,
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

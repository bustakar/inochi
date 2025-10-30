"use client";

import { UserButton } from "@clerk/clerk-react";

export default function DashboardPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      dashboard
      <UserButton />
    </div>
  );
}

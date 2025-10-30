"use client";

import { UserButton } from "@clerk/clerk-react";
import { SeedButton } from "./_components/seed-button";

export default function DashboardPage() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center gap-4 p-6 md:p-10">
      <div>dashboard</div>
      {/* Temporary: Remove after seeding database */}
      <SeedButton />
      <UserButton />
    </div>
  );
}

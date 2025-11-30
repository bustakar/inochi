"use client";

import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Card } from "@inochi/ui";

import { PowerLevelDisplay } from "./_components/power-level-display";
import { SpiderChart } from "./_components/spider-chart";
import { ArchetypeDisplay } from "./_components/archetype-display";
import { TrophyCase } from "./_components/trophy-case";

export default function ProfilePage() {
  const stats = useQuery(api.functions.userProfile.getUserProfileStats);

  if (stats === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading profile stats...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-3xl font-bold">Profile</h1>
      </div>

      {/* Power Level */}
      <PowerLevelDisplay powerLevel={stats.powerLevel} />

      {/* Archetype */}
      <ArchetypeDisplay archetype={stats.archetype} />

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Spider Chart */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Spider Graph</h2>
          <SpiderChart stats={stats.spiderStats} />
        </Card>

        {/* Trophy Case */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Trophy Case</h2>
          <TrophyCase trophies={stats.trophyCase} />
        </Card>
      </div>
    </div>
  );
}


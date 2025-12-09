"use client";

import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";

import { Card } from "@inochi/ui";

import { CharacterHeader } from "./_components/character-header";
import { SpiderChart } from "./_components/spider-chart";
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
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Character Header with Level and XP */}
      <CharacterHeader
        level={stats.level}
        currentXP={stats.currentXP}
        xpForNextLevel={stats.xpForNextLevel}
        xpProgress={stats.xpProgress}
        archetype={stats.archetype}
      />

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

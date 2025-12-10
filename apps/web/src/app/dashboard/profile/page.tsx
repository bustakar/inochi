"use client";

import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";

import { Card } from "@inochi/ui";

import { CharacterAttributes } from "./_components/character-attributes";
import { CharacterHeader } from "./_components/character-header";
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
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-4">
        {/* Character Header with Level and XP */}
        <CharacterHeader
          level={stats.level}
          currentXP={stats.currentXP}
          xpForNextLevel={stats.xpForNextLevel}
          xpProgress={stats.xpProgress}
          archetype={stats.archetype}
        />

        {/* Main Stats Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Character Attributes */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Attributes</h2>
            <CharacterAttributes stats={stats.spiderStats} />
          </Card>

          {/* Trophy Case */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Trophies</h2>
            <TrophyCase trophies={stats.trophyCase} />
          </Card>
        </div>
      </div>
    </div>
  );
}

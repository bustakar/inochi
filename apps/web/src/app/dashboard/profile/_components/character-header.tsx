"use client";

import { useUser } from "@clerk/clerk-react";

import { Card, HealthBar } from "@inochi/ui";

import "../../../styles/retro.css";

interface CharacterHeaderProps {
  level: number;
  currentXP: number;
  xpForNextLevel: number;
  xpProgress: number;
  archetype: {
    slug: string;
    title: string;
    description: string;
  };
}

export function CharacterHeader({
  level,
  currentXP,
  xpForNextLevel,
  xpProgress,
  archetype,
}: CharacterHeaderProps) {
  const { user } = useUser();
  const characterName =
    user?.fullName ?? user?.firstName ?? user?.username ?? "Adventurer";

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
        {/* Level Badge */}
        <div className="flex items-center justify-center">
          <div className="retro border-foreground bg-muted flex h-20 w-20 items-center justify-center border-4 text-2xl font-bold">
            {level}
          </div>
        </div>

        {/* Character Info */}
        <div className="flex-1">
          <div className="mb-2">
            <h2 className="retro text-2xl font-bold">{characterName}</h2>
            <p className="retro text-muted-foreground text-sm">
              {archetype.title}
            </p>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="retro text-muted-foreground text-xs font-medium">
                Experience
              </span>
              <span className="retro text-muted-foreground text-xs">
                {currentXP.toLocaleString()}/{xpForNextLevel.toLocaleString()}{" "}
                XP
              </span>
            </div>
            <HealthBar
              value={xpProgress}
              sections={20}
              className="h-4"
              progressBg="bg-yellow-500"
              font="retro"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

"use client";

import { Badge, cn } from "@inochi/ui";
import { Trophy, Medal, Award } from "lucide-react";
import { exerciseLevelColors } from "../../../../utils/exercise-utils";
import type { Id } from "@packages/backend/convex/_generated/dataModel";

interface Trophy {
  _id: Id<"exercises">;
  title: string;
  level: string;
  difficulty: number;
  status: string;
}

interface TrophyCaseProps {
  trophies: Trophy[];
}

const trophyIcons = [Trophy, Medal, Award];
const trophyColors = [
  "text-yellow-500",
  "text-gray-400",
  "text-amber-600",
];

export function TrophyCase({ trophies }: TrophyCaseProps) {
  if (trophies.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <Award className="text-muted-foreground mx-auto mb-2 h-12 w-12" />
          <p className="text-muted-foreground text-sm">
            Master exercises to earn trophies!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trophies.map((trophy, index) => {
        const Icon = trophyIcons[index] || Award;
        const colorClass = trophyColors[index] || "text-gray-500";

        return (
          <div
            key={trophy._id}
            className="flex items-center gap-4 rounded-lg border p-4 transition-shadow hover:shadow-md"
          >
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted",
                colorClass,
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">{trophy.title}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge
                  className={
                    exerciseLevelColors[
                      trophy.level as keyof typeof exerciseLevelColors
                    ] || exerciseLevelColors.beginner
                  }
                >
                  {trophy.level}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Difficulty: {trophy.difficulty}/10
                </Badge>
                <Badge
                  variant="outline"
                  className="border-yellow-500 bg-yellow-50 text-yellow-700 dark:border-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400"
                >
                  {trophy.status === "master" ? "Master" : "Journeyman"}
                </Badge>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


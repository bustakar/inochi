"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { ProgressStatus } from "@packages/backend/convex/validators/validators";
import * as React from "react";
import Image from "next/image";
import { Award } from "lucide-react";

import { Badge, Card, cn, HealthBar } from "@inochi/ui";

import {
  exerciseLevelHealthBarColors,
  getProgressStatusLabel,
} from "../../../../utils/exercise-utils";

import "../../../styles/retro.css";

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

// Status-based border styles
const statusBorderStyles: Record<ProgressStatus, string> = {
  novice: "!border-gray-500",
  apprentice: "!border-blue-500",
  journeyman: "!border-purple-500 shadow-purple-500/20 shadow-lg",
  master: "!border-yellow-500 shadow-yellow-500/30 shadow-xl",
};

function getIconNumber(exerciseId: Id<"exercises">): number {
  const hash = exerciseId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (hash % 48) + 1; // Icon1.png through Icon48.png
}

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
      {trophies.map((trophy) => {
        const iconNumber = React.useMemo(
          () => getIconNumber(trophy._id),
          [trophy._id],
        );
        const status = trophy.status as ProgressStatus;
        const borderStyle =
          statusBorderStyles[status] ?? statusBorderStyles.novice;
        const levelColor =
          exerciseLevelHealthBarColors[
            trophy.level as keyof typeof exerciseLevelHealthBarColors
          ] ?? exerciseLevelHealthBarColors.beginner;

        return (
          <Card
            key={trophy._id}
            className={cn("p-4 transition-all hover:shadow-lg", borderStyle)}
          >
            <div className="flex items-start gap-4">
              {/* Exercise Icon */}
              <div className="relative h-16 w-16 shrink-0">
                <Image
                  src={`/icons/exercises/Icon${iconNumber}.png`}
                  alt={trophy.title}
                  fill
                  sizes="64px"
                  className="object-contain"
                />
              </div>

              {/* Trophy Info */}
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="retro text-lg font-semibold">
                    {trophy.title}
                  </h3>
                  <Badge
                    variant="outline"
                    className={cn(
                      "retro shrink-0 border-2 font-bold",
                      status === "master" &&
                        "border-yellow-500 bg-yellow-50 text-yellow-700 dark:border-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
                      status === "journeyman" &&
                        "border-purple-500 bg-purple-50 text-purple-700 dark:border-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
                      status === "apprentice" &&
                        "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
                      status === "novice" &&
                        "border-gray-500 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-900/20 dark:text-gray-400",
                    )}
                  >
                    {getProgressStatusLabel(status)}
                  </Badge>
                </div>

                {/* Difficulty Bar */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="retro text-muted-foreground text-xs">
                      Difficulty:
                    </span>
                    <span className="retro text-muted-foreground text-xs">
                      {trophy.difficulty}/12
                    </span>
                  </div>
                  <HealthBar
                    value={(trophy.difficulty / 12) * 100}
                    sections={12}
                    className="h-3"
                    progressBg={levelColor}
                    font="retro"
                  />
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

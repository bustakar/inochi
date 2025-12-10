"use client";

import type {
  ExerciseLevel,
  ProgressStatus,
} from "@packages/backend/convex/validators/validators";
import type { ComponentProps } from "react";

import {
  BitCard,
  BitCardContent,
  BitCardHeader,
  BitCardTitle,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  HealthBar,
} from "@inochi/ui";

import {
  exerciseLevelHealthBarColors,
  getProgressStatusColor,
  getProgressStatusLabel,
} from "../utils/exercise-utils";

interface ProgressRibbonProps {
  status: ProgressStatus | null;
}

function ProgressRibbon({ status }: ProgressRibbonProps) {
  if (!status) return null;

  return (
    <div
      className={cn(
        "retro absolute top-2 right-2 px-2 py-1 text-xs font-bold",
        getProgressStatusColor(status),
      )}
    >
      {getProgressStatusLabel(status)}
    </div>
  );
}

interface ExerciseNodeCardProps {
  title: string;
  difficulty: number;
  level: ExerciseLevel;
  progressStatus?: ProgressStatus | null;
  onClick?: () => void;
  isGrayscale?: boolean;
  /**
   * Use BitCard for editor, Card for viewer
   */
  variant?: "editor" | "viewer";
  /**
   * Width of the card container
   */
  width?: "narrow" | "wide"; // narrow = 240px, wide = 280px
  /**
   * Number of lines for title clamping
   */
  titleLines?: 1 | 2;
}

export function ExerciseNodeCard({
  title,
  difficulty,
  level,
  progressStatus = null,
  onClick,
  isGrayscale = false,
  variant = "viewer",
  width = "wide",
  titleLines = 2,
}: ExerciseNodeCardProps) {
  const widthClass = width === "narrow" ? "w-[240px]" : "w-[280px]";
  const titleClampClass = titleLines === 1 ? "line-clamp-1" : "line-clamp-2";

  if (variant === "editor") {
    return (
      <div className={widthClass}>
        <BitCard>
          <BitCardHeader className="pb-1">
            <BitCardTitle
              className={cn("retro text-sm font-semibold", titleClampClass)}
            >
              {title}
            </BitCardTitle>
          </BitCardHeader>
          <BitCardContent className="pt-0">
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex w-full justify-between gap-2">
                <span className="text-muted-foreground retro text-xs font-medium">
                  Difficulty:
                </span>
                <span className="text-muted-foreground retro text-xs">
                  {difficulty}/12
                </span>
              </div>
              <HealthBar
                value={(difficulty / 12) * 100}
                sections={12}
                className="h-3"
                progressBg={exerciseLevelHealthBarColors[level]}
              />
            </div>
          </BitCardContent>
        </BitCard>
      </div>
    );
  }

  return (
    <div className={cn("group relative", widthClass)}>
      <Card
        className={cn(
          "transition-transform active:translate-y-1",
          onClick && "cursor-pointer",
          isGrayscale && "opacity-90 grayscale-70",
        )}
        onClick={onClick}
      >
        <ProgressRibbon status={progressStatus} />
        <CardHeader className="pb-1">
          <CardTitle
            className={cn("retro text-sm font-semibold", titleClampClass)}
          >
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex w-full justify-between gap-2">
              <span className="text-muted-foreground retro text-xs font-medium">
                Difficulty:
              </span>
              <span className="text-muted-foreground retro text-xs">
                {difficulty}/12
              </span>
            </div>
            <HealthBar
              value={(difficulty / 12) * 100}
              sections={12}
              className="h-3"
              progressBg={exerciseLevelHealthBarColors[level]}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type {
  ExerciseLevel,
  MuscleRole,
  ProgressStatus,
} from "@packages/backend/convex/validators/validators";
import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Card, CardContent, cn, HealthBar } from "@inochi/ui";

import {
  exerciseLevelHealthBarColors,
  getProgressStatusColor,
  getProgressStatusLabel,
} from "../../../../utils/exercise-utils";

// ============================================================================
// Exercise Card Component
// ============================================================================

export interface ExerciseCardProps {
  exercise: {
    _id: Id<"exercises">;
    _creationTime: number;
    title: string;
    description: string;
    level: ExerciseLevel;
    difficulty: number;
    musclesData: {
      _id: Id<"muscles">;
      name: string;
      muscleGroup?: string;
      role?: MuscleRole;
    }[];
    primaryMuscleGroups: string[];
    userProgress: { status: ProgressStatus } | null;
  };
}

// ============================================================================
// Progress Ribbon Component
// ============================================================================

function ProgressRibbon({ status }: { status: ProgressStatus | null }) {
  return (
    <>
      {status && (
        <div
          className={cn(
            "retro absolute top-2 right-2 px-2 py-1 text-xs font-bold",
            getProgressStatusColor(status),
          )}
        >
          {getProgressStatusLabel(status)}
        </div>
      )}
    </>
  );
}

// ============================================================================
// Exercise Title Component
// ============================================================================

function ExerciseTitle({
  title,
  iconNumber,
}: {
  title: string;
  iconNumber: number;
}) {
  return (
    <div className="mb-2 flex items-start gap-3">
      <div className="relative h-12 w-12 flex-shrink-0">
        <Image
          src={`/icons/exercises/Icon${iconNumber}.png`}
          alt={title}
          fill
          className="object-contain"
        />
      </div>
      <h3 className="text-card-foreground retro flex-1 text-lg font-semibold">
        {title}
      </h3>
    </div>
  );
}

// ============================================================================
// Exercise Description Component
// ============================================================================

function ExerciseDescription({ description }: { description: string }) {
  return (
    <p className="text-muted-foreground/70 mb-3 line-clamp-2 font-mono text-xs">
      {description}
    </p>
  );
}

// ============================================================================
// Difficulty Bar Component
// ============================================================================

function DifficultyBar({
  difficulty,
  level,
}: {
  difficulty: number;
  level: ExerciseLevel;
}) {
  return (
    <div className="mb-6 flex flex-col items-center gap-2">
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
  );
}

// ============================================================================
// Primary Muscle Groups Component
// ============================================================================

function PrimaryMuscleGroups({
  primaryMuscleGroups,
}: {
  primaryMuscleGroups: string[];
}) {
  return (
    <>
      {primaryMuscleGroups.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {primaryMuscleGroups.map((groupName, index) => (
            <span
              key={`group-${index}`}
              className="retro border-foreground/20 bg-muted/50 inline-flex items-center gap-1 border px-2 py-0.5 text-xs"
            >
              {groupName}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const router = useRouter();

  const detailUrl = `/dashboard/exercises/public/${exercise._id}`;

  const handleCardClick = () => {
    router.push(detailUrl);
  };

  const displayDescription = React.useMemo(() => {
    const maxLength = 150;
    if (exercise.description.length <= maxLength) {
      return exercise.description;
    }
    const truncated = exercise.description.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    const cutoff = lastSpace > 0 ? lastSpace : maxLength;
    return exercise.description.substring(0, cutoff) + "...";
  }, [exercise.description]);

  const iconNumber = React.useMemo(() => {
    const hash = exercise._id
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 47) + 1; // Icon1.png through Icon47.png
  }, [exercise._id]);

  return (
    <>
      <Card
        className={cn(
          "cursor-pointer transition-transform active:translate-y-1",
          !exercise.userProgress && "opacity-90 grayscale-70",
        )}
        onClick={handleCardClick}
      >
        <ProgressRibbon status={exercise.userProgress?.status ?? null} />
        <CardContent className="pt-4">
          <ExerciseTitle title={exercise.title} iconNumber={iconNumber} />
          <ExerciseDescription description={displayDescription} />
          <DifficultyBar
            difficulty={exercise.difficulty}
            level={exercise.level}
          />
          <PrimaryMuscleGroups
            primaryMuscleGroups={exercise.primaryMuscleGroups}
          />
        </CardContent>
      </Card>
    </>
  );
}

"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type {
  ExerciseLevel,
  MuscleRole,
} from "@packages/backend/convex/validators/validators";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";

import { Badge, Button, Card, CardContent, HealthBar } from "@inochi/ui";

import {
  exerciseLevelHealthBarColors,
  getMuscleRoleLabel,
  muscleRoles,
} from "../../../../../utils/exercise-utils";
import { ExerciseVariantsReadonly } from "./_components/exercise-variants-readonly";
import { UserProgressSection } from "./_components/user-progress-section";

// ============================================================================
// Exercise Header Component
// ============================================================================

interface ExerciseHeaderProps {
  exercise: {
    title: string;
  };
}

function ExerciseHeader({ exercise }: ExerciseHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-foreground retro text-3xl font-bold">
        {exercise.title}
      </h1>
    </div>
  );
}

// ============================================================================
// Difficulty Section Component
// ============================================================================

interface DifficultySectionProps {
  exercise: {
    level: ExerciseLevel;
    difficulty: number;
  };
}

function DifficultySection({ exercise }: DifficultySectionProps) {
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex w-full justify-between gap-2">
        <span className="text-muted-foreground retro text-xs font-medium">
          Difficulty:
        </span>
        <span className="text-muted-foreground retro text-xs">
          {exercise.difficulty}/12
        </span>
      </div>
      <HealthBar
        value={(exercise.difficulty / 12) * 100}
        sections={12}
        className="h-3"
        progressBg={exerciseLevelHealthBarColors[exercise.level]}
      />
    </div>
  );
}

// ============================================================================
// Description Section Component
// ============================================================================

interface DescriptionSectionProps {
  description: string;
}

function DescriptionSection({ description }: DescriptionSectionProps) {
  return (
    <div>
      <p className="text-muted-foreground retro whitespace-pre-wrap">
        {description}
      </p>
    </div>
  );
}

// ============================================================================
// Muscles Section Component
// ============================================================================

interface MusclesSectionProps {
  muscles: {
    _id: Id<"muscles">;
    name: string;
    muscleGroup?: string;
    role?: MuscleRole;
  }[];
}

function MusclesSection({ muscles }: MusclesSectionProps) {
  const groupedMuscles = React.useMemo(() => {
    const grouped: Record<
      MuscleRole,
      Map<string, { _id: Id<"muscles">; name: string }[]>
    > = {
      primary: new Map(),
      secondary: new Map(),
      stabilizer: new Map(),
    };

    for (const muscle of muscles) {
      const role = muscle.role ?? "primary";
      const group = muscle.muscleGroup ?? "Other";

      if (!grouped[role].has(group)) {
        grouped[role].set(group, []);
      }
      const groupMuscles = grouped[role].get(group);
      if (groupMuscles) {
        groupMuscles.push({
          _id: muscle._id,
          name: muscle.name,
        });
      }
    }

    return grouped;
  }, [muscles]);

  const hasAnyMuscles = muscles.length > 0;

  if (!hasAnyMuscles) {
    return (
      <div>
        <h2 className="text-foreground retro mb-2 text-lg font-semibold">
          Muscles
        </h2>
        <Card>
          <CardContent className="py-6">
            <p className="text-muted-foreground retro text-sm">None</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-foreground retro mb-4 text-lg font-semibold">
        Muscles
      </h2>
      <Card>
        <CardContent className="space-y-4 py-4">
          {muscleRoles.map((role: MuscleRole) => {
            const roleGroups = groupedMuscles[role];
            if (roleGroups.size === 0) return null;

            return (
              <div key={role} className="space-y-2">
                <h3 className="text-muted-foreground retro text-sm font-medium">
                  {getMuscleRoleLabel(role)}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from(roleGroups.entries()).map(
                    ([group, groupMuscles]: [
                      string,
                      { _id: Id<"muscles">; name: string }[],
                    ]) => {
                      const displayGroupName =
                        group === "Other"
                          ? "Other"
                          : group
                              .split(" ")
                              .map(
                                (word: string) =>
                                  word.charAt(0).toUpperCase() + word.slice(1),
                              )
                              .join(" ");

                      return (
                        <div
                          key={`${role}-${group}`}
                          className="bg-muted/50 border-foreground/20 inline-flex items-center gap-1 border px-2 py-1"
                        >
                          <Badge
                            variant="outline"
                            className="border-0 bg-transparent px-1 py-0 text-xs font-semibold"
                          >
                            {displayGroupName}
                          </Badge>
                          <div className="flex flex-wrap gap-4">
                            {groupMuscles.map((muscle) => (
                              <Badge
                                key={muscle._id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {muscle.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function PublicExerciseDetailPage() {
  const params = useParams();
  const exerciseId = params.id as Id<"exercises">;

  const exercise = useQuery(api.functions.exercises.getPublicExerciseById, {
    exerciseId,
  });

  if (exercise === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading exercise...</p>
      </div>
    );
  }

  if (exercise === null) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <p className="text-muted-foreground">Exercise not found.</p>
        <Link href="/dashboard/exercises">
          <Button variant="outline">Back to Exercises</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <ExerciseHeader exercise={exercise} />
      <DifficultySection exercise={exercise} />

      <div className="space-y-6">
        <UserProgressSection
          exerciseId={exerciseId}
          userProgress={exercise.userProgress}
        />
        <DescriptionSection description={exercise.description} />
        <MusclesSection muscles={exercise.muscles} />
        <ExerciseVariantsReadonly variants={exercise.variants} />
      </div>
    </div>
  );
}

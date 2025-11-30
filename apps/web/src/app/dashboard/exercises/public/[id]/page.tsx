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
import { Globe } from "lucide-react";

import { Badge, Button } from "@inochi/ui";

import {
  exerciseLevelColors,
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
    level: ExerciseLevel;
    difficulty: number;
  };
}

function ExerciseHeader({ exercise }: ExerciseHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
        <h1 className="text-foreground text-3xl font-bold">{exercise.title}</h1>
        <div className="flex items-center gap-1">
          <Badge className={exerciseLevelColors[exercise.level]}>
            {exercise.level}
          </Badge>
          <Badge className={exerciseLevelColors[exercise.level]}>
            {exercise.difficulty}/10
          </Badge>
          <Badge
            variant="outline"
            className="border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
          >
            <Globe className="mr-1 h-3 w-3" />
            Public
          </Badge>
        </div>
      </div>
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
      <p className="text-muted-foreground whitespace-pre-wrap">{description}</p>
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
        <h2 className="text-foreground mb-2 text-lg font-semibold">Muscles</h2>
        <p className="text-muted-foreground text-sm">None</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-foreground mb-4 text-lg font-semibold">Muscles</h2>
      <div className="space-y-4">
        {muscleRoles.map((role: MuscleRole) => {
          const roleGroups = groupedMuscles[role];
          if (roleGroups.size === 0) return null;

          return (
            <div key={role} className="space-y-2">
              <h3 className="text-muted-foreground text-sm font-medium">
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
                        className="bg-muted/50 inline-flex items-center gap-1 rounded-lg border px-2 py-1"
                      >
                        <Badge
                          variant="outline"
                          className="border-0 bg-transparent px-1 py-0 text-xs font-semibold"
                        >
                          {displayGroupName}
                        </Badge>
                        <span className="text-muted-foreground text-xs">•</span>
                        <div className="flex flex-wrap gap-1">
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
      </div>
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

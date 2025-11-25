"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Globe } from "lucide-react";

import { Badge, Button } from "@inochi/ui";

import { ExerciseVariantsReadonly } from "./_components/exercise-variants-readonly";

// ============================================================================
// Constants
// ============================================================================

const levelColors: Record<
  "beginner" | "intermediate" | "advanced" | "expert" | "elite",
  string
> = {
  beginner:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  intermediate:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  advanced:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  expert:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  elite: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

// ============================================================================
// Exercise Header Component
// ============================================================================

interface ExerciseHeaderProps {
  exercise: {
    title: string;
    level: "beginner" | "intermediate" | "advanced" | "expert" | "elite";
    category: "calisthenics" | "gym" | "stretch" | "mobility";
    difficulty: number;
  };
}

function ExerciseHeader({ exercise }: ExerciseHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
        <h1 className="text-foreground text-3xl font-bold">{exercise.title}</h1>
        <div className="flex items-center gap-1">
          <Badge className={levelColors[exercise.level]}>
            {exercise.level}
          </Badge>
          <Badge className={levelColors[exercise.level]}>
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
    role?: "primary" | "secondary" | "tertiary" | "stabilizer";
  }[];
}

const roleLabels: Record<
  "primary" | "secondary" | "tertiary" | "stabilizer",
  string
> = {
  primary: "Primary",
  secondary: "Secondary",
  tertiary: "Tertiary",
  stabilizer: "Stabilizer",
};

function MusclesSection({ muscles }: MusclesSectionProps) {
  const groupedMuscles = React.useMemo(() => {
    const grouped: Record<
      "primary" | "secondary" | "tertiary" | "stabilizer",
      Map<string, { _id: Id<"muscles">; name: string }[]>
    > = {
      primary: new Map(),
      secondary: new Map(),
      tertiary: new Map(),
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
        {(
          ["primary", "secondary", "tertiary", "stabilizer"] as (
            | "primary"
            | "secondary"
            | "tertiary"
            | "stabilizer"
          )[]
        ).map((role) => {
          const roleGroups = groupedMuscles[role];
          if (roleGroups.size === 0) return null;

          return (
            <div key={role} className="space-y-2">
              <h3 className="text-muted-foreground text-sm font-medium">
                {roleLabels[role]}
              </h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(roleGroups.entries()).map(
                  ([group, groupMuscles]) => {
                    const displayGroupName =
                      group === "Other"
                        ? "Other"
                        : group
                            .split(" ")
                            .map(
                              (word) =>
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
// Progression Section Component
// ============================================================================

interface ProgressionSectionProps {
  exercises: {
    _id: Id<"exercises">;
    title: string;
  }[];
  title: string;
}

function ProgressionSection({ exercises, title }: ProgressionSectionProps) {
  const getExerciseRoute = (exerciseId: Id<"exercises">): string => {
    return `/dashboard/exercises/public/${exerciseId}`;
  };

  return (
    <div>
      <h2 className="text-foreground mb-2 text-lg font-semibold">{title}</h2>
      {exercises.length === 0 ? (
        <p className="text-muted-foreground text-sm">None</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {exercises.map((exercise) => (
            <Link
              key={exercise._id}
              href={getExerciseRoute(exercise._id)}
              className="transition-opacity hover:opacity-80"
            >
              <Badge variant="secondary" className="cursor-pointer">
                {exercise.title}
              </Badge>
            </Link>
          ))}
        </div>
      )}
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
  const variants = useQuery(
    api.functions.exerciseVariants.getExerciseVariants,
    {
      exerciseId,
    },
  );

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
        <DescriptionSection description={exercise.description} />
        <MusclesSection muscles={exercise.muscles} />
        <ProgressionSection
          exercises={exercise.prerequisites}
          title="Prerequisites"
        />
        <ProgressionSection
          exercises={exercise.progressions}
          title="Progressions"
        />
        <ExerciseVariantsReadonly variants={variants ?? []} />
      </div>
    </div>
  );
}

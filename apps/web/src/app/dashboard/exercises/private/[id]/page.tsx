"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { api } from "@packages/backend/convex/_generated/api";
import { Doc, Id } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { ArrowLeft, Edit } from "lucide-react";

import { Badge, Button } from "@inochi/ui";

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

const categoryColors: Record<
  "calisthenics" | "gym" | "stretch" | "mobility",
  string
> = {
  calisthenics:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  gym: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  stretch:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  mobility:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
};

// ============================================================================
// Exercise Header Component
// ============================================================================

interface ExerciseHeaderProps {
  exercise: Doc<"private_exercises">;
  exerciseId: Id<"private_exercises">;
}

function ExerciseHeader({ exercise, exerciseId }: ExerciseHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/exercises">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-3xl font-bold">
            {exercise.title}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge
              className={
                levelColors[exercise.level] ||
                "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
              }
            >
              {exercise.level}
            </Badge>
            <Badge
              className={
                categoryColors[exercise.category] ||
                "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
              }
            >
              {exercise.category}
            </Badge>
            <Badge variant="outline">Private</Badge>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/dashboard/exercises/private/${exerciseId}/edit`)
          }
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
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
      <h2 className="text-foreground mb-2 text-lg font-semibold">
        Description
      </h2>
      <p className="text-muted-foreground whitespace-pre-wrap">{description}</p>
    </div>
  );
}

// ============================================================================
// Difficulty Section Component
// ============================================================================

interface DifficultySectionProps {
  difficulty: number;
}

function DifficultySection({ difficulty }: DifficultySectionProps) {
  return (
    <div>
      <h2 className="text-foreground mb-2 text-lg font-semibold">Difficulty</h2>
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`h-3 w-3 rounded-full ${
                i < difficulty ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className="text-muted-foreground text-sm">{difficulty}/10</span>
      </div>
    </div>
  );
}

// ============================================================================
// Progression Section Component
// ============================================================================

interface ProgressionSectionProps {
  exerciseIds: Id<"exercises">[];
  allExercises:
    | Array<{
        _id: Id<"private_exercises">;
        _creationTime: number;
        userId: string;
        title: string;
        description: string;
        category: "calisthenics" | "gym" | "stretch" | "mobility";
        level: "beginner" | "intermediate" | "advanced" | "expert" | "elite";
        difficulty: number;
        musclesData: Array<Doc<"muscles"> & { role?: string }>;
        equipmentData: Array<Doc<"equipment">>;
      }>
    | undefined;
  title: string;
}

function ProgressionSection({
  exerciseIds,
  allExercises,
  title,
}: ProgressionSectionProps) {
  // Note: exerciseIds reference public exercises (Id<"exercises">),
  // but we're filtering private exercises (Id<"private_exercises">).
  // Since these are different ID types, we convert the private exercise IDs to strings
  // for comparison. In practice, these will likely be empty until schema supports
  // private-to-private references or we change the schema to use union types.
  const exerciseIdStrings = new Set(
    exerciseIds.map((id) => id as unknown as string),
  );
  const progressionExercises =
    allExercises?.filter((e) =>
      exerciseIdStrings.has(e._id as unknown as string),
    ) || [];

  return (
    <div>
      <h2 className="text-foreground mb-2 text-lg font-semibold">{title}</h2>
      {progressionExercises.length === 0 ? (
        <p className="text-muted-foreground text-sm">None</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {progressionExercises.map((exercise) => (
            <Badge key={exercise._id} variant="secondary">
              {exercise.title}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function PrivateExerciseDetailPage() {
  const params = useParams();
  const exerciseId = params.id as Id<"private_exercises">;

  const exercise = useQuery(api.functions.exercises.getPrivateExerciseById, {
    exerciseId,
  });
  const allPrivateExercises = useQuery(
    api.functions.exercises.getPrivateExercises,
    {},
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
    <div className="space-y-6">
      <ExerciseHeader exercise={exercise} exerciseId={exerciseId} />

      <div className="space-y-6">
        <DescriptionSection description={exercise.description} />
        <DifficultySection difficulty={exercise.difficulty} />

        <div className="grid gap-6 md:grid-cols-2">
          <ProgressionSection
            exerciseIds={exercise.prerequisites}
            allExercises={allPrivateExercises}
            title="Prerequisites"
          />
          <ProgressionSection
            exerciseIds={exercise.progressionFrom}
            allExercises={allPrivateExercises}
            title="Progression From"
          />
        </div>

        <ProgressionSection
          exerciseIds={exercise.progressionTo}
          allExercises={allPrivateExercises}
          title="Progression To"
        />
      </div>
    </div>
  );
}

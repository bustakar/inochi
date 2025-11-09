"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@packages/backend/convex/_generated/api";
import { Doc } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Dumbbell, Target } from "lucide-react";

import { Badge } from "@inochi/ui";

import { CreateExerciseDialog } from "./_components/create-exercise-dialog";

// ============================================================================
// Exercise Card Component
// ============================================================================

interface ExerciseCardProps {
  exercise: {
    _id: Doc<"private_exercises">["_id"];
    _creationTime: number;
    userId: string;
    title: string;
    description: string;
    category: "calisthenics" | "gym" | "stretch" | "mobility";
    level: "beginner" | "intermediate" | "advanced" | "expert" | "elite";
    difficulty: number;
    musclesData: Array<Doc<"muscles"> & { role?: string }>;
    equipmentData: Array<Doc<"equipment">>;
  };
}

const levelColors: Record<string, string> = {
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

const categoryColors: Record<string, string> = {
  calisthenics:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  gym: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  stretch:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  mobility:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
};

function ExerciseCard({ exercise }: ExerciseCardProps) {
  const router = useRouter();
  const detailUrl = `/dashboard/exercises/private/${exercise._id}`;

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

  return (
    <div
      className="bg-card relative cursor-pointer rounded-lg border p-4 transition-shadow hover:shadow-md"
      onClick={handleCardClick}
    >
      {/* Header with title and more button */}
      <div className="mb-2 flex items-start justify-between">
        <h3 className="text-card-foreground flex-1 pr-8 text-lg font-semibold">
          {exercise.title}
        </h3>
      </div>

      {/* Level and category badges */}
      <div className="mb-2 flex items-center gap-2">
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
        <Badge variant="outline" className="text-xs">
          Private
        </Badge>
      </div>

      <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">
        {displayDescription}
      </p>

      <div className="mb-3 flex items-center gap-2">
        <span className="text-muted-foreground text-xs font-medium">
          Difficulty:
        </span>
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${
                i < exercise.difficulty ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className="text-muted-foreground text-xs">
          {exercise.difficulty}/10
        </span>
      </div>

      {(exercise.musclesData && exercise.musclesData.length > 0) ||
      (exercise.equipmentData && exercise.equipmentData.length > 0) ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {exercise.musclesData?.map((muscle) => (
            <Badge
              key={muscle._id}
              variant="outline"
              className="flex items-center gap-1 text-xs"
            >
              <Target className="h-3 w-3" />
              {muscle.name}
              {muscle.role && (
                <span className="text-muted-foreground ml-1">
                  ({muscle.role})
                </span>
              )}
            </Badge>
          ))}
          {exercise.equipmentData?.map((equip) => (
            <Badge
              key={equip._id}
              variant="outline"
              className="flex items-center gap-1 text-xs"
            >
              <Dumbbell className="h-3 w-3" />
              {equip.name}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ============================================================================
// Exercises List Component
// ============================================================================

function ExercisesList() {
  const exercises = useQuery(api.functions.exercises.getPrivateExercises, {});

  if (exercises === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading exercises...</p>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">No exercises found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {exercises.map((exercise) => (
        <ExerciseCard key={exercise._id} exercise={exercise} />
      ))}
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function ExercisesPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-3xl font-bold">Exercises</h1>
        <CreateExerciseDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </div>

      {/* Exercises List */}
      <ExercisesList />
    </div>
  );
}

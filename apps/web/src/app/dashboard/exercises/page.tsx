"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type {
  ExerciseLevel,
  MuscleRole,
  ProgressStatus,
} from "@packages/backend/convex/validators/validators";
import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Globe, Target } from "lucide-react";

import { Badge, cn } from "@inochi/ui";

import { Search } from "../../../components/search";
import {
  exerciseLevelColors,
  getProgressStatusColor,
  getProgressStatusLabel,
} from "../../../utils/exercise-utils";

// ============================================================================
// Exercise Card Component
// ============================================================================

interface ExerciseCardProps {
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

function ProgressRibbon({ status }: { status: ProgressStatus }) {
  return (
    <div
      className={cn(
        "absolute top-0 right-0 rounded-bl-lg px-3 py-1 text-xs font-bold shadow-sm",
        getProgressStatusColor(status),
      )}
    >
      {getProgressStatusLabel(status)}
    </div>
  );
}

function ExerciseCard({ exercise }: ExerciseCardProps) {
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

  return (
    <div
      className={cn(
        "bg-card relative cursor-pointer rounded-lg border p-4 transition-shadow hover:shadow-md",
        !exercise.userProgress && "opacity-90 grayscale",
      )}
      onClick={handleCardClick}
    >
      {/* Progress ribbon */}
      {exercise.userProgress && (
        <ProgressRibbon status={exercise.userProgress.status} />
      )}

      {/* Header with title */}
      <div className="mb-2 flex items-start justify-between">
        <h3 className="text-card-foreground flex-1 pr-8 text-lg font-semibold">
          {exercise.title}
        </h3>
      </div>

      {/* Level and visibility badges */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge className={exerciseLevelColors[exercise.level]}>
          {exercise.level}
        </Badge>
        <Badge
          variant="outline"
          className="border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
        >
          <Globe className="mr-1 h-3 w-3" />
          Public
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

      {exercise.primaryMuscleGroups.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {exercise.primaryMuscleGroups.map((groupName, index) => (
            <Badge
              key={`group-${index}`}
              variant="outline"
              className="flex items-center gap-1 text-xs"
            >
              <Target className="h-3 w-3" />
              {groupName}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Exercises List Component
// ============================================================================

interface ExercisesListProps {
  searchQuery: string;
}

function ExercisesList({ searchQuery }: ExercisesListProps) {
  const exercises = useQuery(api.functions.exercises.getAllExercises, {
    searchQuery: searchQuery.trim() || undefined,
  });

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
        <p className="text-muted-foreground">
          {searchQuery.trim()
            ? "No exercises found matching your search."
            : "No exercises found."}
        </p>
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
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-3xl font-bold">Exercises</h1>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Search
          initialValue={searchQuery}
          onSearchUpdate={setSearchQuery}
          placeholder="Search exercises by title or description..."
        />
      </div>

      {/* Exercises List */}
      <ExercisesList searchQuery={searchQuery} />
    </div>
  );
}

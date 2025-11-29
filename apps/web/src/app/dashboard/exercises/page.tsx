"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Globe, Target } from "lucide-react";

import { Badge } from "@inochi/ui";

import { Search } from "../../../components/search";

// ============================================================================
// Exercise Card Component
// ============================================================================

interface ExerciseCardProps {
  exercise: {
    _id: Id<"exercises">;
    _creationTime: number;
    title: string;
    description: string;
    level: "beginner" | "intermediate" | "advanced" | "expert" | "elite";
    difficulty: number;
    musclesData: {
      _id: Id<"muscles">;
      name: string;
      muscleGroup?: string;
      role?: "primary" | "secondary" | "tertiary" | "stabilizer";
    }[];
    primaryMuscleGroups: string[];
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
      className="bg-card relative cursor-pointer rounded-lg border p-4 transition-shadow hover:shadow-md"
      onClick={handleCardClick}
    >
      {/* Header with title */}
      <div className="mb-2 flex items-start justify-between">
        <h3 className="text-card-foreground flex-1 pr-8 text-lg font-semibold">
          {exercise.title}
        </h3>
      </div>

      {/* Level and visibility badges */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge
          className={
            levelColors[exercise.level] ??
            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
          }
        >
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
      {exercises.map((exercise: ExerciseCardProps["exercise"]) => (
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

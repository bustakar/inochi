"use client";

import type { ExerciseLevel } from "@packages/backend/convex/validators/validators";
import { useState } from "react";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";

import { Badge, Button } from "@inochi/ui";

import { PixelLog } from "../_components/pixel-icons";
import { Search } from "../../../components/search";
import {
  exerciseLevelHealthBarColors,
  exerciseLevels,
} from "../../../utils/exercise-utils";
import { ExerciseCard } from "../exercise-trees/_components/exercise-card";
import { BatchProgressDialog } from "./_components/batch-progress-dialog";

// ============================================================================
// Level Section Header Component
// ============================================================================

function LevelSectionHeader({ level }: { level: ExerciseLevel }) {
  return (
    <div className="flex items-center gap-3 py-4">
      <Badge className={exerciseLevelHealthBarColors[level]}>{level}</Badge>
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
  const exercisesByLevel = useQuery(
    api.functions.exercises.getAllExercisesByLevel,
    {
      searchQuery: searchQuery.trim() || undefined,
    },
  );

  if (exercisesByLevel === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading exercises...</p>
      </div>
    );
  }

  // Check if all levels are empty
  const hasAnyExercises = exerciseLevels.some(
    (level) => exercisesByLevel[level].length > 0,
  );

  if (!hasAnyExercises) {
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
    <div className="space-y-8">
      {exerciseLevels.map((level) => {
        const exercises = exercisesByLevel[level];
        if (exercises.length === 0) {
          return null;
        }

        return (
          <div key={level}>
            <LevelSectionHeader level={level} />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {exercises.map((exercise) => (
                <ExerciseCard key={exercise._id} exercise={exercise} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function ExercisesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
        {/* Search and Batch Update */}
        <div className="flex items-center justify-between gap-4">
          <div className="max-w-md flex-1">
            <Search
              initialValue={searchQuery}
              onSearchUpdate={setSearchQuery}
              placeholder="Search exercises by title or description..."
            />
          </div>
          <Button variant="outline" onClick={() => setIsBatchDialogOpen(true)}>
            <PixelLog className="size-8" />
            <span className="hidden sm:inline">Log Progress</span>
          </Button>
        </div>

        {/* Exercises List */}
        <ExercisesList searchQuery={searchQuery} />

        {/* Batch Progress Dialog */}
        <BatchProgressDialog
          open={isBatchDialogOpen}
          onOpenChange={setIsBatchDialogOpen}
        />
      </div>
    </div>
  );
}

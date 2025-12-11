"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type {
  ExerciseLevel,
  ProgressStatus,
} from "@packages/backend/convex/validators/validators";

import type { ExerciseCardProps } from "../../dashboard/exercise-trees/_components/exercise-card";
import {
  exerciseLevels,
  progressStatuses,
} from "../../../utils/exercise-utils";
import { ExerciseCard } from "../../dashboard/exercise-trees/_components/exercise-card";

// ============================================================================
// Mock Data Generator
// ============================================================================

function createMockExercise(
  level: ExerciseLevel,
  progressStatus?: ProgressStatus,
  overrides?: Partial<ExerciseCardProps["exercise"]>,
): ExerciseCardProps["exercise"] {
  return {
    _id: `mock_${level}_${progressStatus ?? "none"}` as Id<"exercises">,
    _creationTime: Date.now(),
    title: `${level.charAt(0).toUpperCase() + level.slice(1)} Push-Up`,
    description:
      "A compound upper body exercise that targets the chest, shoulders, and triceps while engaging the core for stability. This exercise builds functional strength and can be modified for different fitness levels.",
    level,
    difficulty: Math.floor(Math.random() * 10) + 1,
    musclesData: [],
    primaryMuscleGroups: ["Chest", "Shoulders", "Triceps"],
    userProgress: progressStatus ? { status: progressStatus } : null,
    ...overrides,
  };
}

// ============================================================================
// Preview Page Component
// ============================================================================

export default function ComponentPreviewPage() {
  return (
    <div className="container mx-auto space-y-12 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Exercise Card Variations</h1>
        <p className="text-muted-foreground">
          Preview all possible variations of the ExerciseCard component
        </p>
      </div>

      {/* By Level - All with Progress */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold">
          By Level (with Apprentice progress)
        </h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Shows how the card looks with different exercise levels, all with the
          same progress status
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exerciseLevels.map((level) => (
            <ExerciseCard
              key={`level-${level}`}
              exercise={createMockExercise(level, "apprentice", {
                difficulty: exerciseLevels.indexOf(level) + 2,
              })}
            />
          ))}
        </div>
      </section>

      {/* By Progress Status */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold">
          By Progress Status (Intermediate level)
        </h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Shows how the progress ribbon appears for different statuses
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {progressStatuses.map((status) => (
            <ExerciseCard
              key={`status-${status}`}
              exercise={createMockExercise("intermediate", status)}
            />
          ))}
        </div>
      </section>

      {/* Without Progress (Inactive State) */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold">
          Without Progress (Inactive/Grayscale)
        </h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Shows the inactive state when a user hasn't started the exercise yet
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exerciseLevels.slice(0, 3).map((level) => (
            <ExerciseCard
              key={`no-progress-${level}`}
              exercise={createMockExercise(level)}
            />
          ))}
        </div>
      </section>

      {/* Long Description */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold">Long Description</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Shows how the description truncates when it exceeds the maximum length
        </p>
        <div className="max-w-md">
          <ExerciseCard
            exercise={createMockExercise("advanced", "journeyman", {
              description:
                "This is a very long description that will definitely exceed the maximum character limit of 150 characters. It should be truncated with an ellipsis at the end to maintain a consistent card height and prevent the layout from breaking. The truncation should happen at a word boundary to avoid cutting words in half.",
            })}
          />
        </div>
      </section>

      {/* Different Difficulties */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold">Different Difficulties</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Shows how the difficulty indicator appears for different values
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 3, 7, 10].map((difficulty) => (
            <ExerciseCard
              key={`difficulty-${difficulty}`}
              exercise={createMockExercise("intermediate", "apprentice", {
                difficulty,
                title: `Exercise (Difficulty ${difficulty}/10)`,
              })}
            />
          ))}
        </div>
      </section>

      {/* All Combinations Grid */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold">All Combinations</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          A comprehensive grid showing all level and progress status
          combinations
        </p>
        <div className="space-y-8">
          {exerciseLevels.map((level) => (
            <div key={`combo-${level}`}>
              <h3 className="mb-4 text-lg font-medium capitalize">{level}</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {progressStatuses.map((status) => (
                  <ExerciseCard
                    key={`combo-${level}-${status}`}
                    exercise={createMockExercise(level, status)}
                  />
                ))}
                {/* Also show without progress */}
                <ExerciseCard
                  key={`combo-${level}-none`}
                  exercise={createMockExercise(level)}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

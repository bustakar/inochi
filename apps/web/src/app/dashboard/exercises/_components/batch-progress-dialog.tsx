"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type {
  ExerciseLevel,
  ProgressStatus,
} from "@packages/backend/convex/validators/validators";
import { useMemo, useState } from "react";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  ToggleGroup,
  ToggleGroupItem,
} from "@inochi/ui";

import {
  exerciseLevelColors,
  exerciseLevels,
  getProgressStatusLabel,
  progressStatuses,
} from "../../../../utils/exercise-utils";

interface BatchProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================================================
// Exercise Search Component
// ============================================================================

interface ExerciseSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

function ExerciseSearch({ searchQuery, onSearchChange }: ExerciseSearchProps) {
  return (
    <div className="relative">
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        placeholder="Search exercises..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}

// ============================================================================
// Exercise List Component
// ============================================================================

interface Exercise {
  _id: Id<"exercises">;
  title: string;
  description: string;
  level: ExerciseLevel;
  difficulty: number;
  userProgress: { status: ProgressStatus } | null;
}

interface ExerciseListProps {
  exercises: Exercise[] | undefined;
  filteredExercises: Exercise[];
  searchQuery: string;
  exerciseStatuses: Map<Id<"exercises">, ProgressStatus | null>;
  onStatusChange: (
    exerciseId: Id<"exercises">,
    status: ProgressStatus | null,
    originalStatus: ProgressStatus | null,
  ) => void;
  disabled?: boolean;
}

function ExerciseList({
  exercises,
  filteredExercises,
  searchQuery,
  exerciseStatuses,
  onStatusChange,
  disabled,
}: ExerciseListProps) {
  if (exercises === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading exercises...</p>
      </div>
    );
  }

  if (filteredExercises.length === 0) {
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
    <div className="min-h-0 flex-1 divide-y overflow-auto rounded-lg border">
      {filteredExercises.map((exercise) => {
        const selectedStatus =
          exerciseStatuses.get(exercise._id) ??
          exercise.userProgress?.status ??
          null;
        const displayValue = selectedStatus ?? "none";
        // Only highlight if the selected status is different from the original
        const originalStatus = exercise.userProgress?.status ?? null;
        const hasChangedStatus =
          exerciseStatuses.has(exercise._id) &&
          selectedStatus !== originalStatus;

        return (
          <div
            key={exercise._id}
            className={cn(
              "hover:bg-muted/50 flex flex-col gap-3 p-4 transition-all md:flex-row md:items-center md:justify-between",
              hasChangedStatus &&
                "border-l-4 border-l-primary bg-primary/5 ring-1 ring-primary/20",
            )}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">{exercise.title}</h4>
                <Badge className={exerciseLevelColors[exercise.level]}>
                  {exercise.level}
                </Badge>
              </div>
              <p className="text-muted-foreground line-clamp-1 text-xs">
                {exercise.description}
              </p>
            </div>
            <ToggleGroup
              type="single"
              value={displayValue}
              onValueChange={(value) => {
                const originalStatus = exercise.userProgress?.status ?? null;
                if (value === "none" || !value) {
                  onStatusChange(exercise._id, null, originalStatus);
                } else {
                  onStatusChange(exercise._id, value as ProgressStatus, originalStatus);
                }
              }}
              disabled={disabled}
              variant="outline"
              size="sm"
              spacing={0}
              className="w-full sm:w-auto"
            >
              <ToggleGroupItem
                value="none"
                aria-label={`Set ${exercise.title} to Not Started`}
              >
                Not Started
              </ToggleGroupItem>
              {progressStatuses.map((status) => (
                <ToggleGroupItem
                  key={status}
                  value={status}
                  aria-label={`Set ${exercise.title} to ${getProgressStatusLabel(status)}`}
                >
                  {getProgressStatusLabel(status)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Main Dialog Component
// ============================================================================

export function BatchProgressDialog({
  open,
  onOpenChange,
}: BatchProgressDialogProps) {
  const exercises = useQuery(api.functions.exercises.getAllExercises, {
    searchQuery: undefined,
  });

  const batchUpdate = useMutation(
    api.functions.userExerciseProgress
      .batchUpdateUserExerciseProgressWithStatuses,
  );

  const [exerciseStatuses, setExerciseStatuses] = useState<
    Map<Id<"exercises">, ProgressStatus | null>
  >(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Flatten grouped exercises and filter by search query
  const filteredAndSortedExercises = useMemo(() => {
    if (!exercises) return [];

    // Flatten the grouped structure into a single array
    let result: Exercise[] = [];
    for (const level of exerciseLevels) {
      if (exercises[level]) {
        result.push(...exercises[level]);
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (exercise) =>
          exercise.title.toLowerCase().includes(query) ||
          exercise.description.toLowerCase().includes(query),
      );
    }

    // Exercises are already sorted by level, difficulty, then title from backend
    return result;
  }, [exercises, searchQuery]);

  const handleStatusChange = (
    exerciseId: Id<"exercises">,
    status: ProgressStatus | null,
    originalStatus: ProgressStatus | null,
  ) => {
    const newStatuses = new Map(exerciseStatuses);
    // If the new status matches the original, remove it from the map
    // (so it won't be highlighted and won't be included in the update)
    if (status === originalStatus) {
      newStatuses.delete(exerciseId);
    } else if (status === null) {
      // Setting to null (not started) - remove from map since nulls are filtered out in submit
      newStatuses.delete(exerciseId);
    } else {
      // New status is different from original, add it to the map
      newStatuses.set(exerciseId, status);
    }
    setExerciseStatuses(newStatuses);
  };

  const handleSubmit = async () => {
    // Filter out null statuses (not started)
    const updates = Array.from(exerciseStatuses.entries())
      .filter(([, status]) => status !== null)
      .map(([exerciseId, status]) => ({
        exerciseId,
        status: status as ProgressStatus,
      }));

    if (updates.length === 0) {
      toast.error("Please select at least one exercise status");
      return;
    }

    setIsUpdating(true);
    try {
      const count = await batchUpdate({ updates });
      toast.success(
        `Successfully updated progress for ${count} exercise${count !== 1 ? "s" : ""}`,
      );
      setExerciseStatuses(new Map());
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update progress. Please try again.");
      console.error("Error updating progress:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    if (!isUpdating) {
      setExerciseStatuses(new Map());
      setSearchQuery("");
      onOpenChange(false);
    }
  };

  const selectedCount = exerciseStatuses.size;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[80vh] flex-col md:max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>Batch Update Progress</DialogTitle>
          <DialogDescription>
            Select a progress status for each exercise. Click a status button to
            set it for that exercise.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <ExerciseSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <ExerciseList
            exercises={exercises}
            filteredExercises={filteredAndSortedExercises}
            searchQuery={searchQuery}
            exerciseStatuses={exerciseStatuses}
            onStatusChange={handleStatusChange}
            disabled={isUpdating}
          />
        </div>

        <DialogFooter>
          <div className="flex w-full items-center justify-between">
            <span className="text-muted-foreground text-sm">
              {selectedCount > 0
                ? `${selectedCount} exercise${selectedCount !== 1 ? "s" : ""} selected`
                : "No exercises selected"}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isUpdating || selectedCount === 0}
              >
                {isUpdating
                  ? "Updating..."
                  : `Update ${selectedCount} Exercise${selectedCount !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

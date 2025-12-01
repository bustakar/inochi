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

interface Exercise {
  _id: Id<"exercises">;
  title: string;
  description: string;
  level: ExerciseLevel;
  difficulty: number;
  userProgress: { status: ProgressStatus } | null;
}

type ExercisesByLevel = Record<ExerciseLevel, Exercise[]>;

function buildExercisesMap(
  exercises: ExercisesByLevel,
): Map<Id<"exercises">, Exercise> {
  const map = new Map<Id<"exercises">, Exercise>();
  for (const level of exerciseLevels) {
    for (const exercise of exercises[level]) {
      map.set(exercise._id, exercise);
    }
  }
  return map;
}

function flattenExercises(exercises: ExercisesByLevel): Exercise[] {
  return exerciseLevels.flatMap((level) => exercises[level]);
}

interface ExerciseSearchProps {
  value: string;
  onChange: (value: string) => void;
}

function ExerciseSearch({ value, onChange }: ExerciseSearchProps) {
  return (
    <div className="relative">
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        placeholder="Search exercises..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}

interface ExerciseRowProps {
  exercise: Exercise;
  selectedStatus: ProgressStatus | null;
  hasChanged: boolean;
  onStatusChange: (status: ProgressStatus | null) => void;
  disabled?: boolean;
}

function ExerciseRow({
  exercise,
  selectedStatus,
  hasChanged,
  onStatusChange,
  disabled,
}: ExerciseRowProps) {
  return (
    <div
      className={cn(
        "hover:bg-muted/50 flex flex-col gap-3 p-4 transition-all md:flex-row md:items-center md:justify-between",
        hasChanged &&
          "border-l-primary bg-primary/5 ring-primary/20 border-l-4 ring-1",
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
        value={selectedStatus ?? "none"}
        onValueChange={(value) => {
          onStatusChange(
            value === "none" || !value ? null : (value as ProgressStatus),
          );
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
}

interface ExerciseListProps {
  exercises: ExercisesByLevel | undefined;
  filteredExercises: Exercise[];
  searchQuery: string;
  pendingChanges: Map<Id<"exercises">, ProgressStatus | null>;
  onStatusChange: (
    exerciseId: Id<"exercises">,
    status: ProgressStatus | null,
  ) => void;
  disabled?: boolean;
}

function ExerciseList({
  exercises,
  filteredExercises,
  searchQuery,
  pendingChanges,
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
        const originalStatus = exercise.userProgress?.status ?? null;
        const hasPendingChange = pendingChanges.has(exercise._id);
        const selectedStatus = hasPendingChange
          ? (pendingChanges.get(exercise._id) ?? null)
          : originalStatus;
        const hasChanged =
          hasPendingChange && selectedStatus !== originalStatus;

        return (
          <ExerciseRow
            key={exercise._id}
            exercise={exercise}
            selectedStatus={selectedStatus}
            hasChanged={hasChanged}
            onStatusChange={(status) => onStatusChange(exercise._id, status)}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
}

interface BatchProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
  const batchDelete = useMutation(
    api.functions.userExerciseProgress.batchDeleteUserExerciseProgress,
  );

  const [pendingChanges, setPendingChanges] = useState<
    Map<Id<"exercises">, ProgressStatus | null>
  >(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const allExercisesMap = useMemo(
    () => (exercises ? buildExercisesMap(exercises) : new Map()),
    [exercises],
  );

  const filteredExercises = useMemo(() => {
    if (!exercises) return [];

    const all = flattenExercises(exercises);
    if (!searchQuery.trim()) return all;

    const query = searchQuery.toLowerCase().trim();
    return all.filter(
      (exercise) =>
        exercise.title.toLowerCase().includes(query) ||
        exercise.description.toLowerCase().includes(query),
    );
  }, [exercises, searchQuery]);

  const handleStatusChange = (
    exerciseId: Id<"exercises">,
    status: ProgressStatus | null,
  ) => {
    const exercise = allExercisesMap.get(exerciseId);
    const originalStatus = exercise?.userProgress?.status ?? null;

    setPendingChanges((prev) => {
      const next = new Map(prev);
      if (status === originalStatus) {
        next.delete(exerciseId);
      } else {
        next.set(exerciseId, status);
      }
      return next;
    });
  };

  const { updates, deletions } = useMemo(() => {
    const updates: { exerciseId: Id<"exercises">; status: ProgressStatus }[] =
      [];
    const deletions: Id<"exercises">[] = [];

    for (const [exerciseId, status] of pendingChanges.entries()) {
      const exercise = allExercisesMap.get(exerciseId);
      const originalStatus = exercise?.userProgress?.status ?? null;

      if (status === null && originalStatus !== null) {
        deletions.push(exerciseId);
      } else if (status !== null) {
        updates.push({ exerciseId, status });
      }
    }

    return { updates, deletions };
  }, [pendingChanges, allExercisesMap]);

  const changeCount = updates.length + deletions.length;

  const handleSubmit = async () => {
    if (changeCount === 0) {
      toast.error("Please select at least one exercise status");
      return;
    }

    setIsUpdating(true);
    try {
      const [updateCount, deleteCount] = await Promise.all([
        updates.length > 0 ? batchUpdate({ updates }) : 0,
        deletions.length > 0 ? batchDelete({ exerciseIds: deletions }) : 0,
      ]);

      const totalCount = updateCount + deleteCount;
      toast.success(
        `Successfully updated progress for ${totalCount} exercise${totalCount !== 1 ? "s" : ""}`,
      );
      setPendingChanges(new Map());
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
      setPendingChanges(new Map());
      setSearchQuery("");
      onOpenChange(false);
    }
  };

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
          <ExerciseSearch value={searchQuery} onChange={setSearchQuery} />

          <ExerciseList
            exercises={exercises}
            filteredExercises={filteredExercises}
            searchQuery={searchQuery}
            pendingChanges={pendingChanges}
            onStatusChange={handleStatusChange}
            disabled={isUpdating}
          />
        </div>

        <DialogFooter>
          <div className="flex w-full items-center justify-between">
            <span className="text-muted-foreground text-sm">
              {changeCount > 0
                ? `${changeCount} exercise${changeCount !== 1 ? "s" : ""} selected`
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
                disabled={isUpdating || changeCount === 0}
              >
                {isUpdating
                  ? "Updating..."
                  : `Update ${changeCount} Exercise${changeCount !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

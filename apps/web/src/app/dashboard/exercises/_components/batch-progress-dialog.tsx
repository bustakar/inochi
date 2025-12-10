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

import {
  Badge,
  Button,
  Checkbox,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
  ToggleGroup,
  ToggleGroupItem,
} from "@inochi/ui";

import {
  exerciseLevelColors,
  exerciseLevels,
  getProgressStatusColor,
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

function buildExercisesMap(
  exercises: Exercise[],
): Map<Id<"exercises">, Exercise> {
  const map = new Map<Id<"exercises">, Exercise>();
  for (const exercise of exercises) {
    map.set(exercise._id, exercise);
  }
  return map;
}

function getStatusValue(
  status: ProgressStatus | null | undefined,
): string | undefined {
  if (status === undefined) return undefined;
  return status ?? "none";
}

function parseStatusValue(value: string | undefined): ProgressStatus | null {
  if (!value || value === "none") return null;
  return value as ProgressStatus;
}

interface ProgressUpdates {
  updates: { exerciseId: Id<"exercises">; status: ProgressStatus }[];
  deletions: Id<"exercises">[];
}

function buildProgressUpdates(
  selectedExercises: Set<Id<"exercises">>,
  selectedStatus: ProgressStatus | null,
  allExercisesMap: Map<Id<"exercises">, Exercise>,
): ProgressUpdates {
  const updates: { exerciseId: Id<"exercises">; status: ProgressStatus }[] = [];
  const deletions: Id<"exercises">[] = [];

  for (const exerciseId of selectedExercises) {
    const exercise = allExercisesMap.get(exerciseId);
    const originalStatus: ProgressStatus | null =
      exercise?.userProgress?.status ?? null;

    if (selectedStatus === null && originalStatus !== null) {
      deletions.push(exerciseId);
    } else if (selectedStatus !== null) {
      updates.push({ exerciseId, status: selectedStatus });
    }
  }

  return { updates, deletions };
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
  isSelected: boolean;
  onToggleSelect: () => void;
  disabled?: boolean;
}

function ExerciseRow({
  exercise,
  isSelected,
  onToggleSelect,
  disabled,
}: ExerciseRowProps) {
  const currentStatus = exercise.userProgress?.status ?? null;

  return (
    <div
      className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 p-4 transition-all"
      onClick={(e) => {
        // Prevent double-toggling when clicking directly on checkbox
        if ((e.target as HTMLElement).closest('[role="checkbox"]')) {
          return;
        }
        if (!disabled) {
          onToggleSelect();
        }
      }}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggleSelect}
        disabled={disabled}
        aria-label={`Select ${exercise.title}`}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1 pl-2">
        <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-4">
          <h4 className="text-sm font-medium">{exercise.title}</h4>
          <div className="flex items-center gap-4">
            <Badge className={exerciseLevelColors[exercise.level]}>
              {exercise.level}
            </Badge>
            {currentStatus && (
              <Badge
                className={cn("text-xs", getProgressStatusColor(currentStatus))}
              >
                {getProgressStatusLabel(currentStatus)}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-muted-foreground line-clamp-1 text-xs">
          {exercise.description}
        </p>
      </div>
    </div>
  );
}

interface ExerciseListProps {
  exercises: Exercise[] | undefined;
  filteredExercises: Exercise[];
  searchQuery: string;
  selectedExercises: Set<Id<"exercises">>;
  onToggleSelect: (exerciseId: Id<"exercises">) => void;
  disabled?: boolean;
}

function ExerciseList({
  exercises,
  filteredExercises,
  searchQuery,
  selectedExercises,
  onToggleSelect,
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
      {filteredExercises.map((exercise) => (
        <ExerciseRow
          key={exercise._id}
          exercise={exercise}
          isSelected={selectedExercises.has(exercise._id)}
          onToggleSelect={() => onToggleSelect(exercise._id)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

interface StatusSelectorProps {
  value: ProgressStatus | null | undefined;
  onValueChange: (value: ProgressStatus | null) => void;
  disabled?: boolean;
}

function StatusSelector({
  value,
  onValueChange,
  disabled,
}: StatusSelectorProps) {
  const statusValue = getStatusValue(value);

  const handleValueChange = (newValue: string | undefined) => {
    onValueChange(parseStatusValue(newValue));
  };

  return (
    <>
      {/* Select dropdown for small devices */}
      <Select
        value={statusValue}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full lg:hidden">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Not Started</SelectItem>
          {progressStatuses.map((status) => (
            <SelectItem key={status} value={status}>
              {getProgressStatusLabel(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* ToggleGroup for larger devices */}
      <ToggleGroup
        type="single"
        value={statusValue}
        onValueChange={handleValueChange}
        disabled={disabled}
        variant="outline"
        size="sm"
        className="hidden lg:flex"
      >
        <ToggleGroupItem value="none" aria-label="Not Started">
          Not Started
        </ToggleGroupItem>
        {progressStatuses.map((status) => (
          <ToggleGroupItem
            key={status}
            value={status}
            aria-label={getProgressStatusLabel(status)}
          >
            {getProgressStatusLabel(status)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </>
  );
}

interface BatchProgressDialogFooterProps {
  selectedCount: number;
  selectedStatus: ProgressStatus | null | undefined;
  isUpdating: boolean;
  onStatusChange: (status: ProgressStatus | null) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

function BatchProgressDialogFooter({
  selectedCount,
  selectedStatus,
  isUpdating,
  onStatusChange,
  onCancel,
  onSubmit,
}: BatchProgressDialogFooterProps) {
  const canSubmit =
    !isUpdating && selectedCount > 0 && selectedStatus !== undefined;

  return (
    <DialogFooter>
      <div className="flex w-full flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground text-sm">
            {selectedCount > 0
              ? `${selectedCount} exercise${selectedCount !== 1 ? "s" : ""} selected`
              : "No exercises selected"}
          </span>
          <StatusSelector
            value={selectedStatus}
            onValueChange={onStatusChange}
            disabled={isUpdating}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit}>
            {isUpdating
              ? "Updating..."
              : `Update ${selectedCount} Exercise${selectedCount !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </div>
    </DialogFooter>
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

  const [selectedExercises, setSelectedExercises] = useState<
    Set<Id<"exercises">>
  >(new Set());
  const [selectedStatus, setSelectedStatus] = useState<
    ProgressStatus | null | undefined
  >(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const allExercisesMap = useMemo(
    () =>
      exercises
        ? buildExercisesMap(exercises)
        : new Map<Id<"exercises">, Exercise>(),
    [exercises],
  );

  const filteredExercises = useMemo(() => {
    if (!exercises) return [];

    if (!searchQuery.trim()) return exercises;

    const query = searchQuery.toLowerCase().trim();
    return exercises.filter(
      (exercise) =>
        exercise.title.toLowerCase().includes(query) ||
        exercise.description.toLowerCase().includes(query),
    );
  }, [exercises, searchQuery]);

  const handleToggleSelect = (exerciseId: Id<"exercises">) => {
    setSelectedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedExercises.size === 0) {
      toast("Select at least one exercise");
      return;
    }

    if (selectedStatus === undefined) {
      toast("Select a progress status");
      return;
    }

    setIsUpdating(true);
    try {
      const { updates, deletions } = buildProgressUpdates(
        selectedExercises,
        selectedStatus,
        allExercisesMap,
      );

      const [updateCount, deleteCount] = await Promise.all([
        updates.length > 0 ? batchUpdate({ updates }) : 0,
        deletions.length > 0 ? batchDelete({ exerciseIds: deletions }) : 0,
      ]);

      const totalCount = updateCount + deleteCount;
      toast(
        `Progress updated for ${totalCount} exercise${totalCount !== 1 ? "s" : ""}`,
      );
      setSelectedExercises(new Set());
      setSelectedStatus(undefined);
    } catch (error) {
      toast("Failed to update progress");
      console.error("Error updating progress:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    if (!isUpdating) {
      setSelectedExercises(new Set());
      setSelectedStatus(undefined);
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
            Select exercises and choose a progress status to apply to all
            selected exercises.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <ExerciseSearch value={searchQuery} onChange={setSearchQuery} />

          <ExerciseList
            exercises={exercises}
            filteredExercises={filteredExercises}
            searchQuery={searchQuery}
            selectedExercises={selectedExercises}
            onToggleSelect={handleToggleSelect}
            disabled={isUpdating}
          />
        </div>

        <BatchProgressDialogFooter
          selectedCount={selectedExercises.size}
          selectedStatus={selectedStatus}
          isUpdating={isUpdating}
          onStatusChange={setSelectedStatus}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

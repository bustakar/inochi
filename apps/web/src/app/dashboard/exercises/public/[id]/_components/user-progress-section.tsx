"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { ProgressStatus } from "@packages/backend/convex/validators/validators";
import * as React from "react";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";

import {
  cn,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@inochi/ui";

import {
  getProgressStatusColor,
  getProgressStatusLabel,
  progressStatuses,
} from "../../../../../../utils/exercise-utils";

function getStatusValue(
  status: ProgressStatus | null | undefined,
): string | undefined {
  if (status === undefined) return undefined;
  return status === null ? "none" : status;
}

function parseStatusValue(value: string | undefined): ProgressStatus | null {
  if (!value || value === "none") return null;
  return value as ProgressStatus;
}

interface UserProgressSectionProps {
  exerciseId: Id<"exercises">;
  userProgress: { status: ProgressStatus } | null;
}

export function UserProgressSection({
  exerciseId,
  userProgress,
}: UserProgressSectionProps) {
  const updateProgress = useMutation(
    api.functions.userExerciseProgress.updateUserExerciseProgress,
  );
  const deleteProgress = useMutation(
    api.functions.userExerciseProgress.batchDeleteUserExerciseProgress,
  );

  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleStatusChange = async (value: string | undefined) => {
    if (isUpdating) return;

    const newStatus = parseStatusValue(value);
    const currentStatus = userProgress?.status ?? null;

    setIsUpdating(true);
    try {
      if (newStatus === null && currentStatus !== null) {
        await deleteProgress({ exerciseIds: [exerciseId] });
        toast("Progress removed");
      } else if (newStatus !== null) {
        await updateProgress({
          exerciseId,
          status: newStatus,
        });
        toast(`Progress updated`);
      }
    } catch (error) {
      toast("Failed to update progress. Please try again.");
      console.error("Error updating progress:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStatus = userProgress?.status ?? null;
  const statusValue = getStatusValue(currentStatus);
  const triggerColorClass = currentStatus
    ? getProgressStatusColor(currentStatus)
    : "text-muted-foreground";

  return (
    <div>
      <h2 className="text-foreground retro mb-4 text-lg font-semibold">
        Your Progress
      </h2>
      <div className="flex items-center gap-4">
        <Select
          value={statusValue}
          onValueChange={handleStatusChange}
          disabled={isUpdating}
        >
          <SelectTrigger className={cn("w-[240px]", triggerColorClass)}>
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
      </div>
    </div>
  );
}

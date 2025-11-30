"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { ProgressStatus } from "@packages/backend/convex/validators/validators";
import * as React from "react";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import {
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@inochi/ui";

import {
  getProgressStatusColor,
  getProgressStatusLabel,
  progressStatuses,
} from "../../../../../../utils/exercise-utils";

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

  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleStatusChange = async (newStatus: ProgressStatus) => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await updateProgress({
        exerciseId,
        status: newStatus,
      });
      toast.success(`Progress updated to ${getProgressStatusLabel(newStatus)}`);
    } catch (error) {
      toast.error("Failed to update progress. Please try again.");
      console.error("Error updating progress:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStatus = userProgress?.status ?? null;

  return (
    <div>
      <h2 className="text-foreground mb-4 text-lg font-semibold">
        Your Progress
      </h2>
      <div className="flex items-center gap-4">
        {currentStatus ? (
          <Badge className={getProgressStatusColor(currentStatus)}>
            {getProgressStatusLabel(currentStatus)}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Not Started
          </Badge>
        )}
        <Select
          value={currentStatus ?? undefined}
          onValueChange={async (value) => {
            await handleStatusChange(value as ProgressStatus);
          }}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
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

"use client";

import { Doc } from "@packages/backend/convex/_generated/dataModel";
import { CheckCircle, Clock, XCircle } from "lucide-react";

import { Badge } from "@inochi/ui";

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface SubmissionHeaderProps {
  submission: Doc<"user_submissions">;
}

const statusConfig: Record<
  "pending" | "approved" | "rejected",
  { label: string; className: string; icon: typeof Clock }
> = {
  pending: {
    label: "Pending Review",
    className:
      "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    className:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    icon: XCircle,
  },
};

const typeConfig: Record<
  "create" | "edit",
  { label: string; className: string }
> = {
  create: {
    label: "New Exercise",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  edit: {
    label: "Edit Suggestion",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
};

export function SubmissionHeader({ submission }: SubmissionHeaderProps) {
  const statusInfo = statusConfig[submission.status];
  const StatusIcon = statusInfo.icon;
  const typeInfo = typeConfig[submission.submissionType];

  const exerciseTitle =
    submission.originalExerciseData?.exercise.title ?? "Untitled Exercise";

  return (
    <div className="space-y-4">
      {/* Title and badges */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-foreground text-2xl font-bold sm:text-3xl">
            {exerciseTitle}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={typeInfo.className}>{typeInfo.label}</Badge>
            <Badge className={statusInfo.className} variant="outline">
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusInfo.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="text-muted-foreground space-y-1 text-sm">
        <p>
          <span className="font-medium">Submitted:</span>{" "}
          {formatDate(submission.submittedAt)}
        </p>
        {submission.reviewedAt && (
          <p>
            <span className="font-medium">Reviewed:</span>{" "}
            {formatDate(submission.reviewedAt)}
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { Doc } from "@packages/backend/convex/_generated/dataModel";
import { CheckCircle, Clock, XCircle } from "lucide-react";

import { Badge } from "@inochi/ui";

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "just now";
}

interface SubmissionCardProps {
  submission: Doc<"user_submissions">;
  showSubmitter?: boolean;
}

const statusConfig: Record<
  "pending" | "approved" | "rejected",
  { label: string; className: string; icon: typeof Clock }
> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    className: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
};

const typeConfig: Record<
  "create" | "edit",
  { label: string; className: string }
> = {
  create: {
    label: "New Exercise",
    className: "bg-blue-100 text-blue-800",
  },
  edit: {
    label: "Edit",
    className: "bg-purple-100 text-purple-800",
  },
};

export function SubmissionCard({
  submission,
  showSubmitter = false,
}: SubmissionCardProps) {
  const statusInfo = statusConfig[submission.status];
  const StatusIcon = statusInfo.icon;
  const typeInfo = typeConfig[submission.submissionType];

  const timeAgo = formatTimeAgo(submission.submittedAt);

  return (
    <div className="bg-card cursor-pointer rounded-lg border p-4 transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-card-foreground text-lg font-semibold">
              {submission.originalExerciseData?.exercise.title}
            </h3>
            <Badge className={typeInfo.className}>{typeInfo.label}</Badge>
            <Badge className={statusInfo.className} variant="outline">
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusInfo.label}
            </Badge>
          </div>
          {showSubmitter && (
            <p className="text-muted-foreground mb-2 text-xs">
              Submitted by: {submission.submittedBy}
            </p>
          )}
          {submission.submissionType === "edit" &&
            submission.originalExerciseData && (
              <p className="text-muted-foreground mb-2 text-sm">
                Edit suggestion for:{" "}
                <span className="font-medium">
                  {submission.originalExerciseData.exercise.title}
                </span>
              </p>
            )}
          <p className="text-muted-foreground mb-2 line-clamp-2 text-sm">
            {submission.originalExerciseData?.exercise.description}
          </p>
        </div>
      </div>

      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>Submitted {timeAgo}</span>
        {submission.rejectionReason && (
          <span className="text-red-600">
            Reason: {submission.rejectionReason}
          </span>
        )}
      </div>
    </div>
  );
}

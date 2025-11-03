"use client";

import { Badge } from "@inochi/ui";
import { Doc } from "@packages/backend/convex/_generated/dataModel";
import { Clock, CheckCircle, XCircle } from "lucide-react";

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
  submission: Doc<"user_submissions"> & {
    musclesData?: Array<Doc<"muscles">>;
    equipmentData?: Array<Doc<"equipment">>;
    originalSkillData?: {
      _id: Doc<"skills">["_id"];
      title: string;
    };
  };
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
    label: "New Skill",
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
    <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-card-foreground">
              {submission.title}
            </h3>
            <Badge className={typeInfo.className}>{typeInfo.label}</Badge>
            <Badge className={statusInfo.className} variant="outline">
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>
          {showSubmitter && (
            <p className="text-xs text-muted-foreground mb-2">
              Submitted by: {submission.submittedBy}
            </p>
          )}
          {submission.submissionType === "edit" &&
            submission.originalSkillData && (
              <p className="text-sm text-muted-foreground mb-2">
                Edit suggestion for:{" "}
                <span className="font-medium">
                  {submission.originalSkillData.title}
                </span>
              </p>
            )}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {submission.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
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

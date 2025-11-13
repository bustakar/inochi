"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/clerk-react";
import { api } from "@packages/backend/convex/_generated/api";
import { Doc, Id } from "@packages/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge, Button } from "@inochi/ui";

import { ApproveRejectButtons } from "../_components/approve-reject-buttons";
import { EditSubmissionDialog } from "../_components/edit-submission-dialog";
import {
  getClientRole,
  isClientAdminOrModerator,
} from "../../../../utils/roles";

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

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as Id<"user_submissions">;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { sessionClaims, isLoaded: isAuthLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();

  if (!isAuthLoaded || !isUserLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const userRole = getClientRole(sessionClaims);
  const isAdminOrModeratorResult = isClientAdminOrModerator(sessionClaims);

  const submission = useQuery(api.functions.submissions.getSubmission, {
    id: submissionId,
    userRole,
  });
  const deleteSubmission = useMutation(
    api.functions.submissions.deleteSubmission,
  );

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this submission? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await deleteSubmission({ id: submissionId, userRole });
      toast.success("Submission deleted successfully");
      router.push("/dashboard/submissions");
    } catch (error) {
      console.error("Error deleting submission:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete submission. Please try again.",
      );
    }
  };

  if (submission === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading submission...</p>
      </div>
    );
  }

  if (submission === null) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <p className="text-muted-foreground">Submission not found.</p>
        <Link href="/dashboard/submissions">
          <Button variant="outline">Back to Submissions</Button>
        </Link>
      </div>
    );
  }

  const statusInfo =
    statusConfig[submission.status as "pending" | "approved" | "rejected"];
  const StatusIcon = statusInfo.icon;
  const canEdit = submission.status === "pending";
  const canDelete =
    isAdminOrModeratorResult ||
    (submission.status === "pending" && submission.submittedBy === user?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/submissions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{submission.title}</h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge className={statusInfo.className} variant="outline">
                <StatusIcon className="mr-1 h-3 w-3" />
                {statusInfo.label}
              </Badge>
              <Badge variant="outline">
                {submission.submissionType === "create"
                  ? "New Exercise"
                  : "Edit"}
              </Badge>
              <span className="text-muted-foreground text-sm">
                Submitted {formatTimeAgo(submission.submittedAt)}
              </span>
            </div>
            {isAdminOrModeratorResult && (
              <p className="text-muted-foreground mt-1 text-xs">
                Submitted by: {submission.submittedBy}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {isAdminOrModeratorResult && submission.status === "pending" && (
            <ApproveRejectButtons
              submissionId={submissionId}
              userRole={userRole}
              currentStatus={submission.status}
              onSuccess={() => {
                // Refetch submission data
                router.refresh();
              }}
            />
          )}
          {canEdit && (
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Original Exercise Link (for edits) */}
      {submission.submissionType === "edit" &&
        submission.originalExerciseData && (
          <div className="bg-muted rounded-lg p-4">
            <p className="text-muted-foreground mb-1 text-sm">
              This is an edit suggestion for:
            </p>
            <Link
              href={`/dashboard/exercises/private/${submission.originalExerciseData._id}`}
              className="text-primary font-medium hover:underline"
            >
              {submission.originalExerciseData.title}
            </Link>
          </div>
        )}

      {/* Private Exercise Link (for submissions from private exercises) */}
      {submission.privateExerciseId && (
        <div className="bg-muted rounded-lg p-4">
          <p className="text-muted-foreground mb-1 text-sm">
            This submission is for a private exercise:
          </p>
          <Link
            href={`/dashboard/exercises/private/${submission.privateExerciseId}`}
            className="text-primary font-medium hover:underline"
          >
            View Private Exercise
          </Link>
        </div>
      )}

      {/* Review Info */}
      {submission.reviewedAt && (
        <div className="bg-muted rounded-lg p-4">
          <p className="mb-1 text-sm font-medium">Review Information</p>
          <p className="text-muted-foreground text-sm">
            Reviewed {formatTimeAgo(submission.reviewedAt)}
            {submission.reviewedBy && ` by ${submission.reviewedBy}`}
          </p>
          {submission.rejectionReason && (
            <div className="mt-2 rounded border border-red-200 bg-red-50 p-2">
              <p className="text-sm font-medium text-red-800">
                Rejection Reason:
              </p>
              <p className="text-sm text-red-700">
                {submission.rejectionReason}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Submission Details */}
      <div className="bg-card space-y-4 rounded-lg border p-6">
        <div>
          <h2 className="mb-2 text-lg font-semibold">Description</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {submission.description}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <h3 className="mb-1 text-sm font-medium">Level</h3>
            <Badge>{submission.level}</Badge>
          </div>
          <div>
            <h3 className="mb-1 text-sm font-medium">Difficulty</h3>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-2 rounded-full ${
                      i < submission.difficulty ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-muted-foreground text-sm">
                {submission.difficulty}/10
              </span>
            </div>
          </div>
          <div>
            <h3 className="mb-1 text-sm font-medium">Category</h3>
            <Badge>{submission.category}</Badge>
          </div>
        </div>

        {submission.musclesData && submission.musclesData.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium">Muscles</h3>
            <div className="flex flex-wrap gap-2">
              {submission.musclesData.map((muscle: Doc<"muscles">) => (
                <Badge key={muscle._id} variant="outline">
                  {muscle.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {submission.equipmentData && submission.equipmentData.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium">Equipment</h3>
            <div className="flex flex-wrap gap-2">
              {submission.equipmentData.map((equip: Doc<"equipment">) => (
                <Badge key={equip._id} variant="outline">
                  {equip.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {submission.embedded_videos &&
          submission.embedded_videos.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium">Video URLs</h3>
              <ul className="list-inside list-disc space-y-1">
                {submission.embedded_videos.map(
                  (url: string, index: number) => (
                    <li key={index}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-sm hover:underline"
                      >
                        {url}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

        {submission.tips && submission.tips.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium">Tips</h3>
            <ul className="list-inside list-disc space-y-1">
              {submission.tips.map((tip: string, index: number) => (
                <li key={index} className="text-muted-foreground text-sm">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {canEdit && (
        <EditSubmissionDialog
          submission={submission}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      )}
    </div>
  );
}

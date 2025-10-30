"use client";

import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@inochi/ui/Button";
import { Badge } from "@inochi/ui";
import {
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Doc } from "@packages/backend/convex/_generated/dataModel";
import { EditSubmissionDialog } from "../_components/edit-submission-dialog";

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

  const submission = useQuery(api.submissions.getSubmission, {
    id: submissionId,
  });
  const deleteSubmission = useMutation(api.submissions.deleteSubmission);

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this submission? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await deleteSubmission({ id: submissionId });
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
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-muted-foreground">Submission not found.</p>
        <Link href="/dashboard/submissions">
          <Button variant="outline">Back to Submissions</Button>
        </Link>
      </div>
    );
  }

  const statusInfo = statusConfig[submission.status];
  const StatusIcon = statusInfo.icon;
  const canEdit = submission.status === "pending";

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
            <div className="flex items-center gap-2 mt-2">
              <Badge className={statusInfo.className} variant="outline">
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusInfo.label}
              </Badge>
              <Badge variant="outline">
                {submission.submissionType === "create" ? "New Skill" : "Edit"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Submitted {formatTimeAgo(submission.submittedAt)}
              </span>
            </div>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Original Skill Link (for edits) */}
      {submission.submissionType === "edit" && submission.originalSkillData && (
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">
            This is an edit suggestion for:
          </p>
          <Link
            href={`/dashboard/skills?skill=${submission.originalSkillData._id}`}
            className="text-primary hover:underline font-medium"
          >
            {submission.originalSkillData.title}
          </Link>
        </div>
      )}

      {/* Review Info */}
      {submission.reviewedAt && (
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm font-medium mb-1">Review Information</p>
          <p className="text-sm text-muted-foreground">
            Reviewed {formatTimeAgo(submission.reviewedAt)}
            {submission.reviewedBy && ` by ${submission.reviewedBy}`}
          </p>
          {submission.rejectionReason && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
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
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Description</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {submission.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-1">Level</h3>
            <Badge>{submission.level}</Badge>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1">Difficulty</h3>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < submission.difficulty ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {submission.difficulty}/10
              </span>
            </div>
          </div>
        </div>

        {submission.musclesData && submission.musclesData.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Muscles</h3>
            <div className="flex flex-wrap gap-2">
              {submission.musclesData.map((muscle) => (
                <Badge key={muscle._id} variant="outline">
                  {muscle.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {submission.equipmentData && submission.equipmentData.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Equipment</h3>
            <div className="flex flex-wrap gap-2">
              {submission.equipmentData.map((equip) => (
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
              <h3 className="text-sm font-medium mb-2">Video URLs</h3>
              <ul className="list-disc list-inside space-y-1">
                {submission.embedded_videos.map((url, index) => (
                  <li key={index}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

        {submission.tips && submission.tips.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Tips</h3>
            <ul className="list-disc list-inside space-y-1">
              {submission.tips.map((tip, index) => (
                <li key={index} className="text-sm text-muted-foreground">
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

"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/clerk-react";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@inochi/ui";

import { ApproveRejectButtons } from "../_components/approve-reject-buttons";
import {
  getClientRole,
  isClientAdminOrModerator,
} from "../../../../utils/roles";
import { SubmissionExercisePreview } from "./_components/submission-exercise-preview";
import { SubmissionHeader } from "./_components/submission-header";
import { SubmissionVariantsPreview } from "./_components/submission-variants-preview";

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as Id<"user_submissions">;
  const { sessionClaims, isLoaded, userId } = useAuth();

  const userRole = getClientRole(sessionClaims);
  const isAdminOrMod = isClientAdminOrModerator(sessionClaims);

  const submission = useQuery(api.functions.submissions.getSubmission, {
    id: submissionId,
    userRole,
  });

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

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
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/submissions")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Submissions
        </Button>
      </div>
    );
  }

  // Check if user can view this submission
  const isOwner = submission.submittedBy === userId;
  if (!isOwner && !isAdminOrMod) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <p className="text-muted-foreground">
          You don&apos;t have permission to view this submission.
        </p>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/submissions")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Submissions
        </Button>
      </div>
    );
  }

  const exerciseData = submission.originalExerciseData?.exercise;
  const variantsData = submission.originalExerciseData?.variants ?? [];

  const handleApproveRejectSuccess = () => {
    router.push("/dashboard/submissions");
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/dashboard/submissions")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Submissions
      </Button>

      {/* Header with title, status, and metadata */}
      <SubmissionHeader submission={submission} />

      {/* Approve/Reject buttons for admins/moderators */}
      {isAdminOrMod && submission.status === "pending" && (
        <div className="flex justify-end">
          <ApproveRejectButtons
            submissionId={submissionId}
            userRole={userRole}
            currentStatus={submission.status}
            onSuccess={handleApproveRejectSuccess}
          />
        </div>
      )}

      {/* Exercise preview */}
      {exerciseData && <SubmissionExercisePreview exercise={exerciseData} />}

      {/* Variants preview */}
      {variantsData.length > 0 && (
        <SubmissionVariantsPreview variants={variantsData} />
      )}

      {/* Rejection reason if rejected */}
      {submission.status === "rejected" && submission.rejectionReason && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
          <h3 className="mb-2 font-semibold text-red-800 dark:text-red-200">
            Rejection Reason
          </h3>
          <p className="text-red-700 dark:text-red-300">
            {submission.rejectionReason}
          </p>
        </div>
      )}
    </div>
  );
}

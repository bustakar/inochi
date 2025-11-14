"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/clerk-react";
import { api } from "@packages/backend/convex/_generated/api";
import { Doc } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";

import { Roles } from "../../../types/globals";
import { getClientRole, isClientAdminOrModerator } from "../../../utils/roles";
import { SubmissionCard } from "./_components/submission-card";

type SubmissionStatus = "pending" | "approved" | "rejected" | undefined;

// ============================================================================
// Status Filter Tabs Component
// ============================================================================

interface StatusFilterTabsProps {
  statusFilter: SubmissionStatus;
  onStatusChange: (status: SubmissionStatus) => void;
}

function StatusFilterTabs({
  statusFilter,
  onStatusChange,
}: StatusFilterTabsProps) {
  return (
    <div className="flex gap-2 border-b">
      <button
        onClick={() => onStatusChange(undefined)}
        className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
          statusFilter === undefined
            ? "border-primary text-primary"
            : "text-muted-foreground hover:text-foreground border-transparent"
        }`}
      >
        All
      </button>
      <button
        onClick={() => onStatusChange("pending")}
        className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
          statusFilter === "pending"
            ? "border-primary text-primary"
            : "text-muted-foreground hover:text-foreground border-transparent"
        }`}
      >
        Pending
      </button>
      <button
        onClick={() => onStatusChange("approved")}
        className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
          statusFilter === "approved"
            ? "border-primary text-primary"
            : "text-muted-foreground hover:text-foreground border-transparent"
        }`}
      >
        Approved
      </button>
      <button
        onClick={() => onStatusChange("rejected")}
        className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
          statusFilter === "rejected"
            ? "border-primary text-primary"
            : "text-muted-foreground hover:text-foreground border-transparent"
        }`}
      >
        Rejected
      </button>
    </div>
  );
}

// ============================================================================
// Submissions List Component
// ============================================================================

interface SubmissionsListProps {
  statuses: SubmissionStatus[];
  userRole: Roles;
}

function SubmissionsList({ statuses, userRole }: SubmissionsListProps) {
  const router = useRouter();
  const queryStatuses: ("pending" | "approved" | "rejected")[] =
    statuses.length > 0
      ? (statuses as ("pending" | "approved" | "rejected")[])
      : ["pending", "approved", "rejected"];

  const submissions = useQuery(api.functions.submissions.getUserSubmissions, {
    statuses: queryStatuses,
    userRole,
  });

  const handleSubmissionClick = (submission: Doc<"user_submissions">) => {
    if (submission.originalExerciseId) {
      // Submissions are created from private exercises, so navigate to private exercise detail
      // The originalExerciseId can be either exercises or private_exercises, but
      // based on the createSubmission mutation, it's always a private_exercise
      router.push(
        `/dashboard/exercises/private/${submission.originalExerciseId}`,
      );
    }
  };

  if (submissions === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading submissions...</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <p className="text-muted-foreground">
          {statuses.length > 0
            ? `No ${statuses[0]} submissions found.`
            : "No submissions found."}
        </p>
      </div>
    );
  }

  const isAdminOrModerator = userRole === "admin" || userRole === "moderator";

  return (
    <div className="space-y-4">
      {submissions.map((submission: Doc<"user_submissions">) => (
        <div
          key={submission._id}
          onClick={() => handleSubmissionClick(submission)}
          className="cursor-pointer"
        >
          <SubmissionCard
            submission={submission}
            showSubmitter={isAdminOrModerator}
          />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Page Header Component
// ============================================================================

interface PageHeaderProps {
  isAdminOrModerator: boolean;
}

function PageHeader({ isAdminOrModerator }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-foreground text-3xl font-bold">
        {isAdminOrModerator ? "All Submissions" : "My Submissions"}
      </h1>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function SubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus>(undefined);
  const { sessionClaims, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const userRole = getClientRole(sessionClaims);
  const isAdminOrModeratorResult = isClientAdminOrModerator(sessionClaims);

  const statuses = statusFilter ? [statusFilter] : [];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader isAdminOrModerator={isAdminOrModeratorResult} />
      <StatusFilterTabs
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />
      <SubmissionsList statuses={statuses} userRole={userRole} />
    </div>
  );
}

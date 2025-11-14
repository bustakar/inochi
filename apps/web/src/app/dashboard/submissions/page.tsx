"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/clerk-react";
import { api } from "@packages/backend/convex/_generated/api";
import { Doc } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";

import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@inochi/ui";

import { Roles } from "../../../types/globals";
import { getClientRole, isClientAdminOrModerator } from "../../../utils/roles";
import { SubmissionCard } from "./_components/submission-card";

type SubmissionStatus = "pending" | "approved" | "rejected";

// ============================================================================
// Status Filter Dropdown Component
// ============================================================================

interface StatusFilterDropdownProps {
  selectedStatuses: SubmissionStatus[];
  onStatusChange: (statuses: SubmissionStatus[]) => void;
}

function StatusFilterDropdown({
  selectedStatuses,
  onStatusChange,
}: StatusFilterDropdownProps) {
  const allStatuses: SubmissionStatus[] = ["pending", "approved", "rejected"];

  const handleToggleStatus = (status: SubmissionStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={selectedStatuses.length > 0 ? "default" : "outline"}
          className="min-w-[140px]"
        >
          {selectedStatuses.length > 0
            ? selectedStatuses
                .map(
                  (status) => status.charAt(0).toUpperCase() + status.slice(1),
                )
                .join(" | ")
            : "None status"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {allStatuses.map((status) => (
          <DropdownMenuCheckboxItem
            key={status}
            checked={selectedStatuses.includes(status)}
            onCheckedChange={() => handleToggleStatus(status)}
            onSelect={(e) => e.preventDefault()}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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
    statuses.length > 0 ? statuses : ["pending", "approved", "rejected"];

  const submissions = useQuery(api.functions.submissions.getUserSubmissions, {
    statuses: queryStatuses,
    userRole,
  });

  const handleSubmissionClick = (submission: Doc<"user_submissions">) => {
    if (submission.originalExerciseId) {
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
            ? `No submissions found with selected status${statuses.length > 1 ? "es" : ""}.`
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
  selectedStatuses: SubmissionStatus[];
  onStatusChange: (statuses: SubmissionStatus[]) => void;
}

function PageHeader({
  isAdminOrModerator,
  selectedStatuses,
  onStatusChange,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-foreground text-3xl font-bold">
        {isAdminOrModerator ? "All Submissions" : "My Submissions"}
      </h1>
      <StatusFilterDropdown
        selectedStatuses={selectedStatuses}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function SubmissionsPage() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status") as SubmissionStatus | null;
  const [selectedStatuses, setSelectedStatuses] = useState<SubmissionStatus[]>(
    statusParam ? [statusParam] : ["pending"],
  );
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

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        isAdminOrModerator={isAdminOrModeratorResult}
        selectedStatuses={selectedStatuses}
        onStatusChange={setSelectedStatuses}
      />
      <SubmissionsList statuses={selectedStatuses} userRole={userRole} />
    </div>
  );
}

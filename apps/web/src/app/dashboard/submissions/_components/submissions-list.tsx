"use client";

import { api } from "@packages/backend/convex/_generated/api";
import type { Doc } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import Link from "next/link";
import { SubmissionCard } from "./submission-card";
import type { Roles } from "@/types/globals";

interface SubmissionsListProps {
  status?: "pending" | "approved" | "rejected";
  userRole: Roles;
}

export function SubmissionsList({
  status,
  userRole,
}: SubmissionsListProps) {
  const submissions = useQuery(api.functions.submissions.getUserSubmissions, {
    status,
    userRole,
  });

  if (submissions === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading submissions...</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-muted-foreground">
          {status ? `No ${status} submissions found.` : "No submissions found."}
        </p>
        <Link href="/dashboard/skills" className="text-primary hover:underline">
          Suggest a new skill
        </Link>
      </div>
    );
  }

  const isAdminOrModerator =
    userRole === "admin" || userRole === "moderator";

  return (
    <div className="space-y-4">
      {submissions.map((submission: Doc<"user_submissions">) => (
        <Link
          key={submission._id}
          href={`/dashboard/submissions/${submission._id}`}
          className="block"
        >
          <SubmissionCard
            submission={submission}
            showSubmitter={isAdminOrModerator}
          />
        </Link>
      ))}
    </div>
  );
}

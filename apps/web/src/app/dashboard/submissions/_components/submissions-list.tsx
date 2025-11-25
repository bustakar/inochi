"use client";

import Link from "next/link";
import { api } from "@packages/backend/convex/_generated/api";
import { Doc } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";

import { Roles } from "../../../../types/globals";
import { SubmissionCard } from "./submission-card";

type SubmissionStatus = "pending" | "approved" | "rejected";

interface SubmissionsListProps {
  statuses: SubmissionStatus[];
  userRole: Roles;
}

export function SubmissionsList({ statuses, userRole }: SubmissionsListProps) {
  const submissions = useQuery(api.functions.submissions.getUserSubmissions, {
    statuses,
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
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <p className="text-muted-foreground">
          {status ? `No ${status} submissions found.` : "No submissions found."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission: Doc<"user_submissions">) => (
        <Link
          key={submission._id}
          href={`/dashboard/submissions/${submission._id}`}
          className="block"
        >
          <SubmissionCard submission={submission} />
        </Link>
      ))}
    </div>
  );
}

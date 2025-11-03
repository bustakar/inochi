"use client";

import { api } from "@packages/backend/convex/_generated/api";
import { Doc } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import Link from "next/link";
import { SubmissionCard } from "./submission-card";

interface SubmissionsListProps {
  status?: "pending" | "approved" | "rejected";
}

export function SubmissionsList({ status }: SubmissionsListProps) {
  const submissions = useQuery(api.functions.submissions.getUserSubmissions, {
    status,
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

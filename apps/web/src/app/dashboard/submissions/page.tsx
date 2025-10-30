"use client";

import { useState } from "react";
import { SubmissionsList } from "./_components/submissions-list";

type SubmissionStatus = "pending" | "approved" | "rejected" | undefined;

export default function SubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus>(undefined);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Submissions</h1>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setStatusFilter(undefined)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            statusFilter === undefined
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter("pending")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            statusFilter === "pending"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setStatusFilter("approved")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            statusFilter === "approved"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setStatusFilter("rejected")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            statusFilter === "rejected"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Rejected
        </button>
      </div>

      {/* Submissions List */}
      <SubmissionsList status={statusFilter} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";

import { getClientRole, isClientAdminOrModerator } from "../../../utils/roles";
import { SubmissionsList } from "./_components/submissions-list";

type SubmissionStatus = "pending" | "approved" | "rejected" | undefined;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {isAdminOrModeratorResult ? "All Submissions" : "My Submissions"}
        </h1>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setStatusFilter(undefined)}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            statusFilter === undefined
              ? "border-primary text-primary"
              : "text-muted-foreground hover:text-foreground border-transparent"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter("pending")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            statusFilter === "pending"
              ? "border-primary text-primary"
              : "text-muted-foreground hover:text-foreground border-transparent"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setStatusFilter("approved")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            statusFilter === "approved"
              ? "border-primary text-primary"
              : "text-muted-foreground hover:text-foreground border-transparent"
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setStatusFilter("rejected")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            statusFilter === "rejected"
              ? "border-primary text-primary"
              : "text-muted-foreground hover:text-foreground border-transparent"
          }`}
        >
          Rejected
        </button>
      </div>

      {/* Submissions List */}
      <SubmissionsList status={statusFilter} userRole={userRole} />
    </div>
  );
}

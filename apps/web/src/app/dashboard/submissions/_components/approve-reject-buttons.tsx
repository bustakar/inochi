"use client";

import { Button } from "@inochi/ui/Button";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@inochi/ui";
import { Textarea } from "@inochi/ui";

interface ApproveRejectButtonsProps {
  submissionId: Id<"user_submissions">;
  userRole: "admin" | "moderator" | "user";
  currentStatus: "pending" | "approved" | "rejected";
  onSuccess?: () => void;
}

export function ApproveRejectButtons({
  submissionId,
  userRole,
  currentStatus,
  onSuccess,
}: ApproveRejectButtonsProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const approveSubmission = useMutation(
    api.functions.submissions.approveSubmission,
  );
  const rejectSubmission = useMutation(
    api.functions.submissions.rejectSubmission,
  );

  const isAdminOrModerator = userRole === "admin" || userRole === "moderator";
  const canApproveReject = isAdminOrModerator && currentStatus === "pending";

  if (!canApproveReject) {
    return null;
  }

  const handleApprove = async () => {
    if (
      !confirm(
        "Are you sure you want to approve this submission? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsProcessing(true);
    try {
      await approveSubmission({
        id: submissionId,
        userRole,
      });
      toast.success("Submission approved successfully");
      onSuccess?.();
    } catch (error) {
      console.error("Error approving submission:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to approve submission. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsProcessing(true);
    try {
      await rejectSubmission({
        id: submissionId,
        rejectionReason: rejectionReason.trim(),
        userRole,
      });
      toast.success("Submission rejected successfully");
      setRejectDialogOpen(false);
      setRejectionReason("");
      onSuccess?.();
    } catch (error) {
      console.error("Error rejecting submission:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to reject submission. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleApprove}
        disabled={isProcessing}
        className="bg-green-600 hover:bg-green-700"
      >
        <CheckCircle className="w-4 h-4 mr-2" />
        Approve
      </Button>
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <Button
          variant="destructive"
          onClick={() => setRejectDialogOpen(true)}
          disabled={isProcessing}
        >
          <XCircle className="w-4 h-4 mr-2" />
          Reject
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this submission. This will
              be visible to the submitter.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              Reject Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


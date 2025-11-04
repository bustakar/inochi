"use client";

import {
  ArrayInputField,
  BasicFormFields,
  CheckboxGroupField,
  skillFormSchema,
} from "@/components/forms";
import type { SkillFormData } from "@/components/forms";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@inochi/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@inochi/ui/Dialog";
import { Form } from "@inochi/ui/Form";
import { api } from "@packages/backend/convex/_generated/api";
import type { Doc } from "@packages/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

interface EditSubmissionDialogProps {
  submission: Doc<"user_submissions"> & {
    musclesData?: Doc<"muscles">[];
    equipmentData?: Doc<"equipment">[];
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================================================
// Custom Hook: Form Management
// ============================================================================

function useEditSubmissionForm(
  submission: Doc<"user_submissions">,
  open: boolean,
) {
  const updateSubmission = useMutation(
    api.functions.submissions.updateSubmission,
  );

  const form = useForm<SkillFormData>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: {
      title: submission.title,
      description: submission.description,
      level: submission.level,
      difficulty: submission.difficulty,
      muscles: submission.muscles,
      equipment: submission.equipment,
      embedded_videos: submission.embedded_videos,
      prerequisites: submission.prerequisites,
      variants: submission.variants,
      tips: submission.tips,
    },
  });

  // Reset form when submission changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        title: submission.title,
        description: submission.description,
        level: submission.level,
        difficulty: submission.difficulty,
        muscles: submission.muscles,
        equipment: submission.equipment,
        embedded_videos: submission.embedded_videos,
        prerequisites: submission.prerequisites,
        variants: submission.variants,
        tips: submission.tips,
      });
    }
  }, [submission._id, open, form, submission]);

  const onSubmit = async (data: SkillFormData) => {
    try {
      await updateSubmission({
        id: submission._id,
        title: data.title,
        description: data.description,
        level: data.level,
        difficulty: data.difficulty,
        muscles: data.muscles,
        equipment: data.equipment,
        embedded_videos: data.embedded_videos.filter((v) => v.trim() !== ""),
        prerequisites: data.prerequisites,
        variants: data.variants,
        tips: data.tips.filter((t) => t.trim() !== ""),
      });
      toast.success("Submission updated successfully!");
      return true;
    } catch (error) {
      console.error("Error updating submission:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update submission. Please try again.",
      );
      return false;
    }
  };

  return { form, onSubmit };
}

// ============================================================================
// Main Component
// ============================================================================

export function EditSubmissionDialog({
  submission,
  open,
  onOpenChange,
}: EditSubmissionDialogProps) {
  const muscles = useQuery(api.functions.skills.getMuscles, {});
  const equipment = useQuery(api.functions.skills.getEquipment, {});
  const skills = useQuery(api.functions.skills.getSkills, {});

  const { form, onSubmit } = useEditSubmissionForm(submission, open);

  const handleSubmit = async (data: SkillFormData) => {
    const success = await onSubmit(data);
    if (success) {
      onOpenChange(false);
    }
  };

  const prerequisites = form.watch("prerequisites");
  const variants = form.watch("variants");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Submission</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <BasicFormFields
              control={form.control}
              titleFieldName="title"
              descriptionFieldName="description"
              levelFieldName="level"
              difficultyFieldName="difficulty"
            />

            <CheckboxGroupField
              control={form.control}
              name="muscles"
              options={muscles}
              label="Muscles"
              description="Select the muscles targeted by this skill"
            />

            <CheckboxGroupField
              control={form.control}
              name="equipment"
              options={equipment}
              label="Equipment"
              description="Select the equipment needed for this skill"
            />

            <ArrayInputField
              control={form.control}
              name="embedded_videos"
              label="Embedded Videos (URLs)"
              placeholder="https://..."
              addButtonText="Add Video URL"
            />

            {skills && (
              <>
                <CheckboxGroupField
                  control={form.control}
                  name="prerequisites"
                  options={skills.map((s) => ({ _id: s._id, title: s.title }))}
                  label="Prerequisites"
                  description="Select skills that should be mastered before this one"
                  excludeIds={variants.map((id) => String(id))}
                />

                <CheckboxGroupField
                  control={form.control}
                  name="variants"
                  options={skills.map((s) => ({ _id: s._id, title: s.title }))}
                  label="Variants"
                  description="Select alternative versions of this skill"
                  excludeIds={prerequisites.map((id) => String(id))}
                />
              </>
            )}

            <ArrayInputField
              control={form.control}
              name="tips"
              label="Tips"
              placeholder="Tip..."
              addButtonText="Add Tip"
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Submission</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

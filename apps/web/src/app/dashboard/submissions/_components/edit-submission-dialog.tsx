"use client";

import { useEffect } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { api } from "@packages/backend/convex/_generated/api";
import { Doc } from "@packages/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@inochi/ui";

import type { ExerciseSubmissionFormData } from "../../../../types/exercise-submission-form-schema";
import {
  ArrayInputField,
  BasicFormFields,
  CheckboxGroupField,
} from "../../../../components/forms";
import { exerciseSubmissionFormSchema } from "../../../../types/exercise-submission-form-schema";

// ============================================================================
// Types
// ============================================================================

interface EditSubmissionDialogProps {
  submission: Doc<"user_submissions"> & {
    musclesData?: Array<Doc<"muscles">>;
    equipmentData?: Array<Doc<"equipment">>;
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

  const form = useForm<ExerciseSubmissionFormData>({
    resolver: standardSchemaResolver(exerciseSubmissionFormSchema),
    defaultValues: {
      title: submission.title,
      description: submission.description,
      level: submission.level,
      difficulty: submission.difficulty,
      category: submission.category,
      muscles: submission.muscles,
      equipment: submission.equipment,
      embedded_videos: submission.embedded_videos,
      prerequisites: submission.prerequisites,
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
        category: submission.category,
        muscles: submission.muscles,
        equipment: submission.equipment,
        embedded_videos: submission.embedded_videos,
        prerequisites: submission.prerequisites,
        tips: submission.tips,
      });
    }
  }, [submission._id, open, form, submission]);

  const onSubmit = async (data: ExerciseSubmissionFormData) => {
    try {
      await updateSubmission({
        id: submission._id,
        title: data.title,
        description: data.description,
        level: data.level,
        difficulty: data.difficulty,
        category: data.category,
        muscles: data.muscles,
        equipment: data.equipment,
        embedded_videos: data.embedded_videos.filter(
          (v: string) => v.trim() !== "",
        ),
        prerequisites: data.prerequisites,
        tips: data.tips.filter((t: string) => t.trim() !== ""),
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
  const muscles = useQuery(api.functions.exercises.getMuscles, {});
  const equipment = useQuery(api.functions.exercises.getEquipment, {});
  const exercises = useQuery(api.functions.exercises.getPrivateExercises, {});

  const { form, onSubmit } = useEditSubmissionForm(submission, open);

  const handleSubmit = async (data: ExerciseSubmissionFormData) => {
    const success = await onSubmit(data);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Submission</DialogTitle>
        </DialogHeader>
        <Form {...(form as any)}>
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
            <FormField
              control={form.control as any}
              name="category"
              render={({ field, fieldState }) => (
                <FormItem>
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel>Category</FieldLabel>
                    <FieldContent>
                      <FormControl>
                        <select
                          {...field}
                          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="calisthenics">Calisthenics</option>
                          <option value="gym">Gym</option>
                          <option value="stretch">Stretch</option>
                          <option value="mobility">Mobility</option>
                        </select>
                      </FormControl>
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                    </FieldContent>
                  </Field>
                </FormItem>
              )}
            />

            <CheckboxGroupField
              control={form.control}
              name="muscles"
              options={muscles}
              label="Muscles"
              description="Select the muscles targeted by this exercise"
            />

            <CheckboxGroupField
              control={form.control}
              name="equipment"
              options={equipment}
              label="Equipment"
              description="Select the equipment needed for this exercise"
            />

            <ArrayInputField
              control={form.control}
              name="embedded_videos"
              label="Embedded Videos (URLs)"
              placeholder="https://..."
              addButtonText="Add Video URL"
            />

            {exercises && (
              <CheckboxGroupField
                control={form.control}
                name="prerequisites"
                options={exercises.map((e) => ({
                  _id: e._id,
                  title: e.title,
                }))}
                label="Prerequisites"
                description="Select exercises that should be mastered before this one"
              />
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

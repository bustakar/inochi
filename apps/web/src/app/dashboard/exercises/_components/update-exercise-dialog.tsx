"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import * as React from "react";
import { api } from "@packages/backend/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@inochi/ui";

import type { ExerciseFormData } from "./exercise-form";
import {
  ExerciseForm,
  ExerciseFormFields,
  exerciseFormSchema,
  useAppForm,
} from "./exercise-form";

// ============================================================================
// Update Exercise Dialog Component
// ============================================================================

interface UpdateExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseId: Id<"private_exercises">;
}

export function UpdateExerciseDialog({
  open,
  onOpenChange,
  exerciseId,
}: UpdateExerciseDialogProps) {
  const updatePrivateExercise = useMutation(
    api.functions.exercises.updatePrivateExercise,
  );
  const muscles = useQuery(api.functions.exercises.getMuscles, {});
  const privateExercises = useQuery(
    api.functions.exercises.getPrivateExercises,
    {},
  );
  const exercise = useQuery(api.functions.exercises.getPrivateExerciseById, {
    exerciseId,
  });
  const generateExerciseData = useAction(
    api.functions.openai.generateExerciseData,
  );
  const [isGenerating, setIsGenerating] = React.useState(false);

  const form = useAppForm({
    defaultValues: {
      title: exercise?.title ?? "",
      description: exercise?.description ?? "",
      level: exercise?.level ?? "beginner",
      difficulty: exercise?.difficulty ?? 1,
      category: exercise?.category ?? "calisthenics",
      muscles:
        exercise?.muscles.map((m) => ({
          muscleId: m._id as string,
          role: m.role ?? "primary",
        })) ?? [],
      prerequisites: exercise?.prerequisites.map((p) => p._id as string) ?? [],
    },
    validators: {
      onSubmit: exerciseFormSchema,
    },
    onSubmit: async ({ value }: { value: ExerciseFormData }) => {
      await onSubmit(value);
    },
  });

  const handleFillWithAI = async () => {
    const exerciseName = form.state.values.title || exercise?.title;
    if (!exerciseName || exerciseName.trim() === "") {
      toast.error("Please enter an exercise name first");
      return;
    }

    setIsGenerating(true);
    try {
      const aiData = await generateExerciseData({
        exerciseName: exerciseName.trim(),
      });

      // Update form fields with AI data
      interface AIDataMuscle {
        muscleId: Id<"muscles">;
        role: "primary" | "secondary" | "tertiary" | "stabilizer";
      }
      const musclesData: ExerciseFormData["muscles"] = (
        aiData.muscles as AIDataMuscle[]
      ).map((m) => ({
        muscleId: m.muscleId as string,
        role: m.role,
      }));
      const prerequisitesData: ExerciseFormData["prerequisites"] =
        aiData.prerequisites as string[];

      form.setFieldValue("description", aiData.description as string);
      form.setFieldValue("level", aiData.level as ExerciseFormData["level"]);
      form.setFieldValue("difficulty", aiData.difficulty as number);
      form.setFieldValue(
        "category",
        aiData.category as ExerciseFormData["category"],
      );
      form.setFieldValue("muscles", musclesData);
      form.setFieldValue("prerequisites", prerequisitesData);

      toast.success("Exercise data filled with AI!");
    } catch (error) {
      console.error("Error generating exercise data:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate exercise data. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data: ExerciseFormData) => {
    try {
      await updatePrivateExercise({
        id: exerciseId,
        exerciseData: {
          title: data.title,
          description: data.description,
          level: data.level,
          difficulty: data.difficulty,
          category: data.category,
          muscles: data.muscles.map((m) => ({
            muscleId: m.muscleId as Id<"muscles">,
            role: m.role,
          })),
        },
      });
      toast.success("Exercise updated!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating exercise:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update exercise. Please try again.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Exercise</DialogTitle>
        </DialogHeader>
        <form
          id="exercise-form"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <ExerciseForm
            form={form}
            onFillWithAI={handleFillWithAI}
            isGenerating={isGenerating}
          />

          <DialogFooter className="flex w-full flex-row justify-between gap-2 sm:justify-between">
            <ExerciseFormFields
              form={form}
              muscles={
                muscles as
                  | { _id: Id<"muscles">; name: string; muscleGroup?: string }[]
                  | undefined
              }
              exercises={
                privateExercises?.map((ex) => ({
                  _id: ex._id,
                  title: ex.title,
                })) as
                  | { _id: Id<"private_exercises">; title: string }[]
                  | undefined
              }
            />
            <div className="flex flex-row gap-1">
              <Button
                type="submit"
                form="exercise-form"
                size="sm"
                className="shrink-0"
              >
                Update
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

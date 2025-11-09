"use client";

import * as React from "react";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { CopyPlus } from "lucide-react";
import { toast } from "sonner";

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Toggle,
} from "@inochi/ui";

import {
  ExerciseForm,
  ExerciseFormData,
  ExerciseFormFields,
  exerciseFormSchema,
  useAppForm,
} from "./exercise-form";

// ============================================================================
// Create Exercise Dialog Component
// ============================================================================

interface CreateExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateExerciseDialog({
  open,
  onOpenChange,
}: CreateExerciseDialogProps) {
  const createPrivateExercise = useMutation(
    api.functions.exercises.createPrivateExercise,
  );
  const muscles = useQuery(api.functions.skills.getMuscles, {});
  const privateExercises = useQuery(
    api.functions.exercises.getPrivateExercises,
    {},
  );
  const [createMore, setCreateMore] = React.useState(false);

  const form = useAppForm({
    defaultValues: {
      title: "",
      description: "",
      level: "beginner",
      difficulty: 1,
      category: "calisthenics",
      muscles: [],
      prerequisites: [],
    },
    validators: {
      onSubmit: exerciseFormSchema,
    },
    onSubmit: async ({ value }: { value: ExerciseFormData }) => {
      await onSubmit(value);
    },
  });

  const resetFormEffect = React.useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open]);

  const onSubmit = async (data: ExerciseFormData) => {
    try {
      await createPrivateExercise({
        data: {
          title: data.title,
          description: data.description,
          level: data.level,
          difficulty: data.difficulty,
          category: data.category,
          muscles: data.muscles as Id<"muscles">[],
          prerequisites: data.prerequisites as Id<"private_exercises">[],
        },
      });
      toast.success("Private exercise created!");
      form.reset();
      if (!createMore) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error creating exercise:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create exercise. Please try again.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>Create Exercise</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Exercise</DialogTitle>
        </DialogHeader>
        <form
          id="exercise-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <ExerciseForm
            form={form as any}
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

          <DialogFooter className="flex w-full flex-row justify-between gap-2 sm:justify-between">
            <ExerciseFormFields
              form={form as any}
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
              <Toggle
                pressed={createMore}
                onPressedChange={setCreateMore}
                aria-label="Create more"
                size="sm"
                variant="outline"
                className="data-[state=on]:bg-primary data-[state=on]:*:[svg]:stroke-white"
              >
                <CopyPlus />
              </Toggle>
              <Button
                type="submit"
                form="exercise-form"
                size="sm"
                className="shrink-0"
              >
                Create
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

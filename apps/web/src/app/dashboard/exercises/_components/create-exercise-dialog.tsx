"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { api } from "@packages/backend/convex/_generated/api";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import * as z from "zod";

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@inochi/ui";

// ============================================================================
// Types
// ============================================================================

const exerciseFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  level: z.enum(["beginner", "intermediate", "advanced", "expert", "elite"]),
  difficulty: z.number(),
  category: z.enum(["calisthenics", "gym", "stretch", "mobility"]),
});

type ExerciseFormData = z.infer<typeof exerciseFormSchema>;

// ============================================================================
// Form Components
// ============================================================================

const { fieldContext, formContext, useFieldContext } = createFormHookContexts();

function TitleField() {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>Title</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        placeholder="Push Up"
        autoComplete="off"
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

function DescriptionField() {
  const field = useFieldContext<string | undefined>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>Description</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value || ""}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value || undefined)}
        aria-invalid={isInvalid}
        placeholder="Push up variations"
        autoComplete="off"
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

function LevelField() {
  const field = useFieldContext<
    "beginner" | "intermediate" | "advanced" | "expert" | "elite" | undefined
  >();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>Level</FieldLabel>
      <Select
        name={field.name}
        value={field.state.value || ""}
        onValueChange={(value) =>
          field.handleChange(
            value as
              | "beginner"
              | "intermediate"
              | "advanced"
              | "expert"
              | "elite"
              | undefined,
          )
        }
        aria-invalid={isInvalid}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="beginner">Beginner</SelectItem>
          <SelectItem value="intermediate">Intermediate</SelectItem>
          <SelectItem value="advanced">Advanced</SelectItem>
          <SelectItem value="expert">Expert</SelectItem>
          <SelectItem value="elite">Elite</SelectItem>
        </SelectContent>
      </Select>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

function DifficultyField() {
  const field = useFieldContext<number | undefined>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>Difficulty</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        type="number"
        min="1"
        max="10"
        value={field.state.value?.toString() || ""}
        onBlur={field.handleBlur}
        onChange={(e) =>
          field.handleChange(
            e.target.value === "" ? undefined : parseInt(e.target.value, 10),
          )
        }
        aria-invalid={isInvalid}
        placeholder="1-10"
        autoComplete="off"
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TitleField,
    DescriptionField,
    LevelField,
    DifficultyField,
  },
  formComponents: {},
});

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
  const router = useRouter();
  const createPrivateExercise = useMutation(
    api.functions.exercises.createPrivateExercise,
  );

  const form = useAppForm({
    defaultValues: {
      title: "",
      description: "",
      level: "beginner",
      difficulty: 1,
      category: "calisthenics",
    },
    validators: {
      onSubmit: exerciseFormSchema,
    },
    onSubmit: async ({ value }: { value: ExerciseFormData }) => {
      await onSubmit(value);
    },
  });

  const onSubmit = async (data: ExerciseFormData) => {
    try {
      const exerciseId = await createPrivateExercise({
        data: data,
      });
      toast.success("Private exercise created!");
      onOpenChange(false);
      form.reset();
      router.push(`/dashboard/exercises/private/${exerciseId}/edit`);
    } catch (error) {
      console.error("Error creating exercise:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create exercise. Please try again.",
      );
    }
  };

  const onCancel = () => {
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>Create Exercise</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
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
          <FieldGroup>
            <form.AppField name="title" children={() => <TitleField />} />
            <form.AppField
              name="description"
              children={() => <DescriptionField />}
            />
            <form.AppField name="level" children={() => <LevelField />} />
            <form.AppField
              name="difficulty"
              children={() => <DifficultyField />}
            />
          </FieldGroup>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onCancel();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" form="exercise-form">
              Continue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@inochi/ui";

interface CreateSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

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
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>Description</FieldLabel>
      <InputGroup>
        <InputGroupTextarea
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder="Enter skill description..."
          rows={6}
          className="min-h-16 resize-none"
          aria-invalid={isInvalid}
        />
        <InputGroupAddon align="block-end">
          <InputGroupText className="tabular-nums">
            {field.state.value.length}/100 characters
          </InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

function LevelField() {
  const field = useFieldContext<
    "beginner" | "intermediate" | "advanced" | "expert" | "elite"
  >();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>Level</FieldLabel>
      <Select
        value={field.state.value}
        onValueChange={(value) =>
          field.handleChange(value as typeof field.state.value)
        }
      >
        <SelectTrigger
          id={field.name}
          aria-invalid={isInvalid}
          className="w-full"
        >
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
  const field = useFieldContext<number>();
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
        value={field.state.value.toString()}
        onBlur={field.handleBlur}
        onChange={(e) =>
          field.handleChange(
            e.target.value === "" ? 1 : parseInt(e.target.value, 10),
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

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  level: z.enum(["beginner", "intermediate", "advanced", "expert", "elite"], {
    error: "Level is required",
  }),
  difficulty: z
    .number()
    .min(1, "Difficulty must be at least 1")
    .max(10, "Difficulty must be at most 10"),
});

export type SkillFormData = z.output<typeof formSchema>;

export function CreateSkillDialog({
  open,
  onOpenChange,
}: CreateSkillDialogProps) {
  const router = useRouter();
  const createPrivateSkill = useMutation(
    api.functions.skills.createPrivateSkill,
  );

  const form = useAppForm({
    defaultValues: {
      title: "",
      description: "",
      level: "beginner" as
        | "beginner"
        | "intermediate"
        | "advanced"
        | "expert"
        | "elite",
      difficulty: 1,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  const onSubmit = async (data: SkillFormData) => {
    try {
      const skillId = await createPrivateSkill({
        data: data,
      });
      toast.success("Private skill created!");
      onOpenChange(false);
      form.reset();
      router.push(`/dashboard/skills/private/${skillId}`);
    } catch (error) {
      console.error("Error creating skill:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create skill. Please try again.",
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
        <Button>Create Skill</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Skill</DialogTitle>
        </DialogHeader>
        <form
          id="skill-form"
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
            <div className="grid grid-cols-2 gap-4">
              <form.AppField name="level" children={() => <LevelField />} />
              <form.AppField
                name="difficulty"
                children={() => <DifficultyField />}
              />
            </div>
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
            <Button type="submit" form="skill-form">
              Create Skill
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

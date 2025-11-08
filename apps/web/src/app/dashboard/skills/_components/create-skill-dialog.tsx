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
} from "@inochi/ui";

interface CreateSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TitleField,
  },
  formComponents: {},
});

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
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
      router.push(`/dashboard/skills/private/${skillId}/edit`);
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
              Continue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

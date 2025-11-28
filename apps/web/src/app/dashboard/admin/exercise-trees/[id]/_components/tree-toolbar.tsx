"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@packages/backend/convex/_generated/api";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { ArrowLeft, Eye, EyeOff, Save, Settings, Trash2 } from "lucide-react";
import * as z from "zod";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldError,
  FieldLabel,
  Input,
  Textarea,
} from "@inochi/ui";

// ============================================================================
// Form Schema and Types
// ============================================================================

const treeSettingsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

type TreeSettingsData = z.infer<typeof treeSettingsSchema>;

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
        placeholder="Exercise Tree Title"
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
      <Textarea
        id={field.name}
        name={field.name}
        value={field.state.value ?? ""}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value || undefined)}
        aria-invalid={isInvalid}
        placeholder="Optional description"
        rows={3}
        autoComplete="off"
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TitleField,
    DescriptionField,
  },
  formComponents: {},
});

// ============================================================================
// Tree Toolbar Component
// ============================================================================

interface TreeToolbarProps {
  treeId: Id<"exercise_trees">;
  title: string;
  description?: string;
  status: "draft" | "published";
  onSave: () => void;
  isSaving?: boolean;
}

export function TreeToolbar({
  treeId,
  title: initialTitle,
  description: initialDescription,
  status,
  onSave,
  isSaving = false,
}: TreeToolbarProps) {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const updateTree = useMutation(api.functions.exerciseTrees.update);
  const publishTree = useMutation(api.functions.exerciseTrees.publish);
  const unpublishTree = useMutation(api.functions.exerciseTrees.unpublish);
  const deleteTree = useMutation(api.functions.exerciseTrees.delete_);

  const form = useAppForm({
    defaultValues: {
      title: initialTitle,
      description: initialDescription,
    },
    validators: {
      onSubmit: treeSettingsSchema,
    },
    onSubmit: async ({ value }: { value: TreeSettingsData }) => {
      await updateTree({
        id: treeId,
        title: value.title,
        description: value.description,
      });
      setSettingsOpen(false);
    },
  });

  // Reset form when dialog opens or initial values change
  useEffect(() => {
    if (settingsOpen) {
      form.reset({
        title: initialTitle,
        description: initialDescription,
      });
    }
  }, [settingsOpen, initialTitle, initialDescription, form]);

  const handleTogglePublish = async () => {
    if (status === "draft") {
      await publishTree({ id: treeId });
    } else {
      await unpublishTree({ id: treeId });
    }
  };

  const handleDelete = async () => {
    await deleteTree({ id: treeId });
    router.push("/dashboard/admin/exercise-trees");
  };

  return (
    <div className="bg-background flex items-center gap-2 border-b p-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/dashboard/admin/exercise-trees")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="flex-1" />

      <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
        <Settings className="mr-2 h-4 w-4" />
        Settings
      </Button>

      <Button variant="outline" size="sm" onClick={handleTogglePublish}>
        {status === "published" ? (
          <>
            <EyeOff className="mr-2 h-4 w-4" />
            Unpublish
          </>
        ) : (
          <>
            <Eye className="mr-2 h-4 w-4" />
            Publish
          </>
        )}
      </Button>

      <Button variant="default" size="sm" onClick={onSave} disabled={isSaving}>
        <Save className="mr-2 h-4 w-4" />
        {isSaving ? "Saving..." : "Save"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setDeleteDialogOpen(true)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tree Settings</DialogTitle>
            <DialogDescription>
              Update the title and description of this exercise tree.
            </DialogDescription>
          </DialogHeader>
          <form
            id="tree-settings-form"
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit();
            }}
          >
            <div className="space-y-4 py-4">
              <form.AppField name="title" children={() => <TitleField />} />
              <form.AppField
                name="description"
                children={() => <DescriptionField />}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSettingsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" form="tree-settings-form">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tree</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this exercise tree? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

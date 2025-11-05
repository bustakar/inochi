"use client";

import { useCallback, useEffect, useState } from "react";
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
  DialogTrigger,
  Form,
} from "@inochi/ui";

import type { SkillFormData } from "../../../../types/skill-form-schema";
import {
  ArrayInputField,
  BasicFormFields,
  CheckboxGroupField,
} from "../../../../components/forms";
import { skillFormSchema } from "../../../../types/skill-form-schema";

// ============================================================================
// Types
// ============================================================================

interface CreateSkillDialogProps {
  mode?: "create" | "edit";
  existingSkill?: Doc<"skills"> & {
    musclesData?: Array<Doc<"muscles">>;
    equipmentData?: Array<Doc<"equipment">>;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// ============================================================================
// Custom Hook: Form Management
// ============================================================================

function useCreateSkillForm(
  isEditMode: boolean,
  existingSkill: Doc<"skills"> | undefined,
  open: boolean,
) {
  const createSubmission = useMutation(
    api.functions.submissions.createSubmission,
  );

  const form = useForm<SkillFormData>({
    resolver: standardSchemaResolver(skillFormSchema),
    defaultValues: {
      title: "",
      description: "",
      level: "beginner",
      difficulty: 1,
      muscles: [],
      equipment: [],
      embedded_videos: [],
      prerequisites: [],
      variants: [],
      tips: [],
    },
  });

  // Reset form when dialog opens/closes or edit mode changes
  useEffect(() => {
    if (!open) {
      // Reset to defaults when dialog closes
      form.reset({
        title: "",
        description: "",
        level: "beginner",
        difficulty: 1,
        muscles: [],
        equipment: [],
        embedded_videos: [],
        prerequisites: [],
        variants: [],
        tips: [],
      });
      return;
    }

    // Prefill form when editing
    if (isEditMode && existingSkill) {
      form.reset({
        title: existingSkill.title,
        description: existingSkill.description,
        level: existingSkill.level,
        difficulty: existingSkill.difficulty,
        muscles: existingSkill.muscles,
        equipment: existingSkill.equipment,
        embedded_videos: existingSkill.embedded_videos,
        prerequisites: existingSkill.prerequisites,
        variants: existingSkill.variants,
        tips: existingSkill.tips,
      });
    }
  }, [open, isEditMode, existingSkill?._id, form]);

  const onSubmit = async (data: SkillFormData) => {
    try {
      await createSubmission({
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
        submissionType: isEditMode ? "edit" : "create",
        originalSkillId: isEditMode ? existingSkill?._id : undefined,
      });
      toast.success(
        isEditMode
          ? "Edit suggestion submitted!"
          : "Skill suggestion submitted!",
      );
      return true;
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit suggestion. Please try again.",
      );
      return false;
    }
  };

  return { form, onSubmit };
}

// ============================================================================
// Main Component
// ============================================================================

export function CreateSkillDialog({
  mode = "create",
  existingSkill,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateSkillDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const muscles = useQuery(api.functions.skills.getMuscles, {});
  const equipment = useQuery(api.functions.skills.getEquipment, {});
  const skills = useQuery(api.functions.skills.getSkills, {});

  // Use controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (controlledOnOpenChange) {
        controlledOnOpenChange(newOpen);
      } else {
        setInternalOpen(newOpen);
      }
    },
    [controlledOnOpenChange],
  );

  const isEditMode = Boolean(mode === "edit" && existingSkill);
  const { form, onSubmit } = useCreateSkillForm(
    isEditMode,
    existingSkill,
    open,
  );

  const handleSubmit = async (data: SkillFormData) => {
    const success = await onSubmit(data);
    if (success) {
      handleOpenChange(false);
    }
  };

  const prerequisites = form.watch("prerequisites");
  const variants = form.watch("variants");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isEditMode && (
        <DialogTrigger asChild>
          <Button>Suggest Skill</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Suggest Skill Edit" : "Suggest New Skill"}
          </DialogTitle>
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
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isEditMode ? "Suggest Edit" : "Suggest Skill"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { api } from "@packages/backend/convex/_generated/api";
import { Doc, Id } from "@packages/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@inochi/ui/Dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@inochi/ui/Form";
import { Input } from "@inochi/ui/Input";
import { Textarea } from "@inochi/ui/Textarea";
import { Button } from "@inochi/ui/Button";
import { Label } from "@inochi/ui/Label";

interface CreateSkillFormData {
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced" | "expert" | "elite";
  difficulty: number;
  muscles: Id<"muscles">[];
  equipment: Id<"equipment">[];
  embedded_videos: string[];
  prerequisites: Id<"skills">[];
  variants: Id<"skills">[];
  tips: string[];
}

interface CreateSkillDialogProps {
  mode?: "create" | "edit";
  existingSkill?: Doc<"skills"> & {
    musclesData?: Array<Doc<"muscles">>;
    equipmentData?: Array<Doc<"equipment">>;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateSkillDialog({
  mode = "create",
  existingSkill,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateSkillDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const createSubmission = useMutation(api.submissions.createSubmission);
  const muscles = useQuery(api.skills.getMuscles, {});
  const equipment = useQuery(api.skills.getEquipment, {});
  const skills = useQuery(api.skills.getSkills, {});

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

  const isEditMode = mode === "edit" && existingSkill;

  const form = useForm<CreateSkillFormData>({
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

  // Prefill form when editing or when dialog opens
  useEffect(() => {
    if (open) {
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
      } else {
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
      }
    }
  }, [open, isEditMode, existingSkill, form]);

  const onSubmit = async (data: CreateSkillFormData) => {
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
      handleOpenChange(false);
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit suggestion. Please try again.",
      );
    }
  };

  const videos = form.watch("embedded_videos");
  const tips = form.watch("tips");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isEditMode && (
        <DialogTrigger asChild>
          <Button>Suggest Skill</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Suggest Skill Edit" : "Suggest New Skill"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Skill title" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Skill description"
                      rows={4}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                        <option value="elite">Elite</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty (1-10)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {muscles && (
              <FormField
                control={form.control}
                name="muscles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Muscles</FormLabel>
                    <FormControl>
                      <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                        {muscles.map(
                          (muscle: { _id: Id<"muscles">; name: string }) => (
                            <label
                              key={muscle._id}
                              className="flex items-center gap-2 text-sm cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={field.value.includes(muscle._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    field.onChange([
                                      ...field.value,
                                      muscle._id,
                                    ]);
                                  } else {
                                    field.onChange(
                                      field.value.filter(
                                        (id) => id !== muscle._id,
                                      ),
                                    );
                                  }
                                }}
                                className="rounded border-input"
                              />
                              <span>{muscle.name}</span>
                            </label>
                          ),
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {equipment && (
              <FormField
                control={form.control}
                name="equipment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipment</FormLabel>
                    <FormControl>
                      <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                        {equipment.map(
                          (equip: { _id: Id<"equipment">; name: string }) => (
                            <label
                              key={equip._id}
                              className="flex items-center gap-2 text-sm cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={field.value.includes(equip._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    field.onChange([...field.value, equip._id]);
                                  } else {
                                    field.onChange(
                                      field.value.filter(
                                        (id) => id !== equip._id,
                                      ),
                                    );
                                  }
                                }}
                                className="rounded border-input"
                              />
                              <span>{equip.name}</span>
                            </label>
                          ),
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="embedded_videos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Embedded Videos (URLs)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {videos.map((video, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={video}
                            onChange={(e) => {
                              const newVideos = [...videos];
                              newVideos[index] = e.target.value;
                              field.onChange(newVideos);
                            }}
                            placeholder="https://..."
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const newVideos = videos.filter(
                                (_, i) => i !== index,
                              );
                              field.onChange(newVideos);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          field.onChange([...videos, ""]);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Video URL
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {skills && (
              <>
                <FormField
                  control={form.control}
                  name="prerequisites"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prerequisites</FormLabel>
                      <FormControl>
                        <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                          {skills
                            .filter(
                              (s: { _id: Id<"skills"> }) =>
                                !form.watch("variants").includes(s._id),
                            )
                            .map(
                              (skill: { _id: Id<"skills">; title: string }) => (
                                <label
                                  key={skill._id}
                                  className="flex items-center gap-2 text-sm cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={field.value.includes(skill._id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        field.onChange([
                                          ...field.value,
                                          skill._id,
                                        ]);
                                      } else {
                                        field.onChange(
                                          field.value.filter(
                                            (id) => id !== skill._id,
                                          ),
                                        );
                                      }
                                    }}
                                    className="rounded border-input"
                                  />
                                  <span>{skill.title}</span>
                                </label>
                              ),
                            )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="variants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variants</FormLabel>
                      <FormControl>
                        <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                          {skills
                            .filter(
                              (s: { _id: Id<"skills"> }) =>
                                !form.watch("prerequisites").includes(s._id),
                            )
                            .map(
                              (skill: { _id: Id<"skills">; title: string }) => (
                                <label
                                  key={skill._id}
                                  className="flex items-center gap-2 text-sm cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={field.value.includes(skill._id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        field.onChange([
                                          ...field.value,
                                          skill._id,
                                        ]);
                                      } else {
                                        field.onChange(
                                          field.value.filter(
                                            (id) => id !== skill._id,
                                          ),
                                        );
                                      }
                                    }}
                                    className="rounded border-input"
                                  />
                                  <span>{skill.title}</span>
                                </label>
                              ),
                            )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="tips"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tips</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {tips.map((tip, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={tip}
                            onChange={(e) => {
                              const newTips = [...tips];
                              newTips[index] = e.target.value;
                              field.onChange(newTips);
                            }}
                            placeholder="Tip..."
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const newTips = tips.filter(
                                (_, i) => i !== index,
                              );
                              field.onChange(newTips);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          field.onChange([...tips, ""]);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Tip
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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

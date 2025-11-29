"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import * as React from "react";
import { api } from "@packages/backend/convex/_generated/api";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import {
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import * as z from "zod";

import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Label,
  Separator,
} from "@inochi/ui";

// ============================================================================
// Types
// ============================================================================

const tipV2Schema = z.object({
  text: z.string().min(1, "Tip text is required"),
  videoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  exerciseReference: z.string().optional(),
});

const variantFormSchema = z.object({
  equipment: z.array(z.string()),
  tipsV2: z.array(tipV2Schema), // New unified field
  overriddenTitle: z.union([z.string(), z.undefined()]),
  overriddenDescription: z.union([z.string(), z.undefined()]),
  overriddenDifficulty: z.union([z.number(), z.undefined()]),
});

interface VariantFormData {
  equipment: string[];
  tipsV2: {
    text: string;
    videoUrl?: string;
    exerciseReference?: string;
  }[];
  overriddenTitle: string | undefined;
  overriddenDescription: string | undefined;
  overriddenDifficulty: number | undefined;
}

interface Equipment {
  _id: Id<"equipment">;
  name: string;
  category: string;
}

// ============================================================================
// Form Components
// ============================================================================

const { fieldContext, formContext, useFieldContext } = createFormHookContexts();

function EquipmentField({ equipment }: { equipment: Equipment[] | undefined }) {
  const field = useFieldContext<string[] | undefined>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const selectedEquipmentIds = field.state.value ?? [];
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleToggleEquipment = (equipmentId: Id<"equipment">) => {
    const equipmentIdStr = equipmentId as string;
    const currentIds = selectedEquipmentIds;
    if (currentIds.includes(equipmentIdStr)) {
      field.handleChange(currentIds.filter((id) => id !== equipmentIdStr));
    } else {
      field.handleChange([...currentIds, equipmentIdStr]);
    }
  };

  // Filter equipment based on search query
  const filteredEquipment = React.useMemo(() => {
    if (!equipment) return [];
    if (!searchQuery.trim()) return equipment;

    const query = searchQuery.toLowerCase();
    return equipment.filter(
      (eq) =>
        eq.name.toLowerCase().includes(query) ||
        eq.category.toLowerCase().includes(query),
    );
  }, [equipment, searchQuery]);

  // Group equipment by category
  const groupedEquipment = React.useMemo(() => {
    if (!filteredEquipment.length) return new Map<string, Equipment[]>();

    const groups = new Map<string, Equipment[]>();
    for (const eq of filteredEquipment) {
      const category = eq.category || "Other";
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      const categoryGroup = groups.get(category);
      if (categoryGroup) {
        categoryGroup.push(eq);
      }
    }

    // Sort groups and equipment within groups
    const sortedGroups = new Map(
      Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b)),
    );
    for (const [category, categoryEquipment] of sortedGroups.entries()) {
      sortedGroups.set(
        category,
        categoryEquipment.sort((a, b) => a.name.localeCompare(b.name)),
      );
    }

    return sortedGroups;
  }, [filteredEquipment]);

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel>Equipment</FieldLabel>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant={selectedEquipmentIds.length > 0 ? "default" : "outline"}
            size="sm"
            aria-invalid={isInvalid}
            title={
              selectedEquipmentIds.length > 0
                ? `${selectedEquipmentIds.length} equipment selected`
                : "Select equipment"
            }
          >
            {selectedEquipmentIds.length > 0
              ? `${selectedEquipmentIds.length}`
              : "Equipment"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-96 w-80 overflow-y-auto md:w-96"
        >
          <div className="p-2">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
              <Input
                type="search"
                placeholder="Search equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                }}
                className="h-8 pl-8"
              />
            </div>
          </div>
          <DropdownMenuSeparator />
          <div className="space-y-1 p-1">
            {Array.from(groupedEquipment.entries()).map(
              ([category, categoryEquipment]) => (
                <div key={category} className="space-y-0.5">
                  <div className="bg-muted flex items-center gap-2 rounded-sm px-2 py-2">
                    <Label className="text-muted-foreground text-xs font-medium">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Label>
                  </div>
                  <div className="grid grid-cols-1 gap-0.5 md:grid-cols-2">
                    {categoryEquipment.map((eq) => (
                      <DropdownMenuCheckboxItem
                        key={eq._id}
                        checked={selectedEquipmentIds.includes(
                          eq._id as string,
                        )}
                        onCheckedChange={() => handleToggleEquipment(eq._id)}
                        onSelect={(e) => e.preventDefault()}
                        className="text-sm"
                      >
                        {eq.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                </div>
              ),
            )}
            {filteredEquipment.length === 0 && (
              <div className="text-muted-foreground px-2 py-4 text-center text-sm">
                {searchQuery.trim()
                  ? "No equipment found"
                  : "No equipment available"}
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

function TipV2Field() {
  const field =
    useFieldContext<
      { text: string; videoUrl?: string; exerciseReference?: string }[]
    >();
  const tips =
    field.state.value.length > 0 ? field.state.value : [{ text: "" }];
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const exercises = useQuery(api.functions.exercises.getPrivateExercises, {});
  const [searchQueries, setSearchQueries] = React.useState<
    Record<number, string>
  >({});

  const handleAdd = () => {
    field.handleChange([...tips, { text: "" }]);
  };

  const handleChange = (
    index: number,
    updates: Partial<{
      text: string;
      videoUrl?: string;
      exerciseReference?: string;
    }>,
  ) => {
    const newTips = [...tips];
    const currentTip = newTips[index] ?? { text: "" };
    newTips[index] = {
      ...currentTip,
      ...updates,
      text: updates.text ?? currentTip.text,
    };
    // Remove empty tips except the last one (if text is empty)
    const filtered = newTips.filter(
      (tip, i) => tip.text.trim() !== "" || i === newTips.length - 1,
    );
    field.handleChange(filtered.length > 0 ? filtered : [{ text: "" }]);
  };

  const handleRemove = (index: number) => {
    const newTips = tips.filter((_, i) => i !== index);
    field.handleChange(newTips.length > 0 ? newTips : [{ text: "" }]);
  };

  // Filter exercises based on search query for each tip
  const getFilteredExercises = (index: number) => {
    if (!exercises) return [];
    const searchQuery = searchQueries[index]?.toLowerCase() ?? "";
    if (!searchQuery.trim()) return exercises.slice(0, 10); // Limit to 10 without search

    return exercises
      .filter((ex) => ex.title.toLowerCase().includes(searchQuery))
      .slice(0, 10);
  };

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel>Tips</FieldLabel>
      <div className="space-y-3">
        {tips.map((tip, index) => {
          const filteredExercises = getFilteredExercises(index);
          const selectedExercise = exercises?.find(
            (ex) => ex._id === tip.exerciseReference,
          );

          return (
            <div
              key={index}
              className="bg-muted/30 space-y-2 rounded-lg border p-3"
            >
              <div className="flex items-start gap-2">
                <Input
                  value={tip.text}
                  onChange={(e) =>
                    handleChange(index, { text: e.target.value })
                  }
                  onBlur={field.handleBlur}
                  placeholder="Enter tip text..."
                  className="flex-1"
                  aria-invalid={isInvalid}
                />
                {tips.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="text-muted-foreground hover:text-destructive rounded-full p-1 transition-colors"
                    aria-label={`Remove tip ${index + 1}`}
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div className="relative">
                  <Input
                    type="url"
                    value={tip.videoUrl ?? ""}
                    onChange={(e) =>
                      handleChange(index, {
                        videoUrl: e.target.value || undefined,
                      })
                    }
                    placeholder="Video URL (optional)"
                    className="pr-8"
                  />
                  {tip.videoUrl && (
                    <LinkIcon className="text-muted-foreground absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2" />
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant={selectedExercise ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start"
                    >
                      {selectedExercise ? (
                        <>
                          <LinkIcon className="mr-2 h-4 w-4" />
                          {selectedExercise.title}
                        </>
                      ) : (
                        "Exercise reference (optional)"
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="max-h-96 w-80 overflow-y-auto md:w-96"
                  >
                    <div className="p-2">
                      <div className="relative">
                        <Search className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
                        <Input
                          type="search"
                          placeholder="Search exercises..."
                          value={searchQueries[index] ?? ""}
                          onChange={(e) =>
                            setSearchQueries({
                              ...searchQueries,
                              [index]: e.target.value,
                            })
                          }
                          onKeyDown={(e) => {
                            e.stopPropagation();
                          }}
                          className="h-8 pl-8"
                        />
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <div className="space-y-1 p-1">
                      {filteredExercises.length === 0 ? (
                        <div className="text-muted-foreground px-2 py-4 text-center text-sm">
                          {searchQueries[index]?.trim()
                            ? "No exercises found"
                            : "Start typing to search"}
                        </div>
                      ) : (
                        filteredExercises.map((exercise) => {
                          const isChecked =
                            exercise._id === tip.exerciseReference;

                          return (
                            <DropdownMenuCheckboxItem
                              key={exercise._id}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                handleChange(
                                  index,
                                  checked
                                    ? {
                                        exerciseReference: exercise._id,
                                      }
                                    : { exerciseReference: undefined },
                                );
                              }}
                              onSelect={(e) => e.preventDefault()}
                              className="text-sm"
                            >
                              {exercise.title}
                            </DropdownMenuCheckboxItem>
                          );
                        })
                      )}
                      {selectedExercise && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuCheckboxItem
                            checked={false}
                            onCheckedChange={() => {
                              handleChange(index, {
                                exerciseReference: undefined,
                              });
                            }}
                            onSelect={(e) => e.preventDefault()}
                            className="text-sm"
                          >
                            Clear selection
                          </DropdownMenuCheckboxItem>
                        </>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          className="w-full"
        >
          Add Tip
        </Button>
      </div>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

function ArrayStringField({
  label,
  placeholder,
  inputType = "text",
}: {
  label: string;
  placeholder: string;
  inputType?: "text" | "url";
}) {
  const field = useFieldContext<string[]>();
  const items = field.state.value.length > 0 ? field.state.value : [""];
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const _handleAdd = () => {
    field.handleChange([...items, ""]);
  };

  const handleAddAndFocus = (currentIndex: number) => {
    field.handleChange([...items, ""]);
    // Focus the newly added input after state update
    setTimeout(() => {
      const newIndex = currentIndex + 1;
      inputRefs.current[newIndex]?.focus();
    }, 0);
  };

  const handleChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    // Filter out empty strings except the last one
    const filtered = newItems.filter(
      (item, i) => item.trim() !== "" || i === newItems.length - 1,
    );
    field.handleChange(filtered.length > 0 ? filtered : [""]);
  };

  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    field.handleChange(newItems.length > 0 ? newItems : [""]);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddAndFocus(index);
    }
  };

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type={inputType}
              value={item}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onBlur={field.handleBlur}
              placeholder={placeholder}
              className="flex-1"
              aria-invalid={isInvalid}
            />
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-muted-foreground hover:text-destructive rounded-full p-1 transition-colors"
                aria-label={`Remove ${label} ${index + 1}`}
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

function OverriddenTitleField() {
  const field = useFieldContext<string | undefined>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>Title</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value ?? ""}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value || undefined)}
        aria-invalid={isInvalid}
        placeholder="Override exercise title"
        autoComplete="off"
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

function OverriddenDescriptionField() {
  const field = useFieldContext<string | undefined>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>Description</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value ?? ""}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value || undefined)}
        aria-invalid={isInvalid}
        placeholder="Override exercise description"
        autoComplete="off"
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

function OverriddenDifficultyField() {
  const field = useFieldContext<number | undefined>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const selectedValue = field.state.value?.toString() ?? "";

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel>Difficulty</FieldLabel>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-invalid={isInvalid}
            title={
              field.state.value
                ? `Difficulty ${field.state.value}`
                : "Select difficulty"
            }
          >
            {field.state.value ?? "Difficulty"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
            <DropdownMenuCheckboxItem
              key={num}
              checked={selectedValue === num.toString()}
              onCheckedChange={(checked) => {
                field.handleChange(checked ? num : undefined);
              }}
              onSelect={(e) => e.preventDefault()}
            >
              Difficulty {num}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    EquipmentField,
    TipV2Field,
    ArrayStringField,
    OverriddenTitleField,
    OverriddenDescriptionField,
    OverriddenDifficultyField,
  },
  formComponents: {},
});

// ============================================================================
// Create Variant Dialog Component
// ============================================================================

interface CreateVariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseId: Id<"private_exercises">;
  variantId?: string;
}

export function CreateVariantDialog({
  open,
  onOpenChange,
  exerciseId,
  variantId,
}: CreateVariantDialogProps) {
  const createVariant = useMutation(
    api.functions.exerciseVariants.createExerciseVariant,
  );
  const updateVariant = useMutation(
    api.functions.exerciseVariants.updateExerciseVariant,
  );
  const equipment = useQuery(api.functions.exercises.getEquipment, {});
  const variant = useQuery(api.functions.exerciseVariants.getExerciseVariants, {
    exerciseId,
  });

  const isEditing = !!variantId;
  const existingVariant = isEditing
    ? variant?.find((v) => v._id === variantId)
    : undefined;

  const [overridesOpen, setOverridesOpen] = React.useState(false);

  const form = useAppForm({
    defaultValues: {
      equipment: existingVariant?.equipment.map((eq) => eq._id as string) ?? [],
      tipsV2: existingVariant?.tips.length
        ? existingVariant.tips.map((tip) => ({
            text: tip.text,
            videoUrl: tip.videoUrl,
            exerciseReference: tip.exerciseReference?._id,
          }))
        : [{ text: "" }],
      overriddenTitle: existingVariant?.overriddenTitle,
      overriddenDescription: existingVariant?.overriddenDescription,
      overriddenDifficulty: existingVariant?.overriddenDifficulty,
    },
    validators: {
      onSubmit: variantFormSchema,
    },
    onSubmit: async ({ value }: { value: VariantFormData }) => {
      await onSubmit(value);
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset();
      setOverridesOpen(false);
    }
  }, [open, form]);

  const onSubmit = async (data: VariantFormData) => {
    try {
      // Filter out empty tips and normalize
      const tipsV2 = data.tipsV2
        .filter((tip) => tip.text.trim() !== "")
        .map((tip) => ({
          text: tip.text,
          videoUrl: tip.videoUrl?.trim() ?? undefined,
          exerciseReference: tip.exerciseReference?.trim()
            ? (tip.exerciseReference as
                | Id<"exercises">
                | Id<"private_exercises">)
            : undefined,
        }));

      if (isEditing && variantId) {
        await updateVariant({
          id: variantId,
          exerciseId: exerciseId,
          data: {
            exercise: exerciseId,
            equipment: data.equipment as Id<"equipment">[],
            tipsV2,
            overriddenTitle: data.overriddenTitle ?? undefined,
            overriddenDescription: data.overriddenDescription ?? undefined,
            overriddenDifficulty: data.overriddenDifficulty ?? undefined,
          },
        });
        toast.success("Variant updated!");
      } else {
        await createVariant({
          data: {
            exercise: exerciseId,
            equipment: data.equipment as Id<"equipment">[],
            tipsV2,
            overriddenTitle: data.overriddenTitle ?? undefined,
            overriddenDescription: data.overriddenDescription ?? undefined,
            overriddenDifficulty: data.overriddenDifficulty ?? undefined,
          },
        });
        toast.success("Variant created!");
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error saving variant:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${isEditing ? "update" : "create"} variant. Please try again.`,
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Variant" : "Create Variant"}
          </DialogTitle>
        </DialogHeader>
        <form
          id="variant-form"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.AppField
              name="equipment"
              children={() => (
                <EquipmentField
                  equipment={equipment as Equipment[] | undefined}
                />
              )}
            />
            <form.AppField name="tipsV2" children={() => <TipV2Field />} />
          </FieldGroup>

          <Separator className="my-4" />

          <Collapsible open={overridesOpen} onOpenChange={setOverridesOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between"
              >
                <span>Overrides</span>
                {overridesOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <FieldGroup className="mt-4">
                <form.AppField
                  name="overriddenTitle"
                  children={() => <OverriddenTitleField />}
                />
                <form.AppField
                  name="overriddenDescription"
                  children={() => <OverriddenDescriptionField />}
                />
                <form.AppField
                  name="overriddenDifficulty"
                  children={() => <OverriddenDifficultyField />}
                />
              </FieldGroup>
            </CollapsibleContent>
          </Collapsible>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" form="variant-form">
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

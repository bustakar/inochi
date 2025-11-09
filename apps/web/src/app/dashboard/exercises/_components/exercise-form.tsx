"use client";

import * as React from "react";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { Layers, Search, Sparkles, Target } from "lucide-react";
import * as z from "zod";

import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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

export const exerciseFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  level: z.enum(["beginner", "intermediate", "advanced", "expert", "elite"]),
  difficulty: z.number(),
  category: z.enum(["calisthenics", "gym", "stretch", "mobility"]),
  muscles: z.array(z.string()),
  prerequisites: z.array(z.string()),
});

export type ExerciseFormData = z.infer<typeof exerciseFormSchema>;

export interface Muscle {
  _id: Id<"muscles">;
  name: string;
  muscleGroup?: string;
}

export interface Exercise {
  _id: Id<"private_exercises">;
  title: string;
}

// ============================================================================
// Form Components
// ============================================================================

const { fieldContext, formContext, useFieldContext } = createFormHookContexts();

function TitleField({
  onFillWithAI,
  isGenerating,
}: {
  onFillWithAI: () => void;
  isGenerating: boolean;
}) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const isTitleEmpty = !field.state.value || field.state.value.trim() === "";
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>Title</FieldLabel>
      <div className="flex items-center justify-between gap-2">
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
        <Button
          type="button"
          variant="outline"
          onClick={onFillWithAI}
          disabled={isGenerating || isTitleEmpty}
        >
          <Sparkles className="mr-2 size-4" />
        </Button>
      </div>
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

const levelLabels: Record<
  "beginner" | "intermediate" | "advanced" | "expert" | "elite",
  string
> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
  elite: "Elite",
};

function LevelField() {
  const field = useFieldContext<
    "beginner" | "intermediate" | "advanced" | "expert" | "elite" | undefined
  >();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const selectedValue = field.state.value || "beginner";

  return (
    <Field data-invalid={isInvalid}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8"
            aria-invalid={isInvalid}
            title={field.state.value ? levelLabels[field.state.value] : "Level"}
          >
            {field.state.value}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuRadioGroup
            value={selectedValue}
            onValueChange={(value) =>
              field.handleChange(
                value as
                  | "beginner"
                  | "intermediate"
                  | "advanced"
                  | "expert"
                  | "elite",
              )
            }
          >
            <DropdownMenuRadioItem value="beginner">
              Beginner
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="intermediate">
              Intermediate
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="advanced">
              Advanced
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="expert">Expert</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="elite">Elite</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

function DifficultyField() {
  const field = useFieldContext<number | undefined>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const selectedValue = field.state.value?.toString() || "1";

  return (
    <Field data-invalid={isInvalid}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8"
            aria-invalid={isInvalid}
            title={
              field.state.value
                ? `Difficulty ${field.state.value}`
                : "Difficulty"
            }
          >
            <div className="w-3 text-center">{field.state.value}</div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuRadioGroup
            value={selectedValue}
            onValueChange={(value) => field.handleChange(parseInt(value, 10))}
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
              <DropdownMenuRadioItem key={num} value={num.toString()}>
                Difficulty {num}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

function PrerequisitesField({
  exercises,
}: {
  exercises: Exercise[] | undefined;
}) {
  const field = useFieldContext<string[] | undefined>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const selectedExerciseIds = field.state.value || [];
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleToggleExercise = (exerciseId: Id<"private_exercises">) => {
    const exerciseIdStr = exerciseId as string;
    const currentIds = selectedExerciseIds;
    if (currentIds.includes(exerciseIdStr)) {
      field.handleChange(currentIds.filter((id) => id !== exerciseIdStr));
    } else {
      field.handleChange([...currentIds, exerciseIdStr]);
    }
  };

  // Filter exercises based on search query
  const filteredExercises = React.useMemo(() => {
    if (!exercises) return [];
    if (!searchQuery.trim()) return exercises;

    const query = searchQuery.toLowerCase();
    return exercises.filter((exercise) =>
      exercise.title.toLowerCase().includes(query),
    );
  }, [exercises, searchQuery]);

  return (
    <Field data-invalid={isInvalid}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant={selectedExerciseIds.length > 0 ? "default" : "outline"}
            size="sm"
            className="h-8 w-8"
            aria-invalid={isInvalid}
            title={
              selectedExerciseIds.length > 0
                ? `${selectedExerciseIds.length} prerequisite${selectedExerciseIds.length > 1 ? "s" : ""} selected`
                : "Prerequisites"
            }
          >
            <Layers className="h-4 w-4" />
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
          <div className="space-y-0.5 p-1">
            {filteredExercises.length === 0 ? (
              <div className="text-muted-foreground px-2 py-4 text-center text-sm">
                {searchQuery.trim()
                  ? "No exercises found"
                  : "No exercises available"}
              </div>
            ) : (
              filteredExercises.map((exercise) => (
                <DropdownMenuCheckboxItem
                  key={exercise._id}
                  checked={selectedExerciseIds.includes(exercise._id as string)}
                  onCheckedChange={() => handleToggleExercise(exercise._id)}
                  onSelect={(e) => e.preventDefault()}
                  className="text-sm"
                >
                  {exercise.title}
                </DropdownMenuCheckboxItem>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

function MusclesField({ muscles }: { muscles: Muscle[] | undefined }) {
  const field = useFieldContext<string[] | undefined>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const selectedMuscleIds = field.state.value || [];
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleToggleMuscle = (muscleId: Id<"muscles">) => {
    const muscleIdStr = muscleId as string;
    const currentIds = selectedMuscleIds;
    if (currentIds.includes(muscleIdStr)) {
      field.handleChange(currentIds.filter((id) => id !== muscleIdStr));
    } else {
      field.handleChange([...currentIds, muscleIdStr]);
    }
  };

  const handleToggleGroup = (groupMuscles: Muscle[]) => {
    const groupMuscleIds = groupMuscles.map((m) => m._id as string);
    const allSelected = groupMuscleIds.every((id) =>
      selectedMuscleIds.includes(id),
    );

    if (allSelected) {
      field.handleChange(
        selectedMuscleIds.filter((id) => !groupMuscleIds.includes(id)),
      );
    } else {
      const newSelection = [...selectedMuscleIds];
      for (const id of groupMuscleIds) {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      }
      field.handleChange(newSelection);
    }
  };

  const getGroupSelectionState = (groupMuscles: Muscle[]) => {
    const groupMuscleIds = groupMuscles.map((m) => m._id as string);
    const selectedCount = groupMuscleIds.filter((id) =>
      selectedMuscleIds.includes(id),
    ).length;

    if (selectedCount === 0) return "none";
    if (selectedCount === groupMuscleIds.length) return "all";
    return "some";
  };

  // Group muscles by muscleGroup
  const groupedMuscles = React.useMemo(() => {
    if (!muscles) return new Map<string, Muscle[]>();

    const groups = new Map<string, Muscle[]>();
    for (const muscle of muscles) {
      const group = muscle.muscleGroup || "Other";
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(muscle);
    }

    // Sort groups and muscles within groups
    const sortedGroups = new Map(
      Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b)),
    );
    for (const [group, groupMuscles] of sortedGroups.entries()) {
      sortedGroups.set(
        group,
        groupMuscles.sort((a, b) => a.name.localeCompare(b.name)),
      );
    }

    return sortedGroups;
  }, [muscles]);

  // Filter muscles based on search query
  const filteredGroupedMuscles = React.useMemo(() => {
    if (!searchQuery.trim()) return groupedMuscles;

    const query = searchQuery.toLowerCase();
    const filtered = new Map<string, Muscle[]>();

    for (const [group, groupMuscles] of groupedMuscles.entries()) {
      const matchingMuscles = groupMuscles.filter(
        (muscle) =>
          muscle.name.toLowerCase().includes(query) ||
          group.toLowerCase().includes(query),
      );
      if (matchingMuscles.length > 0) {
        filtered.set(group, matchingMuscles);
      }
    }

    return filtered;
  }, [groupedMuscles, searchQuery]);

  return (
    <Field data-invalid={isInvalid}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant={selectedMuscleIds.length > 0 ? "default" : "outline"}
            size="sm"
            className="h-8 w-8"
            aria-invalid={isInvalid}
            title={
              selectedMuscleIds.length > 0
                ? `${selectedMuscleIds.length} muscle${selectedMuscleIds.length > 1 ? "s" : ""} selected`
                : "Muscles"
            }
          >
            <Target className="h-4 w-4" />
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
                placeholder="Search muscles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  // Prevent dropdown menu from handling keyboard navigation
                  e.stopPropagation();
                }}
                className="h-8 pl-8"
              />
            </div>
          </div>
          <DropdownMenuSeparator />
          <div className="space-y-1 p-1">
            {Array.from(filteredGroupedMuscles.entries()).map(
              ([group, groupMuscles]) => {
                const selectionState = getGroupSelectionState(groupMuscles);
                const isGroupChecked = selectionState === "all";
                const isGroupIndeterminate = selectionState === "some";

                return (
                  <div key={group} className="space-y-0.5">
                    <div className="bg-muted flex items-center gap-2 rounded-sm px-2 py-2">
                      <Checkbox
                        id={`group-${group}`}
                        checked={
                          isGroupIndeterminate
                            ? "indeterminate"
                            : isGroupChecked
                        }
                        onCheckedChange={() => handleToggleGroup(groupMuscles)}
                        className="h-4 w-4"
                      />
                      <Label
                        htmlFor={`group-${group}`}
                        className="text-muted-foreground cursor-pointer text-xs font-medium"
                      >
                        {group.charAt(0).toUpperCase() + group.slice(1)}
                      </Label>
                    </div>
                    <div className="grid grid-cols-1 gap-0.5 md:grid-cols-2">
                      {groupMuscles.map((muscle) => (
                        <DropdownMenuCheckboxItem
                          key={muscle._id}
                          checked={selectedMuscleIds.includes(
                            muscle._id as string,
                          )}
                          onCheckedChange={() => handleToggleMuscle(muscle._id)}
                          onSelect={(e) => e.preventDefault()}
                          className="text-sm"
                        >
                          {muscle.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
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
    LevelField,
    DifficultyField,
    MusclesField,
    PrerequisitesField,
  },
  formComponents: {},
});

// ============================================================================
// Exercise Form Component
// ============================================================================

interface ExerciseFormProps {
  form: any; // Using any to avoid complex type issues with tanstack form
  isGenerating: boolean;
  onFillWithAI: () => void;
}

export function ExerciseForm({
  form,
  isGenerating,
  onFillWithAI,
}: ExerciseFormProps) {
  return (
    <>
      <FieldGroup>
        <form.AppField
          name="title"
          children={() => (
            <TitleField
              onFillWithAI={onFillWithAI}
              isGenerating={isGenerating}
            />
          )}
        />
        <form.AppField
          name="description"
          children={() => <DescriptionField />}
        />
      </FieldGroup>

      <Separator className="my-4" />
    </>
  );
}

interface ExerciseFormFieldsProps {
  form: any; // Using any to avoid complex type issues with tanstack form
  muscles: Muscle[] | undefined;
  exercises: Exercise[] | undefined;
}

// Component for rendering form fields in DialogFooter (leading side)
export function ExerciseFormFields({
  form,
  muscles,
  exercises,
}: ExerciseFormFieldsProps) {
  return (
    <div className="flex shrink-0 gap-1">
      <form.AppField name="level" children={() => <LevelField />} />
      <form.AppField name="difficulty" children={() => <DifficultyField />} />
      {muscles && (
        <form.AppField
          name="muscles"
          children={() => <MusclesField muscles={muscles} />}
        />
      )}
      {exercises && (
        <form.AppField
          name="prerequisites"
          children={() => <PrerequisitesField exercises={exercises} />}
        />
      )}
    </div>
  );
}

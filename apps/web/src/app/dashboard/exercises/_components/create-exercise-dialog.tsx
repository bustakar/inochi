"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { CopyPlus, Search, Target } from "lucide-react";
import { toast } from "sonner";
import * as z from "zod";

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Switch,
  Toggle,
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
  muscles: z.array(z.string()),
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

interface Muscle {
  _id: Id<"muscles">;
  name: string;
  muscleGroup?: string;
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
                className="h-8 pl-8"
                autoFocus
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

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TitleField,
    DescriptionField,
    LevelField,
    DifficultyField,
    MusclesField,
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
  const muscles = useQuery(api.functions.skills.getMuscles, {});
  const [createMore, setCreateMore] = React.useState(false);

  const form = useAppForm({
    defaultValues: {
      title: "",
      description: "",
      level: "beginner",
      difficulty: 1,
      category: "calisthenics",
      muscles: [],
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
      const exerciseId = await createPrivateExercise({
        data: data,
      });
      toast.success("Private exercise created!");
      onOpenChange(false);
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
          <FieldGroup>
            <form.AppField name="title" children={() => <TitleField />} />
            <form.AppField
              name="description"
              children={() => <DescriptionField />}
            />
          </FieldGroup>

          <Separator className="my-4" />

          <DialogFooter className="flex w-full flex-row justify-between gap-2 sm:justify-between">
            <div className="flex shrink-0 gap-1">
              <form.AppField name="level" children={() => <LevelField />} />
              <form.AppField
                name="difficulty"
                children={() => <DifficultyField />}
              />
              {muscles && (
                <form.AppField
                  name="muscles"
                  children={() => (
                    <MusclesField muscles={muscles as Muscle[]} />
                  )}
                />
              )}
            </div>
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

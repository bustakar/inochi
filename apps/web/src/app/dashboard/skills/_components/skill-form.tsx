"use client";

import * as React from "react";
import { api } from "@packages/backend/convex/_generated/api";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useQuery } from "convex/react";
import { Plus, X } from "lucide-react";
import * as z from "zod";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
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

import { EquipmentSelectionDialog } from "./equipment-selection-dialog";
import { MuscleSelectionDialog } from "./muscle-selection-dialog";
import { SkillSelectionDialog } from "./skill-selection-dialog";

interface Muscle {
  _id: string;
  name: string;
}

interface Equipment {
  _id: string;
  name: string;
}

interface Skill {
  _id: string;
  title: string;
}

// Create form contexts
const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

// Field Components using useFieldContext
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
          placeholder="I'm having an issue with the login button on mobile."
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

function MusclesField({ muscles }: { muscles: Muscle[] | undefined }) {
  const field = useFieldContext<string[]>();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const muscleIds = field.state.value;
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const selectedMuscles =
    muscles?.filter((m) => muscleIds.includes(m._id)) || [];

  const handleConfirm = (selectedIds: string[]) => {
    field.handleChange(selectedIds);
  };

  const handleRemoveMuscle = (muscleId: string) => {
    field.handleChange(muscleIds.filter((id) => id !== muscleId));
  };

  return (
    <>
      <Field data-invalid={isInvalid}>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel htmlFor={field.name}>Muscles</FieldLabel>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setDialogOpen(true)}
          >
            Select
          </Button>
        </div>
        <div className="space-y-2">
          {selectedMuscles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedMuscles.map((muscle) => (
                <Badge
                  key={muscle._id}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  <span>{muscle.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMuscle(muscle._id)}
                    className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                    aria-label={`Remove ${muscle.name}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
      {muscles && (
        <MuscleSelectionDialog
          open={dialogOpen}
          muscles={muscles}
          initialMuscleIds={muscleIds}
          onOpenChange={setDialogOpen}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}

function EquipmentField({ equipment }: { equipment: Equipment[] | undefined }) {
  const field = useFieldContext<string[]>();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const equipmentIds = field.state.value;
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const selectedEquipment =
    equipment?.filter((e) => equipmentIds.includes(e._id)) || [];

  const handleConfirm = (selectedIds: string[]) => {
    field.handleChange(selectedIds);
  };

  const handleRemoveEquipment = (equipmentId: string) => {
    field.handleChange(equipmentIds.filter((id) => id !== equipmentId));
  };

  return (
    <>
      <Field data-invalid={isInvalid}>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel htmlFor={field.name}>Equipment</FieldLabel>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setDialogOpen(true)}
          >
            Select
          </Button>
        </div>
        <div className="space-y-2">
          {selectedEquipment.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedEquipment.map((item) => (
                <Badge
                  key={item._id}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  <span>{item.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEquipment(item._id)}
                    className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                    aria-label={`Remove ${item.name}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
      {equipment && (
        <EquipmentSelectionDialog
          open={dialogOpen}
          equipment={equipment}
          initialEquipmentIds={equipmentIds}
          onOpenChange={setDialogOpen}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}

function SkillSelectionField({
  skills,
  excludeIds,
  label,
  dialogTitle,
}: {
  skills: Skill[] | undefined;
  excludeIds?: string[];
  label: string;
  dialogTitle: string;
}) {
  const field = useFieldContext<string[]>();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const skillIds = field.state.value;
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const selectedSkills = skills?.filter((s) => skillIds.includes(s._id)) || [];

  const handleConfirm = (selectedIds: string[]) => {
    field.handleChange(selectedIds);
  };

  const handleRemoveSkill = (skillId: string) => {
    field.handleChange(skillIds.filter((id) => id !== skillId));
  };

  return (
    <>
      <Field data-invalid={isInvalid}>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setDialogOpen(true)}
          >
            Select
          </Button>
        </div>
        <div className="space-y-2">
          {selectedSkills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((skill) => (
                <Badge
                  key={skill._id}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  <span>{skill.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill._id)}
                    className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                    aria-label={`Remove ${skill.title}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
      {skills && (
        <SkillSelectionDialog
          open={dialogOpen}
          skills={skills}
          initialSkillIds={skillIds}
          title={dialogTitle}
          excludeIds={excludeIds}
          onOpenChange={setDialogOpen}
          onConfirm={handleConfirm}
        />
      )}
    </>
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
  const items = field.state.value;
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const handleAdd = () => {
    field.handleChange([...items, ""]);
  };

  const handleChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    field.handleChange(newItems);
  };

  const handleRemove = (index: number) => {
    field.handleChange(items.filter((_, i) => i !== index));
  };

  return (
    <Field data-invalid={isInvalid}>
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
        <Button type="button" size="sm" variant="outline" onClick={handleAdd}>
          <Plus className="size-4" />
          New
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              type={inputType}
              value={item}
              onChange={(e) => handleChange(index, e.target.value)}
              onBlur={field.handleBlur}
              placeholder={placeholder}
              className="flex-1"
              aria-invalid={isInvalid}
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="text-muted-foreground hover:text-destructive rounded-full p-1 transition-colors"
              aria-label={`Remove ${label} ${index + 1}`}
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

// Create custom form hook with registered field components
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TitleField,
    DescriptionField,
    LevelField,
    DifficultyField,
    MusclesField,
    EquipmentField,
    SkillSelectionField,
    ArrayStringField,
  },
  formComponents: {},
});

const musclesSchema = z.array(z.string());
const equipmentSchema = z.array(z.string());
const prerequisitesSchema = z.array(z.string());
const variantsSchema = z.array(z.string());
const embeddedVideosSchema = z.array(
  z.string().url("Each video must be a valid URL"),
);
const tipsSchema = z.array(z.string().min(1, "Tip cannot be empty"));

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
  muscles: musclesSchema,
  equipment: equipmentSchema,
  prerequisites: prerequisitesSchema,
  variants: variantsSchema,
  embedded_videos: embeddedVideosSchema,
  tips: tipsSchema,
});

export function SkillForm() {
  const muscles = useQuery(api.functions.skills.getMuscles, {});
  const equipment = useQuery(api.functions.skills.getEquipment, {});
  const skills = useQuery(api.functions.skills.getSkills, {});

  const form = useAppForm({
    defaultValues: {
      title: "",
      description: "",
      level: "beginner",
      difficulty: 1,
      muscles: [] as string[],
      equipment: [] as string[],
      prerequisites: [] as string[],
      variants: [] as string[],
      embedded_videos: [] as string[],
      tips: [] as string[],
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: (values) => {
      console.log(values);
    },
  });

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Create skill</CardTitle>
      </CardHeader>
      <CardContent>
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
            <form.AppField
              name="muscles"
              children={() => <MusclesField muscles={muscles} />}
            />
            <form.AppField
              name="equipment"
              children={() => <EquipmentField equipment={equipment} />}
            />
            <form.AppField
              name="prerequisites"
              children={() => (
                <SkillSelectionField
                  skills={skills}
                  excludeIds={form.state.values.variants}
                  label="Prerequisites"
                  dialogTitle="Select Prerequisites"
                />
              )}
            />
            <form.AppField
              name="variants"
              children={() => (
                <SkillSelectionField
                  skills={skills}
                  excludeIds={form.state.values.prerequisites}
                  label="Variants"
                  dialogTitle="Select Variants"
                />
              )}
            />
            <form.AppField
              name="embedded_videos"
              children={() => (
                <ArrayStringField
                  label="Video Urls"
                  placeholder="https://example.com/video"
                  inputType="url"
                />
              )}
            />
            <form.AppField
              name="tips"
              children={() => (
                <ArrayStringField
                  label="Tips"
                  placeholder="Enter a tip..."
                  inputType="text"
                />
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Cancel
          </Button>
          <Button type="submit" form="skill-form">
            Submit
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}

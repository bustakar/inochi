"use client";

import {
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  FormControl,
  FormField,
  FormItem,
  Input,
  Textarea,
} from "@inochi/ui";

import { LevelSelectField } from "./level-select-field";

interface BasicFormFieldsProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  titleFieldName: FieldPath<TFieldValues>;
  descriptionFieldName: FieldPath<TFieldValues>;
  levelFieldName: FieldPath<TFieldValues>;
  difficultyFieldName: FieldPath<TFieldValues>;
}

export function BasicFormFields<TFieldValues extends FieldValues>({
  control,
  titleFieldName,
  descriptionFieldName,
  levelFieldName,
  difficultyFieldName,
}: BasicFormFieldsProps<TFieldValues>) {
  return (
    <>
      <FormField
        control={control as any}
        name={titleFieldName as any}
        render={({ field, fieldState }) => (
          <FormItem>
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel>Title</FieldLabel>
              <FieldContent>
                <FormControl>
                  <Input {...field} placeholder="Skill title" />
                </FormControl>
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </FieldContent>
            </Field>
          </FormItem>
        )}
      />

      <FormField
        control={control as any}
        name={descriptionFieldName as any}
        render={({ field, fieldState }) => (
          <FormItem>
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel>Description</FieldLabel>
              <FieldContent>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Skill description"
                    rows={4}
                  />
                </FormControl>
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </FieldContent>
            </Field>
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <LevelSelectField control={control} name={levelFieldName} />

        <FormField
          control={control as any}
          name={difficultyFieldName as any}
          render={({ field, fieldState }) => (
            <FormItem>
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel>Difficulty (1-10)</FieldLabel>
                <FieldContent>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 1)
                      }
                    />
                  </FormControl>
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </FieldContent>
              </Field>
            </FormItem>
          )}
        />
      </div>
    </>
  );
}

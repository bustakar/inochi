"use client";

import { Field, FieldContent, FieldError, FieldLabel } from "@inochi/ui";
import { FormControl, FormField, FormItem } from "@inochi/ui/Form";
import { Input } from "@inochi/ui/Input";
import { Textarea } from "@inochi/ui/Textarea";
import type {Control, FieldPath, FieldValues} from "react-hook-form";
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
        control={control}
        name={titleFieldName}
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
        control={control}
        name={descriptionFieldName}
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
          control={control}
          name={difficultyFieldName}
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
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        field.onChange(isNaN(value) ? 1 : value);
                      }}
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

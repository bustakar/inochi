"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";

import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  FormControl,
  FormField,
  FormItem,
} from "@inochi/ui";

import { exerciseLevels } from "../../utils/exercise-utils";

interface LevelSelectFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
}

export function LevelSelectField<TFieldValues extends FieldValues>({
  control,
  name,
}: LevelSelectFieldProps<TFieldValues>) {
  return (
    <FormField<TFieldValues, typeof name>
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel>Level</FieldLabel>
            <FieldContent>
              <FormControl>
                <select
                  {...field}
                  className="border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {exerciseLevels.map((level) => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </FormControl>
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </FieldContent>
          </Field>
        </FormItem>
      )}
    />
  );
}

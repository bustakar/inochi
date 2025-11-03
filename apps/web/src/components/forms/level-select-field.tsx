"use client";

import { Field, FieldContent, FieldError, FieldLabel } from "@inochi/ui";
import { FormControl, FormField, FormItem } from "@inochi/ui/Form";
import {
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

interface LevelSelectFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
}

export function LevelSelectField<TFieldValues extends FieldValues>({
  control,
  name,
}: LevelSelectFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control as any}
      name={name as any}
      render={({ field, fieldState }) => (
        <FormItem>
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel>Level</FieldLabel>
            <FieldContent>
              <FormControl>
                <select
                  {...field}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                  <option value="elite">Elite</option>
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

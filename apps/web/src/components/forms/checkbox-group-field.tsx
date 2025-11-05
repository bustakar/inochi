"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";

import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  FormField,
  FormItem,
} from "@inochi/ui";

interface CheckboxGroupFieldProps<
  TFieldValues extends FieldValues,
  T extends { _id: string; name?: string; title?: string },
> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  options: T[] | undefined;
  label: string;
  description?: string;
  excludeIds?: string[];
}

export function CheckboxGroupField<
  TFieldValues extends FieldValues,
  T extends { _id: string; name?: string; title?: string },
>({
  control,
  name,
  options,
  label,
  description,
  excludeIds = [],
}: CheckboxGroupFieldProps<TFieldValues, T>) {
  if (!options) {
    return null;
  }

  const filteredOptions = options.filter(
    (option) => !excludeIds.includes(option._id),
  );

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel>{label}</FieldLabel>
            <FieldContent>
              <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border p-2">
                {filteredOptions.map((option) => {
                  const displayName = option.name ?? option.title ?? "";
                  return (
                    <label
                      key={option._id}
                      className="hover:bg-accent/50 flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={(field.value as string[]).includes(option._id)}
                        onChange={(e) => {
                          const currentValue = field.value as string[];
                          if (e.target.checked) {
                            field.onChange([...currentValue, option._id]);
                          } else {
                            field.onChange(
                              currentValue.filter(
                                (id: string) => id !== option._id,
                              ),
                            );
                          }
                        }}
                        className="border-input rounded"
                      />
                      <span>{displayName}</span>
                    </label>
                  );
                })}
              </div>
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
              {description && !fieldState.error && (
                <p className="text-muted-foreground text-sm">{description}</p>
              )}
            </FieldContent>
          </Field>
        </FormItem>
      )}
    />
  );
}

"use client";

import { Button } from "@inochi/ui/Button";
import { Field, FieldContent, FieldError, FieldLabel } from "@inochi/ui";
import { FormField, FormItem } from "@inochi/ui/Form";
import { Input } from "@inochi/ui/Input";
import { Plus, X } from "lucide-react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

interface ArrayInputFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder: string;
  addButtonText: string;
}

export function ArrayInputField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  addButtonText,
}: ArrayInputFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const items: string[] = Array.isArray(field.value) ? field.value : [];

        return (
          <FormItem>
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel>{label}</FieldLabel>
              <FieldContent>
                <div className="space-y-2">
                  {items.map((item: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index] = e.target.value;
                          field.onChange(newItems);
                        }}
                        placeholder={placeholder}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newItems = items.filter(
                            (_: string, i: number) => i !== index,
                          );
                          field.onChange(newItems);
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
                      field.onChange([...items, ""]);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {addButtonText}
                  </Button>
                </div>
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </FieldContent>
            </Field>
          </FormItem>
        );
      }}
    />
  );
}

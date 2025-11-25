"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Plus, X } from "lucide-react";

import {
  Button,
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  FormField,
  FormItem,
  Input,
} from "@inochi/ui";

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
    <FormField<TFieldValues, typeof name>
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const items = (field.value as string[] | undefined) ?? [];

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
                          field.onChange(newItems as TFieldValues[typeof name]);
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
                          field.onChange(newItems as TFieldValues[typeof name]);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      field.onChange([
                        ...items,
                        "",
                      ] as TFieldValues[typeof name]);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
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

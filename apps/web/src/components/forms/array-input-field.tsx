"use client";

import { Plus, X } from "lucide-react";
import {
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

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
    <FormField
      control={control as any}
      name={name as any}
      render={({ field, fieldState }) => {
        const items = field.value || [];

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
                        <X className="h-4 w-4" />
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

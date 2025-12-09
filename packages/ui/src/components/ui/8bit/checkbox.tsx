import type * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import type { VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "../../../lib/utils";
import { Checkbox as ShadcnCheckbox } from "../../checkbox";

import "./styles/retro.css";

export const checkboxVariants = cva("", {
  variants: {
    font: {
      normal: "",
      retro: "retro",
    },
  },
  defaultVariants: {
    font: "retro",
  },
});

export interface BitCheckboxProps
  extends React.ComponentProps<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {
  asChild?: boolean;
}

function Checkbox({ className, font, ...props }: BitCheckboxProps) {
  return (
    <div
      className={cn(
        "border-foreground dark:border-ring relative flex items-center justify-center border-y-6",
        className,
      )}
    >
      <ShadcnCheckbox
        className={cn(
          "size-5 rounded-none border-none ring-0",
          font !== "normal" && "retro",
          className,
        )}
        {...props}
      />

      <div
        className="border-foreground dark:border-ring pointer-events-none absolute inset-0 -mx-1.5 border-x-6"
        aria-hidden="true"
      />
    </div>
  );
}

export { Checkbox };

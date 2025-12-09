import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "../../../lib/utils";

import "./styles/retro.css";

export const healthBarVariants = cva("", {
  variants: {
    variant: {
      default: "",
      retro: "retro",
    },
    font: {
      normal: "",
      retro: "retro",
    },
  },
  defaultVariants: {
    variant: "retro",
    font: "retro",
  },
});

export interface HealthBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof healthBarVariants> {
  value: number;
  sections?: number;
  progressBg?: string;
  className?: string;
  font?: VariantProps<typeof healthBarVariants>["font"];
}

function HealthBar({
  className,
  font,
  variant,
  value,
  sections = 20,
  progressBg = "bg-primary",
  ...props
}: HealthBarProps) {
  // Extract height from className if present
  const heightMatch = className?.match(/h-(\d+|\[.*?\])/);
  const heightClass = heightMatch ? heightMatch[0] : "h-2";
  // Remove height class from className to avoid duplication
  const classNameWithoutHeight = className
    ?.replace(/h-(\d+|\[.*?\])/g, "")
    .trim();

  const filledSections = Math.round((value / 100) * sections);

  return (
    <div className={cn("relative w-full", classNameWithoutHeight)} {...props}>
      <div
        data-slot="health-bar"
        className={cn(
          "bg-primary/20 relative flex w-full gap-[1px] overflow-hidden",
          heightClass,
          font !== "normal" && "retro",
        )}
      >
        {Array.from({ length: sections }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 transition-all",
              i < filledSections ? progressBg : "bg-transparent",
            )}
          />
        ))}
      </div>

      <div
        className="border-foreground dark:border-ring pointer-events-none absolute inset-0 -my-1 border-y-4"
        aria-hidden="true"
      />

      <div
        className="border-foreground dark:border-ring pointer-events-none absolute inset-0 -mx-1 border-x-4"
        aria-hidden="true"
      />
    </div>
  );
}

export { HealthBar };

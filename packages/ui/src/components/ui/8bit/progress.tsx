import type { VariantProps } from "class-variance-authority";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva } from "class-variance-authority";

import { cn } from "../../../lib/utils";

import "./styles/retro.css";

export const progressVariants = cva("", {
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
    font: "retro",
  },
});

export interface BitProgressProps
  extends React.ComponentProps<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  className?: string;
  font?: VariantProps<typeof progressVariants>["font"];
  progressBg?: string;
}

function Progress({
  className,
  font,
  variant,
  value,
  progressBg,
  ...props
}: BitProgressProps) {
  // Extract height from className if present
  const heightMatch = /h-(\d+|\[.*?\])/.exec(className ?? "");
  const heightClass = heightMatch?.[0] ?? "h-2";

  return (
    <div className={cn("relative w-full", className)}>
      <ProgressPrimitive.Root
        data-slot="progress"
        className={cn(
          "bg-primary/20 relative w-full overflow-hidden",
          heightClass,
          font !== "normal" && "retro",
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn(
            "h-full transition-all",
            variant === "retro" ? "flex" : "w-full flex-1",
            progressBg && variant !== "retro" ? progressBg : "bg-primary",
          )}
          style={
            variant === "retro"
              ? undefined
              : { transform: `translateX(-${100 - (value ?? 0)}%)` }
          }
        >
          {variant === "retro" && (
            <div className="flex w-full">
              {Array.from({ length: 20 }).map((_, i) => {
                const filledSquares = Math.round(((value ?? 0) / 100) * 20);
                return (
                  <div
                    key={i}
                    className={cn(
                      "mx-[1px] size-full",
                      i < filledSquares ? progressBg : "bg-transparent",
                    )}
                  />
                );
              })}
            </div>
          )}
        </ProgressPrimitive.Indicator>
      </ProgressPrimitive.Root>

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

export { Progress };

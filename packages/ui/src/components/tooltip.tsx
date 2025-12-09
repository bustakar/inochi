"use client";

import type { VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";
import {
  Tooltip as ShadcnTooltip,
  TooltipContent as ShadcnTooltipContent,
  TooltipProvider as ShadcnTooltipProvider,
  TooltipTrigger as ShadcnTooltipTrigger,
} from "../tooltip";

import "./styles/retro.css";

export const tooltipVariants = cva("", {
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

export interface BitTooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof ShadcnTooltipContent>,
    VariantProps<typeof tooltipVariants> {
  children?: React.ReactNode;
  className?: string;
}

function TooltipContent({
  className,
  children,
  font,
  ...props
}: BitTooltipContentProps) {
  const color = tooltipVariants({ font });

  return (
    <div className={cn("relative inline-flex", className)}>
      <ShadcnTooltipContent
        {...props}
        data-slot="tooltip-content"
        className={cn("rounded-none", color, className)}
      >
        {children}
        <div
          className={cn(
            "bg-primary absolute top-1.5 bottom-1.5 -left-1.5 w-1.5",
            color,
          )}
        />
        <div
          className={cn(
            "bg-primary absolute top-1.5 -right-1.5 bottom-1.5 w-1.5",
            color,
          )}
        />
      </ShadcnTooltipContent>
    </div>
  );
}

export interface BitTooltipProps
  extends React.ComponentPropsWithoutRef<typeof ShadcnTooltip>,
    VariantProps<typeof tooltipVariants> {
  children?: React.ReactNode;
}

function Tooltip({ children, ...props }: BitTooltipProps) {
  return (
    <ShadcnTooltip data-slot="tooltip" {...props}>
      {children}
    </ShadcnTooltip>
  );
}

export interface BitTooltipProviderProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof ShadcnTooltipProvider>,
    "delayDuration"
  > {
  delayDuration?: number;
}

function TooltipProvider({
  children,
  delayDuration = 0,
  ...props
}: BitTooltipProviderProps) {
  return (
    <ShadcnTooltipProvider delayDuration={delayDuration} {...props}>
      {children}
    </ShadcnTooltipProvider>
  );
}

function TooltipTrigger({
  children,
  asChild = true,
  ...props
}: React.ComponentPropsWithoutRef<typeof ShadcnTooltipTrigger>) {
  return (
    <ShadcnTooltipTrigger
      data-slot="tooltip-trigger"
      asChild={asChild}
      {...props}
    >
      {children}
    </ShadcnTooltipTrigger>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };

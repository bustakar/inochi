"use client";

import type * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";
import { RadioGroup as ShadcnRadioGroup } from "../radio-group";

import "./styles/retro.css";

export const radioGroupVariants = cva("", {
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

function RadioGroup({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof ShadcnRadioGroup>) {
  return <ShadcnRadioGroup className={cn("", className)} {...props} />;
}

function RadioGroupItem({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
  ref?: React.RefObject<React.ComponentRef<typeof RadioGroupPrimitive.Item>>;
}) {
  return (
    <div className={cn("relative", className)}>
      <RadioGroupPrimitive.Item
        ref={ref}
        className={cn(
          "peer border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 flex size-4 shrink-0 items-center justify-center rounded-none border-none py-3 outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary",
          className,
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator>
          <svg
            viewBox="0 0 256 256"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            strokeWidth="0"
            className="w-2.5"
            aria-label="square"
          >
            <rect x="30" y="35" width="200" height="200" rx="0" />
            <rect x="80" y="5" width="100" height="200" rx="0" />
            <rect x="0" y="85" width="100" height="100" rx="0" />
            <rect x="80" y="65" width="100" height="200" rx="0" />
            <rect x="200" y="85" width="100" height="100" rx="0" />
          </svg>
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>

      <div className="bg-foreground dark:bg-ring absolute top-[0px] left-1.5 h-1 w-2.5" />
      <div className="bg-foreground dark:bg-ring absolute top-[0px] right-1.5 h-1 w-2.5" />

      <div className="bg-foreground dark:bg-ring absolute bottom-[0px] left-1.5 h-1 w-2.5" />
      <div className="bg-foreground dark:bg-ring absolute right-1.5 bottom-[0px] h-1 w-2.5" />

      <div className="bg-foreground dark:bg-ring absolute top-[4px] -left-1 h-[15px] w-1" />
      <div className="bg-foreground dark:bg-ring absolute top-[4px] -right-1 h-[15px] w-1" />

      <div className="bg-foreground dark:bg-ring absolute top-[2px] -right-0.5 h-1 w-1" />
      <div className="bg-foreground dark:bg-ring absolute top-[2px] -left-0.5 h-1 w-1" />

      <div className="bg-foreground dark:bg-ring absolute -right-0.5 bottom-[2px] h-1 w-1" />
      <div className="bg-foreground dark:bg-ring absolute bottom-[2px] -left-0.5 h-1 w-1" />
    </div>
  );
}

export { RadioGroup, RadioGroupItem };

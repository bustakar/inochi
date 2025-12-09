"use client";

import type * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "../../../lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 relative inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-xs border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground border-foreground dark:border-ring pointer-events-none block size-4 border ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
        )}
      />

      <div
        className="border-foreground dark:border-ring pointer-events-none absolute inset-0 -my-1 border-y-4"
        aria-hidden="true"
      />

      <div
        className="border-foreground dark:border-ring pointer-events-none absolute inset-0 -mx-1 border-x-4"
        aria-hidden="true"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };

"use client";

import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";

import "./styles/retro.css";

const emptyMediaVariants = cva(
  "flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "bg-muted text-foreground relative flex size-12 shrink-0 items-center justify-center",
      },
      font: {
        normal: "",
        retro: "retro",
      },
    },
    defaultVariants: {
      variant: "default",
      font: "retro",
    },
  },
);

function Empty({
  className,
  font,
  ...props
}: React.ComponentProps<"div"> & { font?: "normal" | "retro" }) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border-dashed p-6 text-center text-balance md:p-12",
        font !== "normal" && "retro",
        className,
      )}
      {...props}
    />
  );
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn(
        "flex max-w-sm flex-col items-center gap-2 text-center",
        className,
      )}
      {...props}
    />
  );
}

function EmptyMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div className={cn("relative size-max", className)}>
      <div
        data-slot="empty-icon"
        data-variant={variant}
        className={cn(emptyMediaVariants({ variant, className }))}
        {...props}
      />
      {variant !== "default" && (
        <>
          <div className="bg-foreground dark:bg-ring pointer-events-none absolute top-0 left-0 h-1.5 w-full" />
          <div className="bg-foreground dark:bg-ring pointer-events-none absolute bottom-0 h-1.5 w-full" />
          <div className="bg-foreground dark:bg-ring pointer-events-none absolute top-1.5 -left-1.5 h-1/2 w-1.5" />
          <div className="bg-foreground dark:bg-ring pointer-events-none absolute bottom-1.5 -left-1.5 h-1/2 w-1.5" />
          <div className="bg-foreground dark:bg-ring pointer-events-none absolute top-1.5 -right-1.5 h-1/2 w-1.5" />
          <div className="bg-foreground dark:bg-ring pointer-events-none absolute -right-1.5 bottom-1.5 h-1/2 w-1.5" />
        </>
      )}
    </div>
  );
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-title"
      className={cn("text-lg font-medium tracking-tight", className)}
      {...props}
    />
  );
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="empty-description"
      className={cn(
        "text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4",
        className,
      )}
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance",
        className,
      )}
      {...props}
    />
  );
}

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
};

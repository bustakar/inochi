"use client";

import type * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type { VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";
import {
  AlertDialog as ShadcnAlertDialog,
  AlertDialogAction as ShadcnAlertDialogAction,
  AlertDialogCancel as ShadcnAlertDialogCancel,
  AlertDialogContent as ShadcnAlertDialogContent,
  AlertDialogDescription as ShadcnAlertDialogDescription,
  AlertDialogFooter as ShadcnAlertDialogFooter,
  AlertDialogHeader as ShadcnAlertDialogHeader,
  AlertDialogOverlay as ShadcnAlertDialogOverlay,
  AlertDialogPortal as ShadcnAlertDialogPortal,
  AlertDialogTitle as ShadcnAlertDialogTitle,
  AlertDialogTrigger as ShadcnAlertDialogTrigger,
} from "./alert-dialog";

import "./styles/retro.css";

export const alertDialogVariants = cva("", {
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

export interface BitAlertDialogProps
  extends React.ComponentProps<typeof AlertDialogPrimitive.Root>,
    VariantProps<typeof alertDialogVariants> {}

function AlertDialog({ ...props }: BitAlertDialogProps) {
  return <ShadcnAlertDialog {...props} />;
}

function AlertDialogTrigger({
  className,
  asChild = true,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <ShadcnAlertDialogTrigger
      className={cn(className)}
      asChild={asChild}
      {...props}
    />
  );
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return <ShadcnAlertDialogPortal {...props} />;
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return <ShadcnAlertDialogOverlay className={cn(className)} {...props} />;
}

interface BitAlertDialogContentProps
  extends React.ComponentProps<typeof AlertDialogPrimitive.Content>,
    VariantProps<typeof alertDialogVariants> {}

function AlertDialogContent({
  className,
  children,
  font,
  ...props
}: BitAlertDialogContentProps) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <>
        <ShadcnAlertDialogContent
          className={cn(
            "border-foreground dark:border-ring rounded-none border-y-6",
            font !== "normal" && "retro",
            className,
          )}
          {...props}
        >
          {children}

          <div
            className="border-foreground dark:border-ring pointer-events-none absolute inset-0 -mx-1.5 border-x-6"
            aria-hidden="true"
          />
        </ShadcnAlertDialogContent>
      </>
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <ShadcnAlertDialogHeader className={cn(className)} {...props} />;
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <ShadcnAlertDialogFooter
      className={cn("flex flex-col-reverse gap-4 sm:flex-row", className)}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return <ShadcnAlertDialogTitle className={cn(className)} {...props} />;
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return <ShadcnAlertDialogDescription className={cn(className)} {...props} />;
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <ShadcnAlertDialogAction
      className={cn(
        "bg-primary relative rounded-none transition-transform active:translate-y-1",
        "border-none ring-0",
        className,
      )}
      {...props}
    >
      {props.children}
      {/* Pixelated border */}
      <div className="bg-foreground dark:bg-ring absolute -top-1.5 left-1.5 h-1.5 w-1/2" />
      <div className="bg-foreground dark:bg-ring absolute -top-1.5 right-1.5 h-1.5 w-1/2" />
      <div className="bg-foreground dark:bg-ring absolute -bottom-1.5 left-1.5 h-1.5 w-1/2" />
      <div className="bg-foreground dark:bg-ring absolute right-1.5 -bottom-1.5 h-1.5 w-1/2" />
      <div className="bg-foreground dark:bg-ring absolute top-0 left-0 size-1.5" />
      <div className="bg-foreground dark:bg-ring absolute top-0 right-0 size-1.5" />
      <div className="bg-foreground dark:bg-ring absolute bottom-0 left-0 size-1.5" />
      <div className="bg-foreground dark:bg-ring absolute right-0 bottom-0 size-1.5" />
      <div className="bg-foreground dark:bg-ring absolute top-1.5 -left-1.5 h-2/3 w-1.5" />
      <div className="bg-foreground dark:bg-ring absolute top-1.5 -right-1.5 h-2/3 w-1.5" />
      {/* Top shadow */}
      <div className="bg-foreground/20 absolute top-0 left-0 h-1.5 w-full" />
      <div className="bg-foreground/20 absolute top-1.5 left-0 h-1.5 w-3" />
      {/* Bottom shadow */}
      <div className="bg-foreground/20 absolute bottom-0 left-0 h-1.5 w-full" />
      <div className="bg-foreground/20 absolute right-0 bottom-1.5 h-1.5 w-3" />
    </ShadcnAlertDialogAction>
  );
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <ShadcnAlertDialogCancel
      className={cn(
        "bg-background relative rounded-none transition-transform active:translate-y-1",
        "border-none ring-0",
        className,
      )}
      {...props}
    >
      {props.children}
      <div className="bg-foreground dark:bg-ring absolute -top-1.5 left-1.5 h-1.5 w-1/2" />
      <div className="bg-foreground dark:bg-ring absolute -top-1.5 right-1.5 h-1.5 w-1/2" />
      <div className="bg-foreground dark:bg-ring absolute -bottom-1.5 left-1.5 h-1.5 w-1/2" />
      <div className="bg-foreground dark:bg-ring absolute right-1.5 -bottom-1.5 h-1.5 w-1/2" />
      <div className="bg-foreground dark:bg-ring absolute top-0 left-0 size-1.5" />
      <div className="bg-foreground dark:bg-ring absolute top-0 right-0 size-1.5" />
      <div className="bg-foreground dark:bg-ring absolute bottom-0 left-0 size-1.5" />
      <div className="bg-foreground dark:bg-ring absolute right-0 bottom-0 size-1.5" />
      <div className="bg-foreground dark:bg-ring absolute top-1.5 -left-1.5 h-2/3 w-1.5" />
      <div className="bg-foreground dark:bg-ring absolute top-1.5 -right-1.5 h-2/3 w-1.5" />
    </ShadcnAlertDialogCancel>
  );
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};

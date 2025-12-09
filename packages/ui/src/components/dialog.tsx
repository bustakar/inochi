import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

import {
  Dialog as ShadcnDialog,
  DialogClose as ShadcnDialogClose,
  DialogContent as ShadcnDialogContent,
  DialogDescription as ShadcnDialogDescription,
  DialogFooter as ShadcnDialogFooter,
  DialogHeader as ShadcnDialogHeader,
  DialogTitle as ShadcnDialogTitle,
  DialogTrigger as ShadcnDialogTrigger,
} from "../dialog";
import { cn } from "../lib/utils";

import "./styles/retro.css";

const Dialog = ShadcnDialog;

const DialogTrigger = ShadcnDialogTrigger;

const DialogHeader = ShadcnDialogHeader;

const DialogDescription = ShadcnDialogDescription;

const DialogClose = ShadcnDialogClose;

const DialogFooter = ShadcnDialogFooter;

export interface BitDialogProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof dialogContentVariants> {}

function DialogTitle({ ...props }: BitDialogProps) {
  const { className, font } = props;
  return (
    <ShadcnDialogTitle
      className={cn(font !== "normal" && "retro", className)}
      {...props}
    />
  );
}

export const dialogContentVariants = cva("", {
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

function DialogContent({
  className,
  children,
  font,
  ...props
}: BitDialogProps) {
  return (
    <ShadcnDialogContent
      className={cn(
        "bg-card rounded-none border-none",
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
      <div
        className="border-foreground dark:border-ring pointer-events-none absolute inset-0 -my-1.5 border-y-6"
        aria-hidden="true"
      />
    </ShadcnDialogContent>
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogHeader,
  DialogFooter,
  DialogDescription,
  DialogTitle,
  DialogContent,
  DialogClose,
};

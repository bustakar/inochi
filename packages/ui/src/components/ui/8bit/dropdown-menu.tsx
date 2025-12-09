import type * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

import { cn } from "../../../lib/utils";
import {
  DropdownMenu as ShadcnDropdownMenu,
  DropdownMenuCheckboxItem as ShadcnDropdownMenuCheckboxItem,
  DropdownMenuContent as ShadcnDropdownMenuContent,
  DropdownMenuGroup as ShadcnDropdownMenuGroup,
  DropdownMenuItem as ShadcnDropdownMenuItem,
  DropdownMenuLabel as ShadcnDropdownMenuLabel,
  DropdownMenuPortal as ShadcnDropdownMenuPortal,
  DropdownMenuSeparator as ShadcnDropdownMenuSeparator,
  DropdownMenuShortcut as ShadcnDropdownMenuShortcut,
  DropdownMenuSub as ShadcnDropdownMenuSub,
  DropdownMenuSubContent as ShadcnDropdownMenuSubContent,
  DropdownMenuSubTrigger as ShadcnDropdownMenuSubTrigger,
  DropdownMenuTrigger as ShadcnDropdownMenuTrigger,
} from "../../dropdown-menu";

import "./styles/retro.css";

const DropdownMenu = ShadcnDropdownMenu;

const DropdownMenuPortal = ShadcnDropdownMenuPortal;

const DropdownMenuTrigger = ShadcnDropdownMenuTrigger;

const DropdownMenuGroup = ShadcnDropdownMenuGroup;

const DropdownMenuLabel = ShadcnDropdownMenuLabel;

const DropdownMenuSeparator = ShadcnDropdownMenuSeparator;

const DropdownMenuShortcut = ShadcnDropdownMenuShortcut;

const DropdownMenuSub = ShadcnDropdownMenuSub;

const DropdownMenuCheckboxItem = ShadcnDropdownMenuCheckboxItem;

function DropdownMenuSubTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.DropdownMenuSubTrigger>) {
  return (
    <ShadcnDropdownMenuSubTrigger
      className={cn(
        "focus:border-foreground hover:border-foreground dark:focus:border-ring data-[state=open]:border-foreground dark:data-[state=open]:border-ring rounded-none border-y-4 border-dashed border-transparent bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent data-[state=open]:bg-transparent",
        className,
      )}
      {...props}
    >
      {children}
    </ShadcnDropdownMenuSubTrigger>
  );
}

function DropdownMenuItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <ShadcnDropdownMenuItem
      className={cn(
        "focus:border-foreground hover:border-foreground dark:focus:border-ring rounded-none border-y-3 border-dashed border-transparent bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent",
        className,
      )}
      {...props}
    >
      {children}
    </ShadcnDropdownMenuItem>
  );
}

export const dropDownVariants = cva("", {
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

function DropdownMenuSubContent({
  children,
  className,
  font,
  ...props
}: BitDropownMenuContentProps) {
  return (
    <ShadcnDropdownMenuSubContent
      {...props}
      className={cn("bg-popover", font !== "normal" && "retro", className)}
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
    </ShadcnDropdownMenuSubContent>
  );
}

export interface BitDropownMenuContentProps
  extends React.ComponentProps<typeof DropdownMenuPrimitive.Content>,
    VariantProps<typeof dropDownVariants> {}

function DropdownMenuContent({
  children,
  font,
  className,
  ...props
}: BitDropownMenuContentProps) {
  return (
    <ShadcnDropdownMenuContent
      className={cn("mt-1 py-2", font !== "normal" && "retro", className)}
      {...props}
    >
      {children}

      <div
        className="border-foreground dark:border-ring pointer-events-none absolute inset-0 -mx-1.5 mt-2.5 border-x-6"
        aria-hidden="true"
      />
      <div
        className="border-foreground dark:border-ring pointer-events-none absolute inset-0 -my-1.5 mt-1 border-y-6"
        aria-hidden="true"
      />
    </ShadcnDropdownMenuContent>
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
  DropdownMenuShortcut,
  DropdownMenuSub,
};

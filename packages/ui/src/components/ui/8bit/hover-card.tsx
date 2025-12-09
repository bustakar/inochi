import type * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

import { cn } from "../../../lib/utils";
import {
  HoverCard as ShadcnHoverCard,
  HoverCardContent as ShadcnHoverCardContent,
  HoverCardTrigger as ShadcnHoverCardTrigger,
} from "../../hover-card";

import "./styles/retro.css";

export const hoverCardVariants = cva("", {
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

export interface BitHoverCardProps
  extends React.ComponentProps<typeof HoverCardPrimitive.Content>,
    VariantProps<typeof hoverCardVariants> {}

function HoverCard({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  return <ShadcnHoverCard {...props} />;
}

function HoverCardTrigger({
  className,
  asChild = true,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return (
    <ShadcnHoverCardTrigger
      className={cn(className)}
      asChild={asChild}
      {...props}
    />
  );
}

function HoverCardContent({
  children,
  className,
  font,
  ...props
}: BitHoverCardProps) {
  return (
    <ShadcnHoverCardContent
      className={cn(
        "relative",
        hoverCardVariants({
          font,
          className,
        }),
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
    </ShadcnHoverCardContent>
  );
}

export { HoverCard, HoverCardTrigger, HoverCardContent };

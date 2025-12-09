import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

import {
  Alert as ShadcnAlert,
  AlertDescription as ShadcnAlertDescription,
  AlertTitle as ShadcnAlertTitle,
} from "../alert";
import { cn } from "../lib/utils";

export const alertVariants = cva("", {
  variants: {
    font: {
      normal: "",
      retro: "retro",
    },
    variant: {
      default: "bg-card text-card-foreground",
      destructive:
        "text-destructive bg-card *:data-[slot=alert-description]:text-destructive/90 [&>svg]:text-current",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BitAlertProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof alertVariants> {}

function Alert({ children, ...props }: BitAlertProps) {
  const { variant, className, font } = props;

  return (
    <div className={cn("relative m-1.5", className)}>
      <ShadcnAlert
        {...props}
        variant={variant}
        className={cn(
          "bg-background relative rounded-none border-none",
          font !== "normal" && "retro",
          className,
        )}
      >
        {children}
      </ShadcnAlert>

      <div className="bg-foreground dark:bg-ring absolute -top-1.5 left-1.5 h-1.5 w-1/2" />
      <div className="bg-foreground dark:bg-ring absolute -top-1.5 right-1.5 h-1.5 w-1/2" />
      <div className="bg-foreground dark:bg-ring absolute -bottom-1.5 left-1.5 h-1.5 w-1/2" />
      <div className="bg-foreground dark:bg-ring absolute right-1.5 -bottom-1.5 h-1.5 w-1/2" />
      <div className="bg-foreground dark:bg-ring absolute top-0 left-0 size-1.5" />
      <div className="bg-foreground dark:bg-ring absolute top-0 right-0 size-1.5" />
      <div className="bg-foreground dark:bg-ring absolute bottom-0 left-0 size-1.5" />
      <div className="bg-foreground dark:bg-ring absolute right-0 bottom-0 size-1.5" />
      <div className="bg-foreground dark:bg-ring absolute top-1.5 -left-1.5 h-1/2 w-1.5" />
      <div className="bg-foreground dark:bg-ring absolute bottom-1.5 -left-1.5 h-1/2 w-1.5" />
      <div className="bg-foreground dark:bg-ring absolute top-1.5 -right-1.5 h-1/2 w-1.5" />
      <div className="bg-foreground dark:bg-ring absolute -right-1.5 bottom-1.5 h-1/2 w-1.5" />
    </div>
  );
}

function AlertTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <ShadcnAlertTitle
      className={cn("line-clamp-1 font-medium tracking-tight", className)}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <ShadcnAlertDescription
      className={cn(
        "text-muted-foreground grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };

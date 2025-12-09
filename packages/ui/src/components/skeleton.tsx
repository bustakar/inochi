import { cn } from "../lib/utils";
import { Skeleton as ShadcnSkeleton } from "../skeleton";

import "./styles/retro.css";

export interface BitSkeletonProp extends React.ComponentProps<"div"> {
  asChild?: boolean;
}

function Skeleton({ children, ...props }: BitSkeletonProp) {
  const { className } = props;

  return (
    <div className={cn("relative animate-pulse", className)}>
      <ShadcnSkeleton
        {...props}
        className={cn("bg-accent rounded-none border-none", "retro", className)}
      >
        {children}
      </ShadcnSkeleton>

      <div className="opacity-60">
        <div className="bg-foreground dark:bg-ring absolute -top-1.5 left-1.5 h-1.5 w-1/2" />
        <div className="bg-foreground dark:bg-ring absolute -top-1.5 right-1.5 h-1.5 w-1/2" />
      </div>
      <div className="opacity-60">
        <div className="bg-foreground dark:bg-ring absolute -bottom-1.5 left-1.5 h-1.5 w-1/2" />
        <div className="bg-foreground dark:bg-ring absolute right-1.5 -bottom-1.5 h-1.5 w-1/2" />
      </div>
      <div className="bg-foreground/60 dark:bg-ring/60 absolute top-0 left-0 size-1.5" />
      <div className="bg-foreground/60 dark:bg-ring/60 absolute top-0 right-0 size-1.5" />
      <div className="bg-foreground/60 dark:bg-ring/60 absolute bottom-0 left-0 size-1.5" />
      <div className="bg-foreground/60 dark:bg-ring/60 absolute right-0 bottom-0 size-1.5" />
      <div className="opacity-60">
        <div className="bg-foreground dark:bg-ring absolute top-1 -left-1.5 h-1/2 w-1.5" />
        <div className="bg-foreground dark:bg-ring absolute bottom-1 -left-1.5 h-1/2 w-1.5" />
      </div>
      <div className="opacity-60">
        <div className="bg-foreground dark:bg-ring absolute top-1 -right-1.5 h-1/2 w-1.5" />
        <div className="bg-foreground dark:bg-ring absolute -right-1.5 bottom-1 h-1/2 w-1.5" />
      </div>
    </div>
  );
}

export { Skeleton };

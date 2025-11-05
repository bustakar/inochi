import { DatabaseZap } from "lucide-react";

import { cn } from "@inochi/ui";

export const Logo = ({
  className,
  uniColor,
}: {
  className?: string;
  uniColor?: boolean;
}) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DatabaseZap
        className={cn("h-5 w-5", uniColor ? "text-foreground" : "text-primary")}
      />
      <span className="text-foreground text-lg font-semibold">inochi</span>
    </div>
  );
};

export const LogoIcon = ({
  className,
  uniColor,
}: {
  className?: string;
  uniColor?: boolean;
}) => {
  return (
    <DatabaseZap
      className={cn(
        "size-5",
        className,
        uniColor ? "text-foreground" : "text-primary",
      )}
    />
  );
};

export const LogoStroke = ({ className }: { className?: string }) => {
  return (
    <DatabaseZap
      className={cn("size-7 w-7 stroke-1", className)}
      strokeWidth={1.5}
    />
  );
};

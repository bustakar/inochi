import { cn } from "@inochi/ui";

const ServerIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
  >
    <path
      d="M3 3h18v18H3V3zm2 2v6h14V5H5zm14 8H5v6h14v-6zM7 7h2v2H7V7zm2 8H7v2h2v-2z"
      fill="currentColor"
    />
  </svg>
);

export const Logo = ({
  className,
  uniColor,
}: {
  className?: string;
  uniColor?: boolean;
}) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ServerIcon
        className={cn("h-5 w-5", uniColor ? "text-foreground" : "text-primary")}
      />
      <span className="retro text-foreground text-lg font-semibold">
        inochi
      </span>
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
    <ServerIcon
      className={cn(
        "size-5",
        className,
        uniColor ? "text-foreground" : "text-primary",
      )}
    />
  );
};

export const LogoStroke = ({ className }: { className?: string }) => {
  return <ServerIcon className={cn("size-7 w-7", className)} />;
};

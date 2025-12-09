import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { MoreHorizontal } from "lucide-react";

import type { Button } from "../button";
import { cn } from "../../../lib/utils";
import {
  Pagination as ShadcnPagination,
  PaginationContent as ShadcnPaginationContent,
  PaginationEllipsis as ShadcnPaginationEllipsis,
  PaginationItem as ShadcnPaginationItem,
  PaginationLink as ShadcnPaginationLink,
} from "../../pagination";

import "./styles/retro.css";

export const paginationVariants = cva("", {
  variants: {
    font: {
      normal: "",
      retro: "retro",
    },
    variant: {
      default: "text-card-foreground",
      destructive:
        "text-destructive *:data-[slot=alert-description]:text-destructive/90 [&>svg]:text-current",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type BitPaginationProps<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  keyof VariantProps<typeof paginationVariants>
> &
  VariantProps<typeof paginationVariants>;

function Pagination({ ...props }: BitPaginationProps<"nav">) {
  const { variant, className, font } = props;
  return (
    <ShadcnPagination
      {...props}
      className={cn(
        paginationVariants({ variant }),
        font !== "normal" && "retro",
        className,
      )}
    />
  );
}

const ChevronLeftIcon = () => {
  return (
    <svg
      width="50"
      height="50"
      viewBox="0 0 256 256"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth="0.25"
      color=""
      className="size-7"
      aria-label="chevron-left"
    >
      <rect
        width="14"
        height="14"
        rx="1"
        transform="matrix(-1 0 0 1 128 136)"
      ></rect>
      <rect
        width="14"
        height="14"
        rx="1"
        transform="matrix(-1 0 0 1 144 152)"
      ></rect>
      <rect
        width="14"
        height="14"
        rx="1"
        transform="matrix(-1 0 0 1 160 72)"
      ></rect>
      <rect
        width="14"
        height="14"
        rx="1"
        transform="matrix(-1 0 0 1 160 168)"
      ></rect>
      <rect
        width="14"
        height="14"
        rx="1"
        transform="matrix(-1 0 0 1 112 120)"
      ></rect>
      <rect
        width="14"
        height="14"
        rx="1"
        transform="matrix(-1 0 0 1 128 104)"
      ></rect>
      <rect
        width="14"
        height="14"
        rx="1"
        transform="matrix(-1 0 0 1 144 88)"
      ></rect>
    </svg>
  );
};

const ChevronRightIcon = () => {
  return (
    <svg
      width="50"
      height="50"
      viewBox="0 0 256 256"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth="0.25"
      color=""
      className="raster-icon size-7"
      aria-label="chevron-right"
    >
      <rect x="128" y="136" width="14" height="14" rx="1"></rect>
      <rect x="112" y="152" width="14" height="14" rx="1"></rect>
      <rect x="96" y="72" width="14" height="14" rx="1"></rect>
      <rect x="96" y="168" width="14" height="14" rx="1"></rect>
      <rect x="144" y="120" width="14" height="14" rx="1"></rect>
      <rect x="128" y="104" width="14" height="14" rx="1"></rect>
      <rect x="112" y="88" width="14" height="14" rx="1"></rect>
    </svg>
  );
};

function PaginationContent({ ...props }: BitPaginationProps<"ul">) {
  const { className, font } = props;
  return (
    <ShadcnPaginationContent
      className={cn("gap-2", font !== "normal" && "retro", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: BitPaginationProps<"li">) {
  const { className, font } = props;
  return (
    <ShadcnPaginationItem
      className={cn(font !== "normal" && "retro", className)}
      {...props}
    />
  );
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  BitPaginationProps<"a">;

function PaginationLink({ ...props }: PaginationLinkProps) {
  const { font, children, isActive, className } = props;
  return (
    <ShadcnPaginationLink
      className={cn(
        font !== "normal" && "retro",
        className,
        "group relative",
        "bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent",
        "rounded-none border-y-4 border-dashed border-transparent",
        "dark:hover:border-ring dark:focus:border-ring",
        "hover:border-foreground focus:border-foreground",
        "active:border-transparent",
        "aria-[current=page]:border-none data-[active=true]:border-none",
      )}
      {...props}
    >
      {children}

      {isActive && (
        <div
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ zIndex: 10 }}
        >
          <div
            className="bg-foreground dark:bg-ring pointer-events-none absolute top-0 left-0 h-1.5 w-full"
            aria-hidden="true"
          />
          <div
            className="bg-foreground dark:bg-ring pointer-events-none absolute bottom-0 left-0 h-1.5 w-full"
            aria-hidden="true"
          />
          <div
            className="bg-foreground dark:bg-ring pointer-events-none absolute top-1 -left-1 h-1/2 w-1.5"
            aria-hidden="true"
          />
          <div
            className="bg-foreground dark:bg-ring pointer-events-none absolute bottom-1 -left-1 h-1/2 w-1.5"
            aria-hidden="true"
          />
          <div
            className="bg-foreground dark:bg-ring pointer-events-none absolute top-1 -right-1 h-1/2 w-1.5"
            aria-hidden="true"
          />
          <div
            className="bg-foreground dark:bg-ring pointer-events-none absolute -right-1 bottom-1 h-1/2 w-1.5"
            aria-hidden="true"
          />
        </div>
      )}
    </ShadcnPaginationLink>
  );
}

function PaginationPrevious({
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  const { font, className } = props;
  return (
    <PaginationLink
      className={cn(
        "group relative",
        "flex w-full flex-row text-sm",
        "bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent",
        "rounded-none border-y-4 border-dashed border-transparent",
        "hover:border-foreground focus:border-foreground active:border-transparent",
        "dark:hover:border-ring dark:focus:border-ring",
        "aria-[current=page]:border-none data-[active=true]:border-none",
        font !== "normal" && "retro",
        className,
      )}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="hidden sm:block">Previous</span>
    </PaginationLink>
  );
}

function PaginationNext({
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  const { font, className } = props;

  return (
    <PaginationLink
      className={cn(
        "group relative",
        "flex w-full flex-row text-sm",
        "bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent",
        "rounded-none border-y-4 border-dashed border-transparent",
        "hover:border-foreground focus:border-foreground active:border-transparent",
        "dark:hover:border-ring dark:focus:border-ring",
        "aria-[current=page]:border-none data-[active=true]:border-none",
        "flex w-full flex-row text-sm",
        font !== "normal" && "retro",
        className,
      )}
      {...props}
    >
      <span className="hidden sm:block">Next</span>
      <ChevronRightIcon />
    </PaginationLink>
  );
}

function PaginationEllipsis({ ...props }: BitPaginationProps<"span">) {
  const { font, className } = props;

  return (
    <ShadcnPaginationEllipsis
      className={cn(font !== "normal" && "retro", className)}
      {...props}
    >
      <MoreHorizontal className={cn("size-7", "retro")} />
      <span className="sr-only">More pages</span>
    </ShadcnPaginationEllipsis>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};

import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

import {
  InputOTP as ShadcnInputOTP,
  InputOTPGroup as ShadcnInputOTPGroup,
  InputOTPSeparator as ShadcnInputOTPSeparator,
  InputOTPSlot as ShadcnInputOTPSlot,
} from "../input-otp";
import { cn } from "../lib/utils";

import "./styles/retro.css";

export const inputOtpVariants = cva("", {
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

interface SharedProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof inputOtpVariants> {
  className?: string;
  children?: React.ReactNode;
}

interface InputOTPProps {
  maxLength: number;
  value?: string;
  onChange?: (value: string) => unknown;
  children?: React.ReactNode;
  className?: string;
  font?: "normal" | "retro";
}

export const InputOTP = ({
  className,
  font,
  maxLength,
  value,
  onChange,
  children,
  ...otherProps
}: InputOTPProps) => {
  return (
    <div className={cn("relative w-fit", className)}>
      <ShadcnInputOTP
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        {...otherProps}
        className={cn(font !== "normal" && "retro", className)}
      >
        {children}
      </ShadcnInputOTP>
    </div>
  );
};

export const InputOTPGroup = ({ className, ...props }: SharedProps) => {
  return (
    <ShadcnInputOTPGroup {...props} className={cn("flex gap-2", className)} />
  );
};

export const InputOTPSlot = ({
  className,
  font,
  index = 0,
  ...props
}: SharedProps & { index?: number }) => {
  return (
    <div className="border-foreground dark:border-ring relative size-12 border-y-6">
      <ShadcnInputOTPSlot
        index={index}
        {...props}
        className={cn(
          "z-0 size-full border-transparent pl-1 text-center text-xl tracking-widest ring-0",
          font !== "normal" && "retro",
          className,
        )}
      />

      <div
        className="border-foreground dark:border-ring pointer-events-none absolute inset-0 -mx-1.5 border-x-6"
        aria-hidden="true"
      />
    </div>
  );
};

export const InputOTPSeparator = ({ className, ...props }: SharedProps) => {
  return <ShadcnInputOTPSeparator {...props} className={cn("", className)} />;
};

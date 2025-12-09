import type * as React from "react";

interface PixelIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function PixelGrid({ className, ...props }: PixelIconProps) {
  return (
    <svg
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      {...props}
    >
      <path
        d="M2 2h20v20H2V2zm2 2v4h4V4H4zm6 0v4h4V4h-4zm6 0v4h4V4h-4zm4 6h-4v4h4v-4zm0 6h-4v4h4v-4zm-6 4v-4h-4v4h4zm-6 0v-4H4v4h4zm-4-6h4v-4H4v4zm6-4v4h4v-4h-4z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PixelUser({ className, ...props }: PixelIconProps) {
  return (
    <svg
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      {...props}
    >
      <path
        d="M15 2H9v2H7v6h2V4h6V2zm0 8H9v2h6v-2zm0-6h2v6h-2V4zM4 16h2v-2h12v2H6v4h12v-4h2v6H4v-6z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PixelMenu({ className, ...props }: PixelIconProps) {
  return (
    <svg
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      {...props}
    >
      <path
        d="M2 4h20v2H2V4zm0 6h20v2H2v-2zm0 6h20v2H2v-2z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PixelLog({ className, ...props }: PixelIconProps) {
  return (
    <svg
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      {...props}
    >
      <path
        d="M6 2h12v2H6V2zm0 4h12v14H6V6zm2 2v10h8V8H8zm2 2h4v2h-4v-2zm0 4h4v2h-4v-2z"
        fill="currentColor"
      />
    </svg>
  );
}

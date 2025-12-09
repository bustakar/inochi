"use client";

import { toast as sonnerToast } from "sonner";

import "./styles/retro.css";

export function toast(toast: string) {
  return sonnerToast.custom((id) => <Toast id={id} title={toast} />);
}

interface ToastProps {
  id: string | number;
  title: string;
}

function Toast(props: ToastProps) {
  const { title } = props;

  return (
    <div className={`relative ${"retro"}`}>
      <div className="bg-background flex w-full items-center rounded-lg p-4 shadow-lg ring-1 ring-black/5 md:max-w-[364px]">
        <div className="flex flex-1 items-center">
          <div className="w-full">
            <p className="text-sm font-medium">{title}</p>
          </div>
        </div>
      </div>

      <div className="bg-foreground dark:bg-ring absolute -top-1.5 left-1.5 h-1.5 w-1/2" />
      <div className="bg-foreground dark:bg-ring absolute -top-1.5 right-1.5 h-1.5 w-1/2" />
      <div className="bg-foreground dark:bg-ring absolute -bottom-1.5 left-1.5 h-1.5 w-1/2" />
      <div className="bg-foreground dark:bg-ring absolute right-1.5 -bottom-1.5 h-1.5 w-1/2" />
      <div className="bg-foreground dark:bg-ring absolute top-0 left-0 size-1.5" />
      <div className="bg-foreground dark:bg-ring absolute top-0 right-0 size-1.5" />
      <div className="bg-foreground dark:bg-ring absolute bottom-0 left-0 size-1.5" />
      <div className="bg-foreground dark:bg-ring absolute right-0 bottom-0 size-1.5" />
      <div className="bg-foreground dark:bg-ring absolute top-1 -left-1.5 h-1/2 w-1.5" />
      <div className="bg-foreground dark:bg-ring absolute bottom-1 -left-1.5 h-1/2 w-1.5" />
      <div className="bg-foreground dark:bg-ring absolute top-1 -right-1.5 h-1/2 w-1.5" />
      <div className="bg-foreground dark:bg-ring absolute -right-1.5 bottom-1 h-1/2 w-1.5" />
    </div>
  );
}

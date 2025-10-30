import { cx } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: Parameters<typeof cx>) => twMerge(cx(inputs));

// Core components
export * from "./badge";
export * from "./button";
export * from "./card";
export * from "./collapsible";
export * from "./dialog";
export * from "./field";
export * from "./form";
export * from "./input";
export * from "./label";
export * from "./separator";
export * from "./sheet";
export * from "./skeleton";
export * from "./sonner";
export * from "./spinner";
export * from "./textarea";
export * from "./tooltip";

// Sidebar components
export * from "./sidebar";

// Hooks
export * from "./hooks/use-mobile";

// Utils
export * from "./lib/utils";

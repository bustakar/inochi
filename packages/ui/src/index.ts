import { cx } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: Parameters<typeof cx>) => twMerge(cx(inputs));

// Core components
export { AnimatedGroup } from "./components/animated-group";
export * from "./components/badge";
export * from "./components/button";
export * from "./components/card";
export * from "./components/collapsible";
export * from "./components/dialog";
export * from "./components/dropdown-menu";
export * from "./components/field";
export * from "./components/form";
export * from "./components/input";
export * from "./components/label";
export * from "./components/separator";
export * from "./components/sheet";
export * from "./components/skeleton";
export * from "./components/sonner";
export * from "./components/spinner";
export * from "./components/text-effect";
export * from "./components/textarea";
export * from "./components/tooltip";

// Sidebar components
export * from "./components/sidebar";

// Hooks
export * from "./hooks/use-mobile";

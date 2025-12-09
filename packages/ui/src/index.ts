import { cx } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: Parameters<typeof cx>) => twMerge(cx(inputs));

// Core components
export * from "./components/alert-dialog";
export { AnimatedGroup } from "./components/animated-group";
export * from "./components/badge";
export * from "./components/button";
export * from "./components/button-group";
export * from "./components/card";
export * from "./components/checkbox";
export * from "./components/collapsible";
export * from "./components/dialog";
export * from "./components/dropdown-menu";
export * from "./components/field";
export * from "./components/form";
export * from "./components/input";
export * from "./components/input-group";
export * from "./components/label";
export * from "./components/radio-group";
export * from "./components/select";
export * from "./components/separator";
export * from "./components/sheet";
export * from "./components/skeleton";
export * from "./components/sonner";
export * from "./components/spinner";
export * from "./components/switch";
export * from "./components/table";
export * from "./components/text-effect";
export * from "./components/textarea";
export * from "./components/toggle";
export * from "./components/toggle-group";
export * from "./components/tooltip";

// Sidebar components
export * from "./components/sidebar";

// 8bit components
export { Badge as BitBadge } from "./components/ui/8bit/badge";
export { Button as BitButton } from "./components/ui/8bit/button";
export {
  Card as BitCard,
  CardAction as BitCardAction,
  CardContent as BitCardContent,
  CardDescription as BitCardDescription,
  CardFooter as BitCardFooter,
  CardHeader as BitCardHeader,
  CardTitle as BitCardTitle,
} from "./components/ui/8bit/card";
export { HealthBar } from "./components/ui/8bit/health-bar";
export { Separator as BitSeparator } from "./components/ui/8bit/separator";
export { toast } from "./components/ui/8bit/toast";

// Hooks
export * from "./hooks/use-mobile";

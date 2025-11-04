import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { z } from "zod";

export const skillFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  level: z.enum(["beginner", "intermediate", "advanced", "expert", "elite"], {
    error: "Level is required",
  }),
  difficulty: z
    .number()
    .int("Difficulty must be an integer")
    .min(1, "Difficulty must be at least 1")
    .max(10, "Difficulty must be at most 10"),
  muscles: z.array(z.custom<Id<"muscles">>()),
  equipment: z.array(z.custom<Id<"equipment">>()),
  embedded_videos: z.array(z.url("Each video must be a valid URL")),
  prerequisites: z.array(z.custom<Id<"skills">>()),
  variants: z.array(z.custom<Id<"skills">>()),
  tips: z.array(z.string().min(1, "Tip cannot be empty")),
});

export type SkillFormData = z.infer<typeof skillFormSchema>;

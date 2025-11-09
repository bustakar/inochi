import { Id } from "@packages/backend/convex/_generated/dataModel";
import { z } from "zod";

export const exerciseSubmissionFormSchema = z.object({
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
  category: z.enum(["calisthenics", "gym", "stretch", "mobility"], {
    error: "Category is required",
  }),
  muscles: z.array(z.custom<Id<"muscles">>()),
  equipment: z.array(z.custom<Id<"equipment">>()),
  embedded_videos: z.array(z.url("Each video must be a valid URL")),
  prerequisites: z.array(z.custom<Id<"exercises"> | Id<"private_exercises">>()),
  tips: z.array(z.string().min(1, "Tip cannot be empty")),
});

export type ExerciseSubmissionFormData = z.output<
  typeof exerciseSubmissionFormSchema
>;

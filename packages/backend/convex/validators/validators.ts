import { Infer, v } from "convex/values";

export const exerciseLevelValidator = v.union(
  v.literal("beginner"),
  v.literal("intermediate"),
  v.literal("advanced"),
  v.literal("expert"),
  v.literal("elite"),
  v.literal("legendary"),
);

export type ExerciseLevel = Infer<typeof exerciseLevelValidator>;

export const muscleRoleValidator = v.union(
  v.literal("primary"),
  v.literal("secondary"),
  v.literal("stabilizer"),
);

export type MuscleRole = Infer<typeof muscleRoleValidator>;

export function validateDifficulty(difficulty: number): void {
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 10) {
    throw new Error("Difficulty must be an integer between 1 and 10");
  }
}

export type ExerciseVariant = Infer<typeof exerciseVariantValidator>;

export const exerciseVariantValidator = v.object({
  equipment: v.array(v.string()), // Equipment slug
  tips: v.array(
    v.object({
      text: v.string(),
      videoUrl: v.optional(v.string()),
      exerciseReference: v.optional(v.id("exercises")),
    }),
  ),
  overriddenTitle: v.optional(v.string()),
  overriddenDescription: v.optional(v.string()),
  overriddenDifficulty: v.optional(v.number()),
  overriddenMuscles: v.optional(v.array(v.string())), // Muscle slug
});

export const exerciseValidator = v.object({
  title: v.string(),
  description: v.optional(v.string()),
  level: v.optional(exerciseLevelValidator),
  difficulty: v.optional(v.number()),
  variants: v.optional(v.array(exerciseVariantValidator)),
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.string(),
});

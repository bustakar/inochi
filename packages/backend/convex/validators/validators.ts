import { v } from "convex/values";

// Level enum validator - matches schema
export const exerciseLevelValidator = v.union(
  v.literal("beginner"),
  v.literal("intermediate"),
  v.literal("advanced"),
  v.literal("expert"),
  v.literal("elite"),
);

// Muscle role validator for exercise-muscle relationships
export const muscleRoleValidator = v.union(
  v.literal("primary"),
  v.literal("secondary"),
  v.literal("tertiary"),
  v.literal("stabilizer"),
);

export const exerciseCategoryValidator = v.union(
  v.literal("calisthenics"),
  v.literal("gym"),
  v.literal("stretch"),
  v.literal("mobility"),
);

// Shared skill data validator - can be used for both public and private skills
export const skillDataValidator = v.object({
  title: v.string(),
  description: v.string(),
  level: exerciseLevelValidator,
  difficulty: v.number(),
  muscles: v.array(v.id("muscles")),
  equipment: v.array(v.id("equipment")),
  embedded_videos: v.array(v.string()),
  prerequisites: v.array(v.union(v.id("skills"), v.id("private_skills"))),
  variants: v.array(v.union(v.id("skills"), v.id("private_skills"))),
  tips: v.array(v.string()),
});

export const createPrivateSkillValidator = v.object({
  title: v.string(),
});

// Validator for creating private exercises
export const createPrivateExerciseValidator = v.object({
  title: v.string(),
  description: v.optional(v.string()),
  level: v.optional(exerciseLevelValidator),
  difficulty: v.optional(v.number()),
  category: v.optional(exerciseCategoryValidator),
  muscles: v.optional(v.array(v.id("muscles"))),
});

// Partial skill data validator for updates
export const partialSkillDataValidator = v.object({
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  level: v.optional(exerciseLevelValidator),
  difficulty: v.optional(v.number()),
  muscles: v.optional(v.array(v.id("muscles"))),
  equipment: v.optional(v.array(v.id("equipment"))),
  embedded_videos: v.optional(v.array(v.string())),
  prerequisites: v.optional(
    v.array(v.union(v.id("skills"), v.id("private_skills"))),
  ),
  variants: v.optional(
    v.array(v.union(v.id("skills"), v.id("private_skills"))),
  ),
  tips: v.optional(v.array(v.string())),
});

// Exercise data validator for updates
export const updatePrivateExerciseValidator = v.object({
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  category: v.optional(exerciseCategoryValidator),
  level: v.optional(exerciseLevelValidator),
  difficulty: v.optional(v.number()),
  prerequisites: v.optional(v.array(v.id("exercises"))),
  progressionFrom: v.optional(v.array(v.id("exercises"))),
  progressionTo: v.optional(v.array(v.id("exercises"))),
});

/**
 * Validates that a number is between 1 and 10 (inclusive)
 * Used for skill difficulty validation
 */
export function validateDifficulty(difficulty: number): void {
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 10) {
    throw new Error("Difficulty must be an integer between 1 and 10");
  }
}

/**
 * Validates that a string is a valid URL
 * Used for embedded_videos array validation
 */
export function validateUrl(url: string): void {
  try {
    new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}

/**
 * Validates an array of URLs
 */
export function validateUrlArray(urls: string[]): void {
  urls.forEach((url) => validateUrl(url));
}

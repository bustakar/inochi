import { v } from "convex/values";

// Level enum validator - matches schema
export const levelValidator = v.union(
  v.literal("beginner"),
  v.literal("intermediate"),
  v.literal("advanced"),
  v.literal("expert"),
  v.literal("elite"),
);

// Shared skill data validator - can be used for both public and private skills
export const skillDataValidator = v.object({
  title: v.string(),
  description: v.string(),
  level: levelValidator,
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
  description: v.string(),
  level: levelValidator,
  difficulty: v.number(),
});

// Partial skill data validator for updates
export const partialSkillDataValidator = v.object({
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  level: v.optional(levelValidator),
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

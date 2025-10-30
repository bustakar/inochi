import { v } from "convex/values";

// Level enum validator - matches schema
export const levelValidator = v.union(
  v.literal("beginner"),
  v.literal("intermediate"),
  v.literal("advanced"),
  v.literal("expert"),
  v.literal("elite"),
);

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

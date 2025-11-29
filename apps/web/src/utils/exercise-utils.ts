import type {
  ExerciseLevel,
  MuscleRole,
} from "@packages/backend/convex/validators/validators";

/**
 * Color classes for exercise levels
 */
export const exerciseLevelColors: Record<ExerciseLevel, string> = {
  beginner:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  intermediate:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  advanced:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  expert:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  elite: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  legendary:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
};

/**
 * Get color classes for an exercise level
 */
export function getExerciseLevelColor(level: ExerciseLevel): string {
  return exerciseLevelColors[level];
}

/**
 * Human-readable labels for muscle roles
 */
export const muscleRoleLabels: Record<MuscleRole, string> = {
  primary: "Primary",
  secondary: "Secondary",
  stabilizer: "Stabilizer",
};

/**
 * Get human-readable label for a muscle role
 */
export function getMuscleRoleLabel(role: MuscleRole): string {
  return muscleRoleLabels[role];
}

/**
 * All exercise levels in order
 */
export const exerciseLevels: ExerciseLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
  "elite",
  "legendary",
];

/**
 * All muscle roles in order
 */
export const muscleRoles: MuscleRole[] = ["primary", "secondary", "stabilizer"];

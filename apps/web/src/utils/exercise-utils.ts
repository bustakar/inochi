import type {
  ExerciseLevel,
  MuscleRole,
  ProgressStatus,
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

/**
 * Human-readable labels for progress statuses
 */
export const progressStatusLabels: Record<ProgressStatus, string> = {
  novice: "Novice",
  apprentice: "Apprentice",
  journeyman: "Journeyman",
  master: "Master",
};

/**
 * Get human-readable label for a progress status
 */
export function getProgressStatusLabel(status: ProgressStatus): string {
  return progressStatusLabels[status];
}

/**
 * Color classes for progress statuses
 */
export const progressStatusColors: Record<ProgressStatus, string> = {
  novice: "bg-gray-500 text-white",
  apprentice: "bg-blue-500 text-white",
  journeyman: "bg-purple-500 text-white",
  master: "bg-yellow-500 text-black",
};

/**
 * Get color classes for a progress status
 */
export function getProgressStatusColor(status: ProgressStatus): string {
  return progressStatusColors[status];
}

/**
 * All progress statuses in order
 */
export const progressStatuses: ProgressStatus[] = [
  "novice",
  "apprentice",
  "journeyman",
  "master",
];

import type {
  ExerciseLevel,
  MuscleRole,
  ProgressStatus,
} from "@packages/backend/convex/validators/validators";

/**
 * Color values for exercise levels (React Native compatible)
 */
export const exerciseLevelColors: Record<
  ExerciseLevel,
  { bg: string; text: string }
> = {
  beginner: {
    bg: "#DCFCE7", // green-100
    text: "#166534", // green-800
  },
  intermediate: {
    bg: "#DBEAFE", // blue-100
    text: "#1E40AF", // blue-800
  },
  advanced: {
    bg: "#E9D5FF", // purple-100
    text: "#6B21A8", // purple-800
  },
  expert: {
    bg: "#FFEDD5", // orange-100
    text: "#9A3412", // orange-800
  },
  elite: {
    bg: "#FEE2E2", // red-100
    text: "#991B1B", // red-800
  },
  legendary: {
    bg: "#FEF9C3", // yellow-100
    text: "#854D0E", // yellow-800
  },
};

/**
 * Get color values for an exercise level
 */
export function getExerciseLevelColor(level: ExerciseLevel): {
  bg: string;
  text: string;
} {
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
 * Color values for progress statuses (React Native compatible)
 */
export const progressStatusColors: Record<
  ProgressStatus,
  { bg: string; text: string }
> = {
  novice: {
    bg: "#6B7280", // gray-500
    text: "#FFFFFF",
  },
  apprentice: {
    bg: "#3B82F6", // blue-500
    text: "#FFFFFF",
  },
  journeyman: {
    bg: "#A855F7", // purple-500
    text: "#FFFFFF",
  },
  master: {
    bg: "#EAB308", // yellow-500
    text: "#000000",
  },
};

/**
 * Get color values for a progress status
 */
export function getProgressStatusColor(status: ProgressStatus): {
  bg: string;
  text: string;
} {
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

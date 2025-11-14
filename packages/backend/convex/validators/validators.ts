import { Infer, v } from "convex/values";

export const exerciseLevelValidator = v.union(
  v.literal("beginner"),
  v.literal("intermediate"),
  v.literal("advanced"),
  v.literal("expert"),
  v.literal("elite"),
);

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

export function validateDifficulty(difficulty: number): void {
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 10) {
    throw new Error("Difficulty must be an integer between 1 and 10");
  }
}

export const exerciseValidator = v.object({
  title: v.string(),
  description: v.optional(v.string()),
  category: v.optional(exerciseCategoryValidator),
  level: v.optional(exerciseLevelValidator),
  difficulty: v.optional(v.number()),
  muscles: v.optional(
    v.array(
      v.object({
        muscleId: v.id("muscles"),
        role: muscleRoleValidator,
      }),
    ),
  ),
  prerequisites: v.optional(
    v.array(v.union(v.id("exercises"), v.id("private_exercises"))),
  ),
  progressions: v.optional(
    v.array(v.union(v.id("exercises"), v.id("private_exercises"))),
  ),
});

export const tipV2Validator = v.object({
  text: v.string(),
  videoUrl: v.optional(v.string()),
  exerciseReference: v.optional(
    v.union(v.id("exercises"), v.id("private_exercises")),
  ),
});

export const exerciseVariantValidator = v.object({
  exercise: v.union(v.id("exercises"), v.id("private_exercises")),
  equipment: v.array(v.id("equipment")),
  tipsV2: v.optional(v.array(tipV2Validator)),
  overriddenTitle: v.optional(v.string()),
  overriddenDescription: v.optional(v.string()),
  overriddenDifficulty: v.optional(v.number()),
});
export type ExerciseVariant = Infer<typeof exerciseVariantValidator>;

export const submissionStatusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
);
export type SubmissionStatus = Infer<typeof submissionStatusValidator>;

export const submissionValidator = v.object({
  _id: v.id("user_submissions"),
  submissionType: v.union(v.literal("create"), v.literal("edit")),
  status: submissionStatusValidator,
  originalExerciseId: v.optional(
    v.union(v.id("exercises"), v.id("private_exercises")),
  ),
  originalExerciseData: v.optional(
    v.object({
      exercise: exerciseValidator,
      variants: v.array(exerciseVariantValidator),
    }),
  ),
  submittedBy: v.string(),
  submittedAt: v.number(),
  reviewedBy: v.optional(v.string()),
  reviewedAt: v.optional(v.number()),
  rejectionReason: v.optional(v.string()),
});
export type Submission = Infer<typeof submissionValidator>;

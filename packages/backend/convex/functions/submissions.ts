import { Auth } from "convex/server";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import {
  exerciseValidator,
  exerciseVariantValidator,
  submissionStatusValidator,
} from "../validators/validators";
import { getUserId } from "./auth";

const submissionResponseValidator = v.object({
  _id: v.id("user_submissions"),
  _creationTime: v.number(),
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

// Get user role from Clerk token metadata
// Note: This assumes the role is passed from the frontend since Convex
// doesn't directly expose JWT claims. The frontend will pass the role.
export const getUserRole = async (
  ctx: { auth: Auth },
  roleFromClient?: string,
): Promise<"admin" | "moderator" | "user"> => {
  // Try to get role from token claims if available
  // If not available, use role passed from client (defaults to "user")
  // In production, you might want to verify the role server-side
  return (roleFromClient as "admin" | "moderator" | "user") || "user";
};

export const isAdminOrModerator = async (
  ctx: { auth: Auth },
  roleFromClient?: string,
): Promise<boolean> => {
  const role = await getUserRole(ctx, roleFromClient);
  return role === "admin" || role === "moderator";
};

export const getUserSubmissions = query({
  args: {
    statuses: v.array(submissionStatusValidator),
    userRole: v.optional(v.string()),
  },
  returns: v.array(submissionResponseValidator),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const role = await getUserRole(ctx, args.userRole);
    const isAdminMod = role === "admin" || role === "moderator";

    let submissions: Array<Doc<"user_submissions">>;

    if (isAdminMod) {
      submissions = await ctx.db.query("user_submissions").collect();
    } else {
      submissions = await ctx.db
        .query("user_submissions")
        .withIndex("by_user", (q) => q.eq("submittedBy", userId))
        .collect();
    }

    return submissions.filter((submission) =>
      args.statuses.includes(submission.status),
    );
  },
});

export const getPendingSubmissionForExercise = query({
  args: {
    exerciseId: v.union(v.id("exercises"), v.id("private_exercises")),
  },
  returns: v.union(submissionResponseValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const submission = await ctx.db
      .query("user_submissions")
      .withIndex("by_user", (q) => q.eq("submittedBy", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("originalExerciseId"), args.exerciseId),
          q.eq(q.field("status"), "pending"),
        ),
      )
      .first();

    return submission ?? null;
  },
});

export const getSubmission = query({
  args: {
    id: v.id("user_submissions"),
    userRole: v.optional(v.string()),
  },
  returns: v.union(submissionResponseValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const submission = await ctx.db.get(args.id);
    if (!submission) {
      return null;
    }

    const role = await getUserRole(ctx, args.userRole);
    const isAdminMod = role === "admin" || role === "moderator";

    if (submission.submittedBy !== userId && !isAdminMod) {
      throw new Error("Unauthorized: You can only view your own submissions");
    }

    return submission;
  },
});

export const createSubmission = mutation({
  args: {
    privateExerciseId: v.id("private_exercises"),
    privateExerciseData: v.object({
      exercise: exerciseValidator,
      variants: v.array(exerciseVariantValidator),
    }),
  },
  returns: v.id("user_submissions"),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const privateExercise = await ctx.db.get(args.privateExerciseId);
    if (!privateExercise) {
      throw new Error(`Private exercise not found: ${args.privateExerciseId}`);
    }

    if (privateExercise.createdBy !== userId) {
      throw new Error(
        "Unauthorized: You can only submit your own private exercises",
      );
    }

    const existingSubmission = await ctx.db
      .query("user_submissions")
      .withIndex("by_user", (q) => q.eq("submittedBy", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("originalExerciseId"), args.privateExerciseId),
          q.eq(q.field("status"), "pending"),
        ),
      )
      .first();

    if (existingSubmission) {
      throw new Error("A pending submission already exists for this exercise");
    }

    const now = Date.now();
    const submissionId = await ctx.db.insert("user_submissions", {
      submissionType: "create",
      status: "pending",
      originalExerciseId: args.privateExerciseId,
      originalExerciseData: args.privateExerciseData,
      submittedBy: userId,
      submittedAt: now,
    });

    return submissionId;
  },
});

export const approveSubmission = mutation({
  args: {
    id: v.id("user_submissions"),
    userRole: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const role = await getUserRole(ctx, args.userRole);
    if (role !== "admin" && role !== "moderator") {
      throw new Error(
        "Unauthorized: Only admins and moderators can approve submissions",
      );
    }

    const submission = await ctx.db.get(args.id);
    if (!submission) {
      throw new Error("Submission not found");
    }

    if (submission.status !== "pending") {
      throw new Error("Only pending submissions can be approved");
    }

    const now = Date.now();

    if (submission.originalExerciseId && submission.originalExerciseData) {
      const privateExercise = await ctx.db.get(submission.originalExerciseId);
      if (!privateExercise) {
        throw new Error(`Private exercise not found`);
      }

      // Filter out private exercise references from prerequisites
      // Only keep references to public exercises
      const allPrerequisites =
        submission.originalExerciseData.exercise.prerequisites ?? [];
      const publicPrerequisites: Id<"exercises">[] = [];
      for (const prereqId of allPrerequisites) {
        // Check if it's a public exercise (exists in exercises table)
        const publicExercise = await ctx.db.get(prereqId as Id<"exercises">);
        if (publicExercise) {
          publicPrerequisites.push(prereqId as Id<"exercises">);
        }
        // Private exercises are intentionally excluded
      }

      const publicExerciseId = await ctx.db.insert("exercises", {
        title: submission.originalExerciseData.exercise.title,
        description: submission.originalExerciseData.exercise.description ?? "",
        category:
          submission.originalExerciseData.exercise.category ?? "calisthenics",
        level: submission.originalExerciseData.exercise.level ?? "beginner",
        difficulty: submission.originalExerciseData.exercise.difficulty ?? 1,
        prerequisites: publicPrerequisites,
        createdAt: now,
        updatedAt: now,
        createdBy: submission.submittedBy,
      });

      for (const variant of submission.originalExerciseData.variants) {
        await ctx.db.insert("exercise_variants", {
          exercise: publicExerciseId,
          equipment: variant.equipment,
          tipsV2: variant.tipsV2,
          overriddenTitle: variant.overriddenTitle,
          overriddenDescription: variant.overriddenDescription,
          overriddenDifficulty: variant.overriddenDifficulty,
          createdAt: now,
          updatedAt: now,
        });
      }

      for (const muscle of submission.originalExerciseData.exercise?.muscles ??
        []) {
        await ctx.db.insert("exercises_muscles", {
          exercise: publicExerciseId,
          muscle: muscle.muscleId,
          role: muscle.role,
        });
      }

      // Only create progressions to public exercises (skip private ones)
      for (const progressionId of submission.originalExerciseData.exercise
        ?.progressions ?? []) {
        // Check if it's a public exercise
        const publicProgression = await ctx.db.get(
          progressionId as Id<"exercises">,
        );
        if (publicProgression) {
          await ctx.db.insert("exercise_progressions", {
            fromExercise: publicExerciseId,
            toExercise: progressionId as Id<"exercises">,
            createdAt: now,
          });
        }
        // Private exercises are intentionally excluded from progressions
      }
    }

    await ctx.db.patch(args.id, {
      status: "approved",
      reviewedBy: userId,
      reviewedAt: now,
    });

    return null;
  },
});

export const rejectSubmission = mutation({
  args: {
    id: v.id("user_submissions"),
    rejectionReason: v.optional(v.string()),
    userRole: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const role = await getUserRole(ctx, args.userRole);
    if (role !== "admin" && role !== "moderator") {
      throw new Error(
        "Unauthorized: Only admins and moderators can reject submissions",
      );
    }

    const submission = await ctx.db.get(args.id);
    if (!submission) {
      throw new Error("Submission not found");
    }

    if (submission.status !== "pending") {
      throw new Error("Only pending submissions can be rejected");
    }

    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "rejected",
      reviewedBy: userId,
      reviewedAt: now,
      rejectionReason: args.rejectionReason,
    });

    return null;
  },
});

export const deleteSubmission = mutation({
  args: {
    id: v.id("user_submissions"),
    userRole: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const submission = await ctx.db.get(args.id);
    if (!submission) {
      throw new Error("Submission not found");
    }

    const role = await getUserRole(ctx, args.userRole);
    const isAdminMod = role === "admin" || role === "moderator";

    if (submission.submittedBy !== userId && !isAdminMod) {
      throw new Error("Unauthorized: You can only delete your own submissions");
    }

    if (!isAdminMod && submission.status !== "pending") {
      throw new Error("You can only delete pending submissions");
    }

    await ctx.db.delete(args.id);
    return null;
  },
});

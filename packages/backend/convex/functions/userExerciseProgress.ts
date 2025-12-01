import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { progressStatusValidator } from "../validators/validators";
import { getUserId } from "./auth";

// Get user's progress for a specific exercise
export const getUserExerciseProgress = query({
  args: {
    exerciseId: v.id("exercises"),
  },
  returns: v.union(
    v.object({
      _id: v.id("user_exercise_progress"),
      userId: v.string(),
      exerciseId: v.id("exercises"),
      status: progressStatusValidator,
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      return null;
    }

    const progress = await ctx.db
      .query("user_exercise_progress")
      .withIndex("by_user_and_exercise", (q) =>
        q.eq("userId", userId).eq("exerciseId", args.exerciseId),
      )
      .first();

    return progress ?? null;
  },
});

// Update user's progress for a specific exercise
export const updateUserExerciseProgress = mutation({
  args: {
    exerciseId: v.id("exercises"),
    status: progressStatusValidator,
  },
  returns: v.id("user_exercise_progress"),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Verify exercise exists
    const exercise = await ctx.db.get(args.exerciseId);
    if (!exercise) {
      throw new Error("Exercise not found");
    }

    // Check if progress record already exists
    const existingProgress = await ctx.db
      .query("user_exercise_progress")
      .withIndex("by_user_and_exercise", (q) =>
        q.eq("userId", userId).eq("exerciseId", args.exerciseId),
      )
      .first();

    const now = Date.now();

    if (existingProgress) {
      // Update existing record
      await ctx.db.patch(existingProgress._id, {
        status: args.status,
        updatedAt: now,
      });
      return existingProgress._id;
    } else {
      // Create new record
      return await ctx.db.insert("user_exercise_progress", {
        userId,
        exerciseId: args.exerciseId,
        status: args.status,
        updatedAt: now,
      });
    }
  },
});

// Batch update user's progress for multiple exercises
export const batchUpdateUserExerciseProgress = mutation({
  args: {
    exerciseIds: v.array(v.id("exercises")),
    status: progressStatusValidator,
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    if (args.exerciseIds.length === 0) {
      return 0;
    }

    const now = Date.now();
    let updatedCount = 0;

    for (const exerciseId of args.exerciseIds) {
      // Verify exercise exists
      const exercise = await ctx.db.get(exerciseId);
      if (!exercise) {
        continue; // Skip invalid exercise IDs
      }

      // Check if progress record already exists
      const existingProgress = await ctx.db
        .query("user_exercise_progress")
        .withIndex("by_user_and_exercise", (q) =>
          q.eq("userId", userId).eq("exerciseId", exerciseId),
        )
        .first();

      if (existingProgress) {
        // Update existing record
        await ctx.db.patch(existingProgress._id, {
          status: args.status,
          updatedAt: now,
        });
      } else {
        // Create new record
        await ctx.db.insert("user_exercise_progress", {
          userId,
          exerciseId,
          status: args.status,
          updatedAt: now,
        });
      }
      updatedCount++;
    }

    return updatedCount;
  },
});

// Batch update user's progress for multiple exercises with individual statuses
export const batchUpdateUserExerciseProgressWithStatuses = mutation({
  args: {
    updates: v.array(
      v.object({
        exerciseId: v.id("exercises"),
        status: progressStatusValidator,
      }),
    ),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    if (args.updates.length === 0) {
      return 0;
    }

    const now = Date.now();
    let updatedCount = 0;

    for (const { exerciseId, status } of args.updates) {
      // Verify exercise exists
      const exercise = await ctx.db.get(exerciseId);
      if (!exercise) {
        continue; // Skip invalid exercise IDs
      }

      // Check if progress record already exists
      const existingProgress = await ctx.db
        .query("user_exercise_progress")
        .withIndex("by_user_and_exercise", (q) =>
          q.eq("userId", userId).eq("exerciseId", exerciseId),
        )
        .first();

      if (existingProgress) {
        // Update existing record
        await ctx.db.patch(existingProgress._id, {
          status,
          updatedAt: now,
        });
      } else {
        // Create new record
        await ctx.db.insert("user_exercise_progress", {
          userId,
          exerciseId,
          status,
          updatedAt: now,
        });
      }
      updatedCount++;
    }

    return updatedCount;
  },
});

// Batch delete user's progress for multiple exercises
export const batchDeleteUserExerciseProgress = mutation({
  args: {
    exerciseIds: v.array(v.id("exercises")),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    if (args.exerciseIds.length === 0) {
      return 0;
    }

    let deletedCount = 0;

    for (const exerciseId of args.exerciseIds) {
      const existingProgress = await ctx.db
        .query("user_exercise_progress")
        .withIndex("by_user_and_exercise", (q) =>
          q.eq("userId", userId).eq("exerciseId", exerciseId),
        )
        .first();

      if (existingProgress) {
        await ctx.db.delete(existingProgress._id);
        deletedCount++;
      }
    }

    return deletedCount;
  },
});

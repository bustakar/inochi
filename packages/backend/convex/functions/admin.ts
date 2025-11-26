import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { internalMutation } from "../_generated/server";
import {
  exerciseCategoryValidator,
  exerciseLevelValidator,
  muscleRoleValidator,
  tipV2Validator,
} from "../validators/validators";

export const batchInsertExercises = internalMutation({
  args: {
    exercises: v.array(
      v.object({
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
        prerequisites: v.optional(v.array(v.id("exercises"))),
        variants: v.optional(
          v.array(
            v.object({
              equipmentIds: v.array(v.id("equipment")),
              tipsV2: v.optional(v.array(tipV2Validator)),
              overriddenTitle: v.optional(v.string()),
              overriddenDescription: v.optional(v.string()),
              overriddenDifficulty: v.optional(v.number()),
            }),
          ),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const insertedIds = [];

    for (const exerciseData of args.exercises) {
      const now = Date.now();

      // 1. Insert base exercise
      const exerciseId = await ctx.db.insert("exercises", {
        title: exerciseData.title,
        description: exerciseData.description ?? "",
        category: exerciseData.category ?? "calisthenics",
        level: exerciseData.level ?? "beginner",
        difficulty: exerciseData.difficulty ?? 1,
        prerequisites: exerciseData.prerequisites || [],
        createdAt: now,
        updatedAt: now,
        createdBy: "system", // Or some admin identifier
      });

      insertedIds.push(exerciseId);

      // 2. Insert muscles relations
      if (exerciseData.muscles && exerciseData.muscles.length > 0) {
        for (const muscleData of exerciseData.muscles) {
          // Verify muscle exists
          const muscle = await ctx.db.get(muscleData.muscleId);
          if (!muscle) {
            throw new Error(
              `Muscle not found: ${muscleData.muscleId} for exercise ${exerciseData.title}`,
            );
          }

          await ctx.db.insert("exercises_muscles", {
            exercise: exerciseId,
            muscle: muscleData.muscleId,
            role: muscleData.role,
          });
        }
      }

      // 3. Insert variants
      if (exerciseData.variants && exerciseData.variants.length > 0) {
        for (const variantData of exerciseData.variants) {
          // Verify equipment exists
          for (const eqId of variantData.equipmentIds) {
            const equipment = await ctx.db.get(eqId);
            if (!equipment) {
              throw new Error(
                `Equipment not found: ${eqId} for exercise ${exerciseData.title}`,
              );
            }
          }

          await ctx.db.insert("exercise_variants", {
            exercise: exerciseId,
            equipment: variantData.equipmentIds,
            tipsV2: variantData.tipsV2,
            overriddenTitle: variantData.overriddenTitle,
            overriddenDescription: variantData.overriddenDescription,
            overriddenDifficulty: variantData.overriddenDifficulty,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    return insertedIds;
  },
});

export const batchInsertMuscles = internalMutation({
  args: {
    muscles: v.array(
      v.object({
        name: v.string(),
        slug: v.string(),
        commonName: v.optional(v.string()),
        recommendedRestHours: v.number(),
        muscleGroup: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const insertedIds: Id<"muscles">[] = [];

    for (const muscleData of args.muscles) {
      // Check if muscle with same slug already exists
      const existingMuscle = await ctx.db
        .query("muscles")
        .withIndex("by_slug", (q) => q.eq("slug", muscleData.slug))
        .first();

      if (existingMuscle) {
        throw new Error(
          `Muscle with slug "${muscleData.slug}" already exists: ${existingMuscle._id}`,
        );
      }

      const muscleId = await ctx.db.insert("muscles", {
        name: muscleData.name,
        slug: muscleData.slug,
        commonName: muscleData.commonName,
        recommendedRestHours: muscleData.recommendedRestHours,
        muscleGroup: muscleData.muscleGroup,
      });

      insertedIds.push(muscleId);
    }

    return insertedIds;
  },
});

export const batchUpdateExercisePrerequisites = internalMutation({
  args: {
    updates: v.array(
      v.object({
        exerciseId: v.id("exercises"),
        prerequisites: v.array(v.id("exercises")),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const updatedIds = [];
    const now = Date.now();

    for (const update of args.updates) {
      const exercise = await ctx.db.get(update.exerciseId);
      if (!exercise) {
        throw new Error(`Exercise not found: ${update.exerciseId}`);
      }

      for (const prereqId of update.prerequisites) {
        const prereq = await ctx.db.get(prereqId);
        if (!prereq) {
          throw new Error(
            `Prerequisite exercise not found: ${prereqId} for exercise ${exercise.title}`,
          );
        }
      }

      await ctx.db.patch(update.exerciseId, {
        prerequisites: update.prerequisites,
        updatedAt: now,
      });
      updatedIds.push(update.exerciseId);
    }

    return updatedIds;
  },
});

export const batchUpdateExerciseMuscles = internalMutation({
  args: {
    updates: v.array(
      v.object({
        exerciseId: v.id("exercises"),
        muscles: v.array(
          v.object({
            muscleId: v.id("muscles"),
            role: muscleRoleValidator,
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      const exercise = await ctx.db.get(update.exerciseId);
      if (!exercise) {
        throw new Error(`Exercise not found: ${update.exerciseId}`);
      }

      const existing = await ctx.db
        .query("exercises_muscles")
        .withIndex("by_exercise", (q) => q.eq("exercise", update.exerciseId))
        .collect();

      for (const row of existing) {
        await ctx.db.delete(row._id);
      }

      for (const target of update.muscles) {
        const muscle = await ctx.db.get(target.muscleId);
        if (!muscle) {
          throw new Error(`Muscle not found: ${target.muscleId}`);
        }
        await ctx.db.insert("exercises_muscles", {
          exercise: update.exerciseId,
          muscle: target.muscleId,
          role: target.role,
        });
      }
    }
  },
});

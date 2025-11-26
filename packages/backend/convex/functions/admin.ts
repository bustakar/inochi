import { v } from "convex/values";
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
    const insertedIds = [];

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

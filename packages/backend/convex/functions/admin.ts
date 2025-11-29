import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { internalMutation } from "../_generated/server";
import {
  exerciseLevelValidator,
  exerciseVariantValidator,
  muscleRoleValidator,
} from "../validators/validators";

export const batchInsertExercises = internalMutation({
  args: {
    exercises: v.array(
      v.object({
        title: v.string(),
        description: v.optional(v.string()),
        level: v.optional(exerciseLevelValidator),
        difficulty: v.optional(v.number()),
        muscles: v.optional(
          v.object({
            primary: v.optional(v.array(v.string())),
            secondary: v.optional(v.array(v.string())),
            stabilizer: v.optional(v.array(v.string())),
          }),
        ),
        variants: v.optional(v.array(exerciseVariantValidator)),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const insertedIds: Id<"exercises">[] = [];

    // Pre-fetch all muscles to verify slugs exist
    const allMuscles = await ctx.db.query("muscles").collect();
    const validMuscleSlugs = new Set<string>();
    for (const muscle of allMuscles) {
      validMuscleSlugs.add(muscle.slug);
    }

    for (const exerciseData of args.exercises) {
      const now = Date.now();

      // Process variants - add createdAt and updatedAt if missing
      const processedVariants =
        exerciseData.variants?.map((variant) => ({
          ...variant,
          createdAt: variant.createdAt ?? now,
          updatedAt: variant.updatedAt ?? now,
        })) || [];

      // Verify equipment slugs exist for variants
      for (const variant of processedVariants) {
        for (const eqSlug of variant.equipment) {
          const equipment = await ctx.db
            .query("equipment")
            .withIndex("by_slug", (q) => q.eq("slug", eqSlug))
            .first();
          if (!equipment) {
            throw new Error(
              `Equipment not found: ${eqSlug} for exercise ${exerciseData.title}`,
            );
          }
        }
      }

      // 1. Insert base exercise
      const exerciseId = await ctx.db.insert("exercises", {
        title: exerciseData.title,
        description: exerciseData.description ?? "",
        level: exerciseData.level ?? "beginner",
        difficulty: exerciseData.difficulty ?? 1,
        variants: processedVariants,
        createdAt: now,
        updatedAt: now,
        createdBy: "system", // Or some admin identifier
      });

      insertedIds.push(exerciseId);

      // 2. Insert muscles relations
      // Convert muscles object format to exercises_muscles table entries
      if (exerciseData.muscles) {
        const roleMap: Array<{
          role: "primary" | "secondary" | "stabilizer";
          slugs: string[];
        }> = [
          { role: "primary", slugs: exerciseData.muscles.primary || [] },
          { role: "secondary", slugs: exerciseData.muscles.secondary || [] },
          {
            role: "stabilizer",
            slugs: exerciseData.muscles.stabilizer || [],
          },
        ];

        for (const { role, slugs } of roleMap) {
          for (const muscleSlug of slugs) {
            if (!validMuscleSlugs.has(muscleSlug)) {
              throw new Error(
                `Muscle not found: ${muscleSlug} for exercise ${exerciseData.title}`,
              );
            }

            await ctx.db.insert("exercises_muscles", {
              exercise: exerciseId,
              muscle: muscleSlug, // Store slug instead of ID
              role,
            });
          }
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

export const batchInsertEquipment = internalMutation({
  args: {
    equipment: v.array(
      v.object({
        name: v.string(),
        slug: v.string(),
        category: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const insertedIds: Id<"equipment">[] = [];

    for (const equipmentData of args.equipment) {
      const existingEquipment = await ctx.db
        .query("equipment")
        .withIndex("by_slug", (q) => q.eq("slug", equipmentData.slug))
        .first();

      if (existingEquipment) {
        throw new Error(
          `Equipment with slug "${equipmentData.slug}" already exists: ${existingEquipment._id}`,
        );
      }

      const equipmentId = await ctx.db.insert("equipment", {
        name: equipmentData.name,
        slug: equipmentData.slug,
        category: equipmentData.category,
      });

      insertedIds.push(equipmentId);
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

      // Prerequisites are stored in exercise_progressions table, not directly in exercise
      // Delete existing progressions for this exercise
      const existingProgressions = await ctx.db
        .query("exercise_progressions")
        .withIndex("by_to_exercise", (q) =>
          q.eq("toExercise", update.exerciseId),
        )
        .collect();

      for (const prog of existingProgressions) {
        await ctx.db.delete(prog._id);
      }

      // Insert new prerequisites
      for (const prereqId of update.prerequisites) {
        await ctx.db.insert("exercise_progressions", {
          fromExercise: prereqId,
          toExercise: update.exerciseId,
          createdAt: now,
        });
      }

      await ctx.db.patch(update.exerciseId, {
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
            muscleSlug: v.string(),
            role: muscleRoleValidator,
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // Pre-fetch all muscles to verify slugs exist
    const allMuscles = await ctx.db.query("muscles").collect();
    const validMuscleSlugs = new Set<string>();
    for (const muscle of allMuscles) {
      validMuscleSlugs.add(muscle.slug);
    }

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
        if (!validMuscleSlugs.has(target.muscleSlug)) {
          throw new Error(`Muscle not found: ${target.muscleSlug}`);
        }
        await ctx.db.insert("exercises_muscles", {
          exercise: update.exerciseId,
          muscle: target.muscleSlug, // Store slug instead of ID
          role: target.role,
        });
      }
    }
  },
});

export const batchUpdateExerciseVariants = internalMutation({
  args: {
    updates: v.array(
      v.object({
        exerciseId: v.id("exercises"),
        variants: v.array(exerciseVariantValidator),
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

      // Verify equipment slugs exist
      for (const variant of update.variants) {
        for (const eqSlug of variant.equipment) {
          const equipment = await ctx.db
            .query("equipment")
            .withIndex("by_slug", (q) => q.eq("slug", eqSlug))
            .first();
          if (!equipment) {
            throw new Error(
              `Equipment not found: ${eqSlug} for exercise ${exercise.title}`,
            );
          }
        }
      }

      await ctx.db.patch(update.exerciseId, {
        variants: update.variants,
        updatedAt: now,
      });

      updatedIds.push(update.exerciseId);
    }

    return updatedIds;
  },
});

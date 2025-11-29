import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { internalMutation } from "../_generated/server";
import {
  exerciseLevelValidator,
  exerciseVariantValidator,
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
      const variants = exerciseData.variants ?? [];

      // Verify equipment slugs exist for variants
      for (const variant of variants) {
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
        variants: variants,
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

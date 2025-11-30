import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { internalMutation } from "../_generated/server";
import seedEquipmentCalisthenics from "../seed/seed_equipment_calisthenics.json";
import seedExercisesCalisthenics from "../seed/seed_exercises_calisthenics.json";
import seedMuscles from "../seed/seed_muscles.json";
import {
  exerciseLevelValidator,
  exerciseVariantValidator,
} from "../validators/validators";

export const batchInsertExercises = internalMutation({
  args: {
    exercises: v.array(
      v.object({
        title: v.string(),
        slug: v.string(),
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
    const skippedSlugs: string[] = [];

    // Pre-fetch all muscles to verify slugs exist
    const allMuscles = await ctx.db.query("muscles").collect();
    const validMuscleSlugs = new Set<string>();
    for (const muscle of allMuscles) {
      validMuscleSlugs.add(muscle.slug);
    }

    for (const exerciseData of args.exercises) {
      const existingExercise = await ctx.db
        .query("exercises")
        .withIndex("by_slug", (q) => q.eq("slug", exerciseData.slug))
        .first();

      if (existingExercise) {
        skippedSlugs.push(exerciseData.slug);
        continue;
      }

      const now = Date.now();
      const variants = exerciseData.variants ?? [];

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

      const exerciseId = await ctx.db.insert("exercises", {
        title: exerciseData.title,
        slug: exerciseData.slug,
        description: exerciseData.description ?? "",
        level: exerciseData.level ?? "beginner",
        difficulty: exerciseData.difficulty ?? 1,
        variants: variants,
        createdAt: now,
        updatedAt: now,
        createdBy: "system",
      });

      insertedIds.push(exerciseId);

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

            const existingRelation = await ctx.db
              .query("exercises_muscles")
              .withIndex("by_exercise_and_role", (q) =>
                q.eq("exercise", exerciseId).eq("role", role),
              )
              .filter((q) => q.eq(q.field("muscle"), muscleSlug))
              .first();

            if (!existingRelation) {
              await ctx.db.insert("exercises_muscles", {
                exercise: exerciseId,
                muscle: muscleSlug,
                role,
              });
            }
          }
        }
      }
    }

    return { insertedIds, skipped: skippedSlugs.length };
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
    const skippedSlugs: string[] = [];

    for (const muscleData of args.muscles) {
      const existingMuscle = await ctx.db
        .query("muscles")
        .withIndex("by_slug", (q) => q.eq("slug", muscleData.slug))
        .first();

      if (existingMuscle) {
        skippedSlugs.push(muscleData.slug);
        continue;
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

    return { insertedIds, skipped: skippedSlugs.length };
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
    const skippedSlugs: string[] = [];

    for (const equipmentData of args.equipment) {
      const existingEquipment = await ctx.db
        .query("equipment")
        .withIndex("by_slug", (q) => q.eq("slug", equipmentData.slug))
        .first();

      if (existingEquipment) {
        skippedSlugs.push(equipmentData.slug);
        continue;
      }

      const equipmentId = await ctx.db.insert("equipment", {
        name: equipmentData.name,
        slug: equipmentData.slug,
        category: equipmentData.category,
      });

      insertedIds.push(equipmentId);
    }

    return { insertedIds, skipped: skippedSlugs.length };
  },
});

export const seedDatabase = internalMutation({
  args: {},
  returns: v.object({
    muscles: v.object({
      inserted: v.number(),
      skipped: v.number(),
    }),
    equipment: v.object({
      inserted: v.number(),
      skipped: v.number(),
    }),
    exercises: v.object({
      inserted: v.number(),
      skipped: v.number(),
    }),
  }),
  handler: async (
    ctx,
  ): Promise<{
    muscles: { inserted: number; skipped: number };
    equipment: { inserted: number; skipped: number };
    exercises: { inserted: number; skipped: number };
  }> => {
    const musclesResult: {
      insertedIds: Id<"muscles">[];
      skipped: number;
    } = await ctx.runMutation(internal.functions.admin.batchInsertMuscles, {
      muscles: seedMuscles as Array<{
        name: string;
        slug: string;
        commonName?: string;
        recommendedRestHours: number;
        muscleGroup: string;
      }>,
    });

    const equipmentResult: {
      insertedIds: Id<"equipment">[];
      skipped: number;
    } = await ctx.runMutation(internal.functions.admin.batchInsertEquipment, {
      equipment: seedEquipmentCalisthenics as Array<{
        name: string;
        slug: string;
        category: string;
      }>,
    });

    const exercisesResult: {
      insertedIds: Id<"exercises">[];
      skipped: number;
    } = await ctx.runMutation(internal.functions.admin.batchInsertExercises, {
      exercises: seedExercisesCalisthenics.map((ex) => ({
        ...ex,
        level: ex.level as
          | "beginner"
          | "intermediate"
          | "advanced"
          | "expert"
          | "elite"
          | "legendary",
      })),
    });

    return {
      muscles: {
        inserted: musclesResult.insertedIds.length,
        skipped: musclesResult.skipped,
      },
      equipment: {
        inserted: equipmentResult.insertedIds.length,
        skipped: equipmentResult.skipped,
      },
      exercises: {
        inserted: exercisesResult.insertedIds.length,
        skipped: exercisesResult.skipped,
      },
    };
  },
});

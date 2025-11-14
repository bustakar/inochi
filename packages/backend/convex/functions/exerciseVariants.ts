import { Infer, v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import {
  exerciseVariantValidator,
  validateDifficulty,
} from "../validators/validators";
import { getUserId } from "./auth";
import { getExerciseTitle } from "./exercises";

const getExerciseVariantResponseValidator = v.object({
  _id: v.id("exercise_variants"),
  _creationTime: v.number(),
  exercise: v.union(v.id("exercises"), v.id("private_exercises")),
  equipment: v.array(
    v.object({
      _id: v.id("equipment"),
      name: v.string(),
      category: v.string(),
    }),
  ),
  tipsV2: v.array(
    v.object({
      text: v.string(),
      videoUrl: v.optional(v.string()),
      exerciseReference: v.optional(
        v.object({
          _id: v.union(v.id("exercises"), v.id("private_exercises")),
          title: v.string(),
        }),
      ),
    }),
  ),
  overriddenTitle: v.optional(v.string()),
  overriddenDescription: v.optional(v.string()),
  overriddenDifficulty: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export type GetExerciseVariantResponse = Infer<
  typeof getExerciseVariantResponseValidator
>;

export const getExerciseVariants = query({
  args: {
    exerciseId: v.union(v.id("exercises"), v.id("private_exercises")),
  },
  returns: v.array(getExerciseVariantResponseValidator),
  handler: async (ctx, args) => {
    // Fetch all variants for this exercise
    const variants = await ctx.db
      .query("exercise_variants")
      .withIndex("by_exercise", (q) => q.eq("exercise", args.exerciseId))
      .collect();

    // Fetch all equipment for enrichment
    const allEquipment = await ctx.db.query("equipment").collect();
    const equipmentMap = new Map<Id<"equipment">, Doc<"equipment">>();
    allEquipment.forEach((eq) => equipmentMap.set(eq._id, eq));

    // Enrich variants with equipment data and exercise references
    return Promise.all(
      variants.map(async (variant) => {
        const equipmentData = variant.equipment
          .map((eqId) => equipmentMap.get(eqId))
          .filter((e): e is Doc<"equipment"> => e !== undefined)
          .map((equipment) => ({
            _id: equipment._id,
            name: equipment.name,
            category: equipment.category,
          }));

        const enrichedTipsV2 = await Promise.all(
          (variant.tipsV2 ?? []).map(async (tip) => {
            if (tip.exerciseReference) {
              const exerciseRef = await getExerciseTitle(
                ctx,
                tip.exerciseReference,
              );
              return {
                text: tip.text,
                videoUrl: tip.videoUrl,
                exerciseReference: exerciseRef
                  ? { _id: exerciseRef._id, title: exerciseRef.title }
                  : undefined,
              };
            }
            return {
              text: tip.text,
              videoUrl: tip.videoUrl,
              exerciseReference: undefined,
            };
          }),
        );

        return {
          _id: variant._id,
          _creationTime: variant._creationTime,
          exercise: variant.exercise,
          equipment: equipmentData,
          tipsV2: enrichedTipsV2,
          overriddenTitle: variant.overriddenTitle,
          overriddenDescription: variant.overriddenDescription,
          overriddenDifficulty: variant.overriddenDifficulty,
          createdAt: variant.createdAt,
          updatedAt: variant.updatedAt,
        };
      }),
    );
  },
});

export const createExerciseVariant = mutation({
  args: {
    data: exerciseVariantValidator,
  },
  returns: v.id("exercise_variants"),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized: You must be logged in");
    }

    // Validate that the exercise exists and user has access
    const exerciseId = args.data.exercise;
    const privateExercise = await ctx.db.get(
      exerciseId as Id<"private_exercises">,
    );
    if (privateExercise) {
      if (privateExercise.createdBy !== userId) {
        throw new Error(
          "Unauthorized: You can only create variants for your own exercises",
        );
      }
    } else {
      // Check if it's a public exercise
      const publicExercise = await ctx.db.get(exerciseId as Id<"exercises">);
      if (!publicExercise) {
        throw new Error("Exercise not found");
      }
    }

    // Validate that all equipment exists
    for (const equipmentId of args.data.equipment) {
      const equipment = await ctx.db.get(equipmentId);
      if (!equipment) {
        throw new Error(`Equipment not found: ${equipmentId}`);
      }
    }

    // Validate difficulty if provided
    if (args.data.overriddenDifficulty !== undefined) {
      validateDifficulty(args.data.overriddenDifficulty);
    }

    const now = Date.now();
    const variantId = await ctx.db.insert("exercise_variants", {
      exercise: args.data.exercise,
      equipment: args.data.equipment,
      tipsV2: args.data.tipsV2 || [],
      overriddenTitle: args.data.overriddenTitle,
      overriddenDescription: args.data.overriddenDescription,
      overriddenDifficulty: args.data.overriddenDifficulty,
      createdAt: now,
      updatedAt: now,
    });

    return variantId;
  },
});

export const updateExerciseVariant = mutation({
  args: {
    id: v.id("exercise_variants"),
    data: exerciseVariantValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized: You must be logged in");
    }

    const variant = await ctx.db.get(args.id);
    if (!variant) {
      throw new Error("Exercise variant not found");
    }

    // Validate that the exercise exists and user has access
    const exerciseId = args.data.exercise;
    const privateExercise = await ctx.db.get(
      exerciseId as Id<"private_exercises">,
    );
    if (privateExercise) {
      if (privateExercise.createdBy !== userId) {
        throw new Error(
          "Unauthorized: You can only update variants for your own exercises",
        );
      }
    } else {
      // Check if it's a public exercise
      const publicExercise = await ctx.db.get(exerciseId as Id<"exercises">);
      if (!publicExercise) {
        throw new Error("Exercise not found");
      }
    }

    // Validate that all equipment exists
    for (const equipmentId of args.data.equipment) {
      const equipment = await ctx.db.get(equipmentId);
      if (!equipment) {
        throw new Error(`Equipment not found: ${equipmentId}`);
      }
    }

    // Validate difficulty if provided
    if (args.data.overriddenDifficulty !== undefined) {
      validateDifficulty(args.data.overriddenDifficulty);
    }

    await ctx.db.patch(args.id, {
      exercise: args.data.exercise,
      equipment: args.data.equipment,
      tipsV2: args.data.tipsV2 || [],
      overriddenTitle: args.data.overriddenTitle,
      overriddenDescription: args.data.overriddenDescription,
      overriddenDifficulty: args.data.overriddenDifficulty,
      updatedAt: Date.now(),
    });

    return null;
  },
});

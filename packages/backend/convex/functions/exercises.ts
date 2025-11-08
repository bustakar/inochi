import { Auth } from "convex/server";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { query, QueryCtx } from "../_generated/server";
import {
  exerciseCategoryValidator,
  exerciseLevelValidator,
} from "../validators/validators";

export const getUserId = async (ctx: { auth: Auth }) => {
  return (await ctx.auth.getUserIdentity())?.subject;
};

// Helper: Fetch user's private exercises using the most efficient index
async function fetchUserExercises(
  ctx: QueryCtx,
  userId: string,
  filters: {
    level?: "beginner" | "intermediate" | "advanced" | "expert" | "elite";
    category?: "calisthenics" | "gym" | "stretch" | "mobility";
    minDifficulty?: number;
    maxDifficulty?: number;
  },
): Promise<Array<Doc<"private_exercises">>> {
  let exercises: Array<Doc<"private_exercises">>;

  // Use the most specific index available
  if (filters.level) {
    // Use by_level index, then filter by user
    exercises = await ctx.db
      .query("private_exercises")
      .withIndex("by_level", (q) => q.eq("level", filters.level!))
      .filter((q) => q.eq(q.field("createdBy"), userId))
      .collect();
  } else if (filters.category) {
    // Use by_category index, then filter by user
    exercises = await ctx.db
      .query("private_exercises")
      .withIndex("by_category", (q) => q.eq("category", filters.category!))
      .filter((q) => q.eq(q.field("createdBy"), userId))
      .collect();
  } else {
    // Use by_user index (most efficient when filtering by user)
    exercises = await ctx.db
      .query("private_exercises")
      .withIndex("by_user", (q) => q.eq("createdBy", userId))
      .collect();
  }

  // Apply difficulty range filter if needed
  if (
    filters.minDifficulty !== undefined ||
    filters.maxDifficulty !== undefined
  ) {
    exercises = exercises.filter((exercise) => {
      if (
        filters.minDifficulty !== undefined &&
        exercise.difficulty < filters.minDifficulty
      ) {
        return false;
      }
      if (
        filters.maxDifficulty !== undefined &&
        exercise.difficulty > filters.maxDifficulty
      ) {
        return false;
      }
      return true;
    });
  }

  // Apply category filter if not already filtered by category index
  if (filters.category && !filters.category) {
    // Already filtered above
  } else if (filters.category && filters.level) {
    exercises = exercises.filter(
      (exercise) => exercise.category === filters.category,
    );
  }

  return exercises;
}

// Helper: Filter exercises by muscles using shared exercises_muscles table
async function filterByMuscles(
  ctx: QueryCtx,
  exerciseIds: Array<Id<"private_exercises">>,
  muscleIds: Array<Id<"muscles">>,
): Promise<Set<Id<"private_exercises">>> {
  const exerciseIdsWithMuscles = new Set<Id<"private_exercises">>();

  for (const muscleId of muscleIds) {
    const muscleRelations = await ctx.db
      .query("exercises_muscles")
      .withIndex("by_muscle", (q) => q.eq("muscle", muscleId))
      .collect();
    muscleRelations.forEach((rel) => {
      // Only include if the exercise ID matches one of our private exercises
      if (exerciseIds.includes(rel.exercise as Id<"private_exercises">)) {
        exerciseIdsWithMuscles.add(rel.exercise as Id<"private_exercises">);
      }
    });
  }

  return exerciseIdsWithMuscles;
}

// Helper: Filter exercises by equipment using shared exercise_variants table
async function filterByEquipment(
  ctx: QueryCtx,
  exerciseIds: Array<Id<"private_exercises">>,
  equipmentIds: Array<Id<"equipment">>,
): Promise<Set<Id<"private_exercises">>> {
  const exerciseIdsWithEquipment = new Set<Id<"private_exercises">>();

  // Query variants for each exercise and check equipment
  for (const exerciseId of exerciseIds) {
    const variants = await ctx.db
      .query("exercise_variants")
      .withIndex("by_exercise", (q) => q.eq("exercise", exerciseId))
      .collect();

    // Check if any variant uses the requested equipment
    const hasMatchingEquipment = variants.some((variant) =>
      equipmentIds.some((eqId) => variant.equipment.includes(eqId)),
    );

    if (hasMatchingEquipment) {
      exerciseIdsWithEquipment.add(exerciseId);
    }
  }

  return exerciseIdsWithEquipment;
}

// Helper: Enrich exercise with muscle and equipment data
async function enrichExercise(
  ctx: QueryCtx,
  exercise: Doc<"private_exercises">,
  musclesMap: Map<Id<"muscles">, Doc<"muscles">>,
  equipmentMap: Map<Id<"equipment">, Doc<"equipment">>,
): Promise<{
  _id: Id<"private_exercises">;
  _creationTime: number;
  userId: string;
  title: string;
  description: string;
  category: "calisthenics" | "gym" | "stretch" | "mobility";
  level: "beginner" | "intermediate" | "advanced" | "expert" | "elite";
  difficulty: number;
  musclesData: Array<
    Doc<"muscles"> & {
      role?: "primary" | "secondary" | "tertiary" | "stabilizer";
    }
  >;
  equipmentData: Array<Doc<"equipment">>;
}> {
  // Query shared exercises_muscles table for this exercise
  const muscleRelations = await ctx.db
    .query("exercises_muscles")
    .withIndex("by_exercise", (q) => q.eq("exercise", exercise._id))
    .collect();

  const exerciseMuscles: Array<
    Doc<"muscles"> & {
      role?: "primary" | "secondary" | "tertiary" | "stabilizer";
    }
  > = muscleRelations.map((rel) => {
    const muscle = musclesMap.get(rel.muscle);
    if (!muscle) {
      throw new Error(`Muscle not found: ${rel.muscle}`);
    }
    return {
      ...muscle,
      role: rel.role,
    };
  });

  // Query shared exercise_variants table for this exercise
  const variantRelations = await ctx.db
    .query("exercise_variants")
    .withIndex("by_exercise", (q) => q.eq("exercise", exercise._id))
    .collect();

  const equipmentSet = new Set<Id<"equipment">>();
  variantRelations.forEach((variant) => {
    variant.equipment.forEach((eqId) => equipmentSet.add(eqId));
  });

  const exerciseEquipment: Array<Doc<"equipment">> = Array.from(equipmentSet)
    .map((eqId) => equipmentMap.get(eqId))
    .filter((e): e is Doc<"equipment"> => e !== undefined);

  return {
    _id: exercise._id,
    _creationTime: exercise._creationTime,
    userId: exercise.userId,
    title: exercise.title,
    description: exercise.description,
    category: exercise.category,
    level: exercise.level,
    difficulty: exercise.difficulty,
    musclesData: exerciseMuscles,
    equipmentData: exerciseEquipment,
  };
}

export const getPrivateExercises = query({
  args: {
    level: v.optional(exerciseLevelValidator),
    category: v.optional(exerciseCategoryValidator),
    minDifficulty: v.optional(v.number()),
    maxDifficulty: v.optional(v.number()),
    muscleIds: v.optional(v.array(v.id("muscles"))),
    equipmentIds: v.optional(v.array(v.id("equipment"))),
  },
  returns: v.array(
    v.object({
      _id: v.id("private_exercises"),
      _creationTime: v.number(),
      userId: v.string(),
      title: v.string(),
      description: v.string(),
      category: exerciseCategoryValidator,
      level: exerciseLevelValidator,
      difficulty: v.number(),
      musclesData: v.array(
        v.object({
          _id: v.id("muscles"),
          name: v.string(),
          muscleGroup: v.optional(v.string()),
          role: v.optional(
            v.union(
              v.literal("primary"),
              v.literal("secondary"),
              v.literal("tertiary"),
              v.literal("stabilizer"),
            ),
          ),
        }),
      ),
      equipmentData: v.array(
        v.object({
          _id: v.id("equipment"),
          name: v.string(),
          category: v.string(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Step 1: Fetch exercises using the most efficient index
    let privateExercises = await fetchUserExercises(ctx, userId, {
      level: args.level,
      category: args.category,
      minDifficulty: args.minDifficulty,
      maxDifficulty: args.maxDifficulty,
    });

    // Step 2: Filter by muscles if provided
    if (args.muscleIds && args.muscleIds.length > 0) {
      const exerciseIds = privateExercises.map((e) => e._id);
      const exerciseIdsWithMuscles = await filterByMuscles(
        ctx,
        exerciseIds,
        args.muscleIds,
      );
      if (exerciseIdsWithMuscles.size > 0) {
        privateExercises = privateExercises.filter((exercise) =>
          exerciseIdsWithMuscles.has(exercise._id),
        );
      } else {
        // If no exercises match muscles (junction table not implemented), return empty
        privateExercises = [];
      }
    }

    // Step 3: Filter by equipment if provided
    if (args.equipmentIds && args.equipmentIds.length > 0) {
      const exerciseIds = privateExercises.map((e) => e._id);
      const exerciseIdsWithEquipment = await filterByEquipment(
        ctx,
        exerciseIds,
        args.equipmentIds,
      );
      if (exerciseIdsWithEquipment.size > 0) {
        privateExercises = privateExercises.filter((exercise) =>
          exerciseIdsWithEquipment.has(exercise._id),
        );
      } else {
        // If no exercises match equipment (junction table not implemented), return empty
        privateExercises = [];
      }
    }

    // Step 4: Pre-fetch all muscles and equipment for enrichment
    const muscles = await ctx.db.query("muscles").collect();
    const equipment = await ctx.db.query("equipment").collect();

    // Create lookup maps for efficient enrichment
    const musclesDataMap = new Map<Id<"muscles">, Doc<"muscles">>();
    muscles.forEach((m) => musclesDataMap.set(m._id, m));

    const equipmentDataMap = new Map<Id<"equipment">, Doc<"equipment">>();
    equipment.forEach((e) => equipmentDataMap.set(e._id, e));

    // Step 5: Enrich each exercise with muscle and equipment data
    return Promise.all(
      privateExercises.map((exercise) =>
        enrichExercise(ctx, exercise, musclesDataMap, equipmentDataMap),
      ),
    );
  },
});

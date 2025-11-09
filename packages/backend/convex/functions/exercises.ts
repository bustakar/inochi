import { Auth } from "convex/server";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { internalQuery, mutation, query, QueryCtx } from "../_generated/server";
import {
  createExerciseVariantValidator,
  createPrivateExerciseValidator,
  exerciseCategoryValidator,
  exerciseLevelValidator,
  updatePrivateExerciseValidator,
  validateDifficulty,
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
  musclesData: Array<{
    _id: Id<"muscles">;
    name: string;
    muscleGroup?: string;
    role?: "primary" | "secondary" | "tertiary" | "stabilizer";
  }>;
  equipmentData: Array<{
    _id: Id<"equipment">;
    name: string;
    category: string;
  }>;
}> {
  // Query shared exercises_muscles table for this exercise
  const muscleRelations = await ctx.db
    .query("exercises_muscles")
    .withIndex("by_exercise", (q) => q.eq("exercise", exercise._id))
    .collect();

  const exerciseMuscles: Array<{
    _id: Id<"muscles">;
    name: string;
    muscleGroup?: string;
    role?: "primary" | "secondary" | "tertiary" | "stabilizer";
  }> = muscleRelations.map((rel) => {
    const muscle = musclesMap.get(rel.muscle);
    if (!muscle) {
      throw new Error(`Muscle not found: ${rel.muscle}`);
    }
    return {
      _id: muscle._id,
      name: muscle.name,
      muscleGroup: muscle.muscleGroup,
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

  const exerciseEquipment: Array<{
    _id: Id<"equipment">;
    name: string;
    category: string;
  }> = Array.from(equipmentSet)
    .map((eqId) => equipmentMap.get(eqId))
    .filter((e): e is Doc<"equipment"> => e !== undefined)
    .map((equipment) => ({
      _id: equipment._id,
      name: equipment.name,
      category: equipment.category,
    }));

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
      // Return empty array instead of throwing - allows UI to handle gracefully
      return [];
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

// Create a new private exercise
export const createPrivateExercise = mutation({
  args: {
    data: createPrivateExerciseValidator,
  },
  returns: v.id("private_exercises"),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Validate difficulty if provided
    if (args.data.difficulty !== undefined) {
      validateDifficulty(args.data.difficulty);
    }

    // Validate that prerequisite exercises exist if provided
    if (args.data.prerequisites) {
      for (const prereqId of args.data.prerequisites) {
        // Try private exercises first
        const privatePrereq = await ctx.db.get(
          prereqId as Id<"private_exercises">,
        );
        if (privatePrereq) continue;

        // Try public exercises
        const publicPrereq = await ctx.db.get(prereqId as Id<"exercises">);
        if (!publicPrereq) {
          throw new Error(`Prerequisite exercise not found: ${prereqId}`);
        }
      }
    }

    // Validate that muscles exist if provided
    if (args.data.muscles) {
      for (const muscleId of args.data.muscles) {
        const muscle = await ctx.db.get(muscleId);
        if (!muscle) {
          throw new Error(`Muscle not found: ${muscleId}`);
        }
      }
    }

    const now = Date.now();
    const exerciseId = await ctx.db.insert("private_exercises", {
      userId: userId,
      title: args.data.title,
      description: args.data.description ?? "",
      category: args.data.category ?? "calisthenics",
      level: args.data.level ?? "beginner",
      difficulty: args.data.difficulty ?? 1,
      prerequisites: [],
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    });

    // Save muscles to exercises_muscles table
    if (args.data.muscles && args.data.muscles.length > 0) {
      for (const muscleId of args.data.muscles) {
        await ctx.db.insert("exercises_muscles", {
          exercise: exerciseId,
          muscle: muscleId,
          role: "primary", // Default role, can be made configurable later
        });
      }
    }

    // Save prerequisites to exercise_progressions table
    // In progressions: fromExercise = prerequisite, toExercise = this exercise
    if (args.data.prerequisites && args.data.prerequisites.length > 0) {
      for (const prereqId of args.data.prerequisites) {
        await ctx.db.insert("exercise_progressions", {
          fromExercise: prereqId,
          toExercise: exerciseId,
          createdAt: now,
        });
      }
    }

    return exerciseId;
  },
});

// Update an existing private exercise
export const updatePrivateExercise = mutation({
  args: {
    id: v.id("private_exercises"),
    exerciseData: updatePrivateExerciseValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const exercise = await ctx.db.get(args.id);
    if (!exercise) {
      throw new Error("Private exercise not found");
    }

    // Verify ownership
    if (exercise.createdBy !== userId) {
      throw new Error(
        "Unauthorized: You can only update your own private exercises",
      );
    }

    // Validate difficulty if provided
    if (args.exerciseData.difficulty !== undefined) {
      validateDifficulty(args.exerciseData.difficulty);
    }

    // Validate that prerequisites exist if provided
    if (args.exerciseData.prerequisites !== undefined) {
      for (const prereqId of args.exerciseData.prerequisites) {
        const prereq = await ctx.db.get(prereqId);
        if (!prereq) {
          throw new Error(`Prerequisite exercise not found: ${prereqId}`);
        }
      }
    }

    // Validate that progressionFrom exercises exist if provided
    if (args.exerciseData.progressionFrom !== undefined) {
      for (const progId of args.exerciseData.progressionFrom) {
        const prog = await ctx.db.get(progId);
        if (!prog) {
          throw new Error(`Progression exercise not found: ${progId}`);
        }
      }
    }

    // Validate that progressionTo exercises exist if provided
    if (args.exerciseData.progressionTo !== undefined) {
      for (const progId of args.exerciseData.progressionTo) {
        const prog = await ctx.db.get(progId);
        if (!prog) {
          throw new Error(`Progression exercise not found: ${progId}`);
        }
      }
    }

    // Build update object with only provided fields
    const updateData: Partial<Doc<"private_exercises">> = {
      updatedAt: Date.now(),
    };

    if (args.exerciseData.title !== undefined) {
      updateData.title = args.exerciseData.title;
    }
    if (args.exerciseData.description !== undefined) {
      updateData.description = args.exerciseData.description;
    }
    if (args.exerciseData.category !== undefined) {
      updateData.category = args.exerciseData.category;
    }
    if (args.exerciseData.level !== undefined) {
      updateData.level = args.exerciseData.level;
    }
    if (args.exerciseData.difficulty !== undefined) {
      updateData.difficulty = args.exerciseData.difficulty;
    }
    if (args.exerciseData.prerequisites !== undefined) {
      updateData.prerequisites = args.exerciseData.prerequisites;
    }

    await ctx.db.patch(args.id, updateData);
    return null;
  },
});

// Helper: Fetch exercise title by ID (tries both private and public exercises)
async function getExerciseTitle(
  ctx: QueryCtx,
  exerciseId: Id<"exercises"> | Id<"private_exercises">,
): Promise<{ _id: typeof exerciseId; title: string } | null> {
  // Try private_exercises first
  const privateExercise = await ctx.db.get(
    exerciseId as Id<"private_exercises">,
  );
  if (privateExercise) {
    return { _id: exerciseId, title: privateExercise.title };
  }

  // Try public exercises
  const publicExercise = await ctx.db.get(exerciseId as Id<"exercises">);
  if (publicExercise) {
    return { _id: exerciseId, title: publicExercise.title };
  }

  return null;
}

// Helper: Fetch prerequisites (exercises that lead to this exercise)
async function getPrerequisites(
  ctx: QueryCtx,
  exerciseId: Id<"private_exercises">,
): Promise<
  Array<{ _id: Id<"exercises"> | Id<"private_exercises">; title: string }>
> {
  const prerequisitesProgressions = await ctx.db
    .query("exercise_progressions")
    .withIndex("by_to_exercise", (q) => q.eq("toExercise", exerciseId))
    .collect();

  const prerequisites = await Promise.all(
    prerequisitesProgressions
      .map((prog) => prog.fromExercise)
      .map((id) => getExerciseTitle(ctx, id)),
  );

  return prerequisites.filter(
    (
      e,
    ): e is {
      _id: Id<"exercises"> | Id<"private_exercises">;
      title: string;
    } => e !== null,
  );
}

// Helper: Fetch progressions (exercises this leads to and from, sorted)
async function getProgressions(
  ctx: QueryCtx,
  exerciseId: Id<"private_exercises">,
): Promise<
  Array<{ _id: Id<"exercises"> | Id<"private_exercises">; title: string }>
> {
  // Query progressions where this exercise is the source (leads to)
  const progressionToProgressions = await ctx.db
    .query("exercise_progressions")
    .withIndex("by_from_exercise", (q) => q.eq("fromExercise", exerciseId))
    .collect();

  // Query progressions where this exercise is the target (leads from)
  const progressionFromProgressions = await ctx.db
    .query("exercise_progressions")
    .withIndex("by_to_exercise", (q) => q.eq("toExercise", exerciseId))
    .collect();

  // Fetch exercises this leads to
  const progressionTo = await Promise.all(
    progressionToProgressions
      .map((prog) => prog.toExercise)
      .map((id) => getExerciseTitle(ctx, id)),
  );

  // Fetch exercises this leads from
  const progressionFrom = await Promise.all(
    progressionFromProgressions
      .map((prog) => prog.fromExercise)
      .map((id) => getExerciseTitle(ctx, id)),
  );

  // Combine and sort: from first, then to, then alphabetically by title
  const allProgressions = [
    ...progressionFrom.map((ex) => ({ ...ex, type: "from" as const })),
    ...progressionTo.map((ex) => ({ ...ex, type: "to" as const })),
  ]
    .filter(
      (
        e,
      ): e is {
        _id: Id<"exercises"> | Id<"private_exercises">;
        title: string;
        type: "from" | "to";
      } => e !== null,
    )
    .sort((a, b) => {
      // Sort by type first (from before to), then by title
      if (a.type !== b.type) {
        return a.type === "from" ? -1 : 1;
      }
      return a.title.localeCompare(b.title);
    })
    .map(({ type, ...ex }) => ex);

  return allProgressions;
}

// Helper: Fetch muscles for an exercise
async function getExerciseMuscles(
  ctx: QueryCtx,
  exerciseId: Id<"private_exercises">,
): Promise<
  Array<{
    _id: Id<"muscles">;
    name: string;
    role?: "primary" | "secondary" | "tertiary" | "stabilizer";
  }>
> {
  const muscleRelations = await ctx.db
    .query("exercises_muscles")
    .withIndex("by_exercise", (q) => q.eq("exercise", exerciseId))
    .collect();

  const muscles = await Promise.all(
    muscleRelations.map(async (rel) => {
      const muscle = await ctx.db.get(rel.muscle);
      if (!muscle) {
        return null;
      }
      return {
        _id: muscle._id,
        name: muscle.name,
        muscleGroup: muscle.muscleGroup,
        role: rel.role,
      } as {
        _id: Id<"muscles">;
        name: string;
        muscleGroup?: string;
        role?: "primary" | "secondary" | "tertiary" | "stabilizer";
      };
    }),
  );

  return muscles.filter(
    (
      m,
    ): m is {
      _id: Id<"muscles">;
      name: string;
      muscleGroup?: string;
      role?: "primary" | "secondary" | "tertiary" | "stabilizer";
    } => m !== null,
  );
}

export const getPrivateExerciseById = query({
  args: {
    exerciseId: v.id("private_exercises"),
  },
  returns: v.union(
    v.object({
      _id: v.id("private_exercises"),
      _creationTime: v.number(),
      userId: v.string(),
      title: v.string(),
      description: v.string(),
      category: exerciseCategoryValidator,
      level: exerciseLevelValidator,
      difficulty: v.number(),
      prerequisites: v.array(
        v.object({
          _id: v.union(v.id("exercises"), v.id("private_exercises")),
          title: v.string(),
        }),
      ),
      progressions: v.array(
        v.object({
          _id: v.union(v.id("exercises"), v.id("private_exercises")),
          title: v.string(),
        }),
      ),
      muscles: v.array(
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
      createdAt: v.number(),
      updatedAt: v.number(),
      createdBy: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      return null;
    }

    const exercise = await ctx.db.get(args.exerciseId);
    if (!exercise) {
      return null;
    }

    if (exercise.createdBy !== userId) {
      return null;
    }

    // Fetch all related data in parallel
    const [prerequisites, progressions, muscles] = await Promise.all([
      getPrerequisites(ctx, args.exerciseId),
      getProgressions(ctx, args.exerciseId),
      getExerciseMuscles(ctx, args.exerciseId),
    ]);

    return {
      ...exercise,
      prerequisites,
      progressions,
      muscles,
    };
  },
});

export const getExerciseVariants = query({
  args: {
    exerciseId: v.union(v.id("exercises"), v.id("private_exercises")),
  },
  returns: v.array(
    v.object({
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
      tips: v.array(v.string()),
      embedded_videos: v.array(v.string()),
      overriddenTitle: v.optional(v.string()),
      overriddenDescription: v.optional(v.string()),
      overriddenDifficulty: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
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

    // Enrich variants with equipment data
    return variants.map((variant) => {
      const equipmentData = variant.equipment
        .map((eqId) => equipmentMap.get(eqId))
        .filter((e): e is Doc<"equipment"> => e !== undefined)
        .map((equipment) => ({
          _id: equipment._id,
          name: equipment.name,
          category: equipment.category,
        }));

      return {
        _id: variant._id,
        _creationTime: variant._creationTime,
        exercise: variant.exercise,
        equipment: equipmentData,
        tips: variant.tips,
        embedded_videos: variant.embedded_videos,
        overriddenTitle: variant.overriddenTitle,
        overriddenDescription: variant.overriddenDescription,
        overriddenDifficulty: variant.overriddenDifficulty,
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
      };
    });
  },
});

export const deletePrivateExercise = mutation({
  args: {
    id: v.id("private_exercises"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const exercise = await ctx.db.get(args.id);
    if (!exercise) {
      throw new Error("Private exercise not found");
    }
    if (exercise.createdBy !== userId) {
      throw new Error(
        "Unauthorized: You can only delete your own private exercises",
      );
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

export const createExerciseVariant = mutation({
  args: {
    data: createExerciseVariantValidator,
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
      tips: args.data.tips,
      embedded_videos: args.data.embedded_videos,
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
    data: createExerciseVariantValidator,
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
      tips: args.data.tips,
      embedded_videos: args.data.embedded_videos,
      overriddenTitle: args.data.overriddenTitle,
      overriddenDescription: args.data.overriddenDescription,
      overriddenDifficulty: args.data.overriddenDifficulty,
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Internal query for AI - returns simplified exercise data
export const getAllExercisesForAI = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("exercises"),
      title: v.string(),
      level: exerciseLevelValidator,
      difficulty: v.number(),
      category: exerciseCategoryValidator,
    }),
  ),
  handler: async (ctx) => {
    const exercises = await ctx.db.query("exercises").collect();
    return exercises.map((e) => ({
      _id: e._id,
      title: e.title,
      level: e.level,
      difficulty: e.difficulty,
      category: e.category,
    }));
  },
});

// Internal query for AI - returns user's private exercises
export const getPrivateExercisesForAI = internalQuery({
  args: {
    userId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("private_exercises"),
      title: v.string(),
      level: exerciseLevelValidator,
      difficulty: v.number(),
      category: exerciseCategoryValidator,
    }),
  ),
  handler: async (ctx, args) => {
    const exercises = await ctx.db
      .query("private_exercises")
      .withIndex("by_user", (q) => q.eq("createdBy", args.userId))
      .collect();
    return exercises.map((e) => ({
      _id: e._id,
      title: e.title,
      level: e.level,
      difficulty: e.difficulty,
      category: e.category,
    }));
  },
});

// Get all muscles
export const getMuscles = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("muscles"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      recommendedRestHours: v.number(),
      parts: v.array(
        v.object({
          name: v.string(),
          slug: v.string(),
        }),
      ),
      muscleGroup: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("muscles").collect();
  },
});

// Get all equipment
export const getEquipment = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("equipment"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      category: v.string(),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("equipment").collect();
  },
});

// Internal query for AI - returns simplified muscle data
export const getAllMusclesForAI = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("muscles"),
      name: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const muscles = await ctx.db.query("muscles").collect();
    return muscles.map((m) => ({ _id: m._id, name: m.name }));
  },
});

// Internal query for AI - returns simplified equipment data
export const getAllEquipmentForAI = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("equipment"),
      name: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const equipment = await ctx.db.query("equipment").collect();
    return equipment.map((e) => ({ _id: e._id, name: e.name }));
  },
});

import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { internalQuery, mutation, query, QueryCtx } from "../_generated/server";
import {
  exerciseCategoryValidator,
  exerciseLevelValidator,
  exerciseValidator,
  validateDifficulty,
} from "../validators/validators";
import { getUserId } from "./auth";

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
  primaryMuscleGroups: Array<string>;
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

  // Group primary muscles by muscle group
  const primaryMuscles = exerciseMuscles.filter(
    (muscle) => muscle.role === "primary",
  );
  const groups = new Set<string>();
  for (const muscle of primaryMuscles) {
    const group = muscle.muscleGroup || "Other";
    // Capitalize first letter of each word
    const displayName =
      group
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ") || group;
    groups.add(displayName);
  }
  const primaryMuscleGroups = Array.from(groups);

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
    primaryMuscleGroups,
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
    searchQuery: v.optional(v.string()),
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
      primaryMuscleGroups: v.array(v.string()),
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

    // Step 4: Filter by search query if provided
    if (args.searchQuery && args.searchQuery.trim().length > 0) {
      const searchLower = args.searchQuery.toLowerCase().trim();
      privateExercises = privateExercises.filter((exercise) => {
        const titleMatch = exercise.title.toLowerCase().includes(searchLower);
        const descriptionMatch = exercise.description
          .toLowerCase()
          .includes(searchLower);
        return titleMatch || descriptionMatch;
      });
    }

    // Step 5: Pre-fetch all muscles and equipment for enrichment
    const muscles = await ctx.db.query("muscles").collect();
    const equipment = await ctx.db.query("equipment").collect();

    // Create lookup maps for efficient enrichment
    const musclesDataMap = new Map<Id<"muscles">, Doc<"muscles">>();
    muscles.forEach((m) => musclesDataMap.set(m._id, m));

    const equipmentDataMap = new Map<Id<"equipment">, Doc<"equipment">>();
    equipment.forEach((e) => equipmentDataMap.set(e._id, e));

    // Step 6: Enrich each exercise with muscle and equipment data
    return Promise.all(
      privateExercises.map((exercise) =>
        enrichExercise(ctx, exercise, musclesDataMap, equipmentDataMap),
      ),
    );
  },
});

// Get all exercises (both public and private) for the current user
// Public exercises are visible to everyone, private exercises only to their owner
export const getAllExercises = query({
  args: {
    searchQuery: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.union(v.id("exercises"), v.id("private_exercises")),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      category: exerciseCategoryValidator,
      level: exerciseLevelValidator,
      difficulty: v.number(),
      isPrivate: v.boolean(),
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
      primaryMuscleGroups: v.array(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    // Fetch all public exercises
    let publicExercises = await ctx.db.query("exercises").collect();

    // Fetch user's private exercises (if authenticated)
    let privateExercises: Array<Doc<"private_exercises">> = [];
    if (userId) {
      privateExercises = await ctx.db
        .query("private_exercises")
        .withIndex("by_user", (q) => q.eq("createdBy", userId))
        .collect();
    }

    // Filter by search query if provided
    if (args.searchQuery && args.searchQuery.trim().length > 0) {
      const searchLower = args.searchQuery.toLowerCase().trim();
      publicExercises = publicExercises.filter((exercise) => {
        const titleMatch = exercise.title.toLowerCase().includes(searchLower);
        const descriptionMatch = exercise.description
          .toLowerCase()
          .includes(searchLower);
        return titleMatch || descriptionMatch;
      });
      privateExercises = privateExercises.filter((exercise) => {
        const titleMatch = exercise.title.toLowerCase().includes(searchLower);
        const descriptionMatch = exercise.description
          .toLowerCase()
          .includes(searchLower);
        return titleMatch || descriptionMatch;
      });
    }

    // Pre-fetch all muscles for enrichment
    const muscles = await ctx.db.query("muscles").collect();
    const musclesDataMap = new Map<Id<"muscles">, Doc<"muscles">>();
    muscles.forEach((m) => musclesDataMap.set(m._id, m));

    // Fetch muscle relations for all exercises
    const allExerciseIds = [
      ...publicExercises.map((e) => e._id),
      ...privateExercises.map((e) => e._id),
    ];

    const muscleRelations = await ctx.db.query("exercises_muscles").collect();

    // Helper to get muscles for an exercise
    const getMusclesForExercise = (
      exerciseId: Id<"exercises"> | Id<"private_exercises">,
    ): Array<{
      _id: Id<"muscles">;
      name: string;
      muscleGroup?: string;
      role?: "primary" | "secondary" | "tertiary" | "stabilizer";
    }> => {
      const relations = muscleRelations.filter(
        (rel) => rel.exercise === exerciseId,
      );
      const result: Array<{
        _id: Id<"muscles">;
        name: string;
        muscleGroup?: string;
        role?: "primary" | "secondary" | "tertiary" | "stabilizer";
      }> = [];

      for (const rel of relations) {
        const muscle = musclesDataMap.get(rel.muscle);
        if (muscle) {
          result.push({
            _id: muscle._id,
            name: muscle.name,
            muscleGroup: muscle.muscleGroup,
            role: rel.role,
          });
        }
      }

      return result;
    };

    // Helper to extract primary muscle groups
    const getPrimaryMuscleGroups = (
      musclesData: Array<{
        _id: Id<"muscles">;
        name: string;
        muscleGroup?: string;
        role?: "primary" | "secondary" | "tertiary" | "stabilizer";
      }>,
    ): string[] => {
      const groups: string[] = [];
      for (const m of musclesData) {
        if (m.role === "primary" && m.muscleGroup) {
          groups.push(m.muscleGroup);
        }
      }
      return [...new Set(groups)];
    };

    // Enrich and combine exercises
    const enrichedPublic = publicExercises.map((exercise) => {
      const musclesData = getMusclesForExercise(exercise._id);
      const primaryMuscleGroups = getPrimaryMuscleGroups(musclesData);
      return {
        _id: exercise._id as Id<"exercises"> | Id<"private_exercises">,
        _creationTime: exercise._creationTime,
        title: exercise.title,
        description: exercise.description,
        category: exercise.category,
        level: exercise.level,
        difficulty: exercise.difficulty,
        isPrivate: false as const,
        musclesData,
        primaryMuscleGroups,
      };
    });

    const enrichedPrivate = privateExercises.map((exercise) => {
      const musclesData = getMusclesForExercise(exercise._id);
      const primaryMuscleGroups = getPrimaryMuscleGroups(musclesData);
      return {
        _id: exercise._id as Id<"exercises"> | Id<"private_exercises">,
        _creationTime: exercise._creationTime,
        title: exercise.title,
        description: exercise.description,
        category: exercise.category,
        level: exercise.level,
        difficulty: exercise.difficulty,
        isPrivate: true as const,
        musclesData,
        primaryMuscleGroups,
      };
    });

    // Combine and sort by creation time (newest first)
    return [...enrichedPublic, ...enrichedPrivate].sort(
      (a, b) => b._creationTime - a._creationTime,
    );
  },
});

// Create a new private exercise
export const createPrivateExercise = mutation({
  args: {
    data: exerciseValidator,
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
      for (const muscleData of args.data.muscles) {
        const muscle = await ctx.db.get(muscleData.muscleId);
        if (!muscle) {
          throw new Error(`Muscle not found: ${muscleData.muscleId}`);
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
      for (const muscleData of args.data.muscles) {
        await ctx.db.insert("exercises_muscles", {
          exercise: exerciseId,
          muscle: muscleData.muscleId,
          role: muscleData.role,
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
    exerciseData: exerciseValidator,
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

    // Validate that muscles exist if provided
    if (args.exerciseData.muscles !== undefined) {
      for (const muscleData of args.exerciseData.muscles) {
        const muscle = await ctx.db.get(muscleData.muscleId);
        if (!muscle) {
          throw new Error(`Muscle not found: ${muscleData.muscleId}`);
        }
      }
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
    if (args.exerciseData.progressions !== undefined) {
      for (const progId of args.exerciseData.progressions) {
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

    // Update muscles in exercises_muscles table if provided
    if (args.exerciseData.muscles !== undefined) {
      // Delete existing muscle relations
      const existingMuscleRelations = await ctx.db
        .query("exercises_muscles")
        .withIndex("by_exercise", (q) => q.eq("exercise", args.id))
        .collect();

      for (const relation of existingMuscleRelations) {
        await ctx.db.delete(relation._id);
      }

      // Insert new muscle relations
      for (const muscleData of args.exerciseData.muscles) {
        await ctx.db.insert("exercises_muscles", {
          exercise: args.id,
          muscle: muscleData.muscleId,
          role: muscleData.role,
        });
      }
    }

    return null;
  },
});

// Helper: Fetch exercise title by ID (tries both private and public exercises)
export async function getExerciseTitle(
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

// Helper to check if an ID is a public exercise (exists in exercises table)
async function isPublicExercise(
  ctx: QueryCtx,
  id: Id<"exercises"> | Id<"private_exercises">,
): Promise<
  { isPublic: true; exercise: Doc<"exercises"> } | { isPublic: false }
> {
  // Try to fetch from exercises table specifically
  // ctx.db.get auto-detects table from ID, so we need to verify it's in exercises table
  const doc = await ctx.db.get(id as Id<"exercises">);
  if (!doc) return { isPublic: false };

  // Check if the document has the shape of an exercise (not private_exercise)
  // Private exercises have a userId field, public exercises don't
  if ("userId" in doc) {
    return { isPublic: false };
  }

  return { isPublic: true, exercise: doc as Doc<"exercises"> };
}

// Helper: Fetch prerequisites for a public exercise (only public exercises)
async function getPublicExercisePrerequisites(
  ctx: QueryCtx,
  exerciseId: Id<"exercises">,
): Promise<Array<{ _id: Id<"exercises">; title: string }>> {
  const exercise = await ctx.db.get(exerciseId);
  if (!exercise) return [];

  const result: Array<{ _id: Id<"exercises">; title: string }> = [];

  for (const prereqId of exercise.prerequisites ?? []) {
    // Only include public exercises
    const check = await isPublicExercise(ctx, prereqId);
    if (check.isPublic) {
      result.push({
        _id: prereqId as Id<"exercises">,
        title: check.exercise.title,
      });
    }
    // Private exercises are intentionally excluded
  }

  return result;
}

// Helper: Fetch progressions for a public exercise (only public exercises)
async function getPublicExerciseProgressions(
  ctx: QueryCtx,
  exerciseId: Id<"exercises">,
): Promise<Array<{ _id: Id<"exercises">; title: string }>> {
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

  const result: Array<{
    _id: Id<"exercises">;
    title: string;
    type: "from" | "to";
  }> = [];

  // Process "to" progressions - only include public exercises
  for (const prog of progressionToProgressions) {
    const check = await isPublicExercise(ctx, prog.toExercise);
    if (check.isPublic) {
      result.push({
        _id: prog.toExercise as Id<"exercises">,
        title: check.exercise.title,
        type: "to",
      });
    }
  }

  // Process "from" progressions - only include public exercises
  for (const prog of progressionFromProgressions) {
    const check = await isPublicExercise(ctx, prog.fromExercise);
    if (check.isPublic) {
      result.push({
        _id: prog.fromExercise as Id<"exercises">,
        title: check.exercise.title,
        type: "from",
      });
    }
  }

  // Sort: from first, then to, then alphabetically by title
  return result
    .sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "from" ? -1 : 1;
      }
      return a.title.localeCompare(b.title);
    })
    .map(({ type, ...ex }) => ex);
}

// Helper: Fetch muscles for a public exercise
async function getPublicExerciseMuscles(
  ctx: QueryCtx,
  exerciseId: Id<"exercises">,
): Promise<
  Array<{
    _id: Id<"muscles">;
    name: string;
    muscleGroup?: string;
    role?: "primary" | "secondary" | "tertiary" | "stabilizer";
  }>
> {
  const muscleRelations = await ctx.db
    .query("exercises_muscles")
    .withIndex("by_exercise", (q) => q.eq("exercise", exerciseId))
    .collect();

  const result: Array<{
    _id: Id<"muscles">;
    name: string;
    muscleGroup?: string;
    role?: "primary" | "secondary" | "tertiary" | "stabilizer";
  }> = [];

  for (const rel of muscleRelations) {
    const muscle = await ctx.db.get(rel.muscle);
    if (muscle) {
      result.push({
        _id: muscle._id,
        name: muscle.name,
        muscleGroup: muscle.muscleGroup,
        role: rel.role,
      });
    }
  }

  return result;
}

export const getPublicExerciseById = query({
  args: {
    exerciseId: v.id("exercises"),
  },
  returns: v.union(
    v.object({
      _id: v.id("exercises"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      category: exerciseCategoryValidator,
      level: exerciseLevelValidator,
      difficulty: v.number(),
      prerequisites: v.array(
        v.object({
          _id: v.id("exercises"),
          title: v.string(),
        }),
      ),
      progressions: v.array(
        v.object({
          _id: v.id("exercises"),
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
    const exercise = await ctx.db.get(args.exerciseId);
    if (!exercise) {
      return null;
    }

    // Fetch all related data in parallel
    const [prerequisites, progressions, muscles] = await Promise.all([
      getPublicExercisePrerequisites(ctx, args.exerciseId),
      getPublicExerciseProgressions(ctx, args.exerciseId),
      getPublicExerciseMuscles(ctx, args.exerciseId),
    ]);

    return {
      ...exercise,
      prerequisites,
      progressions,
      muscles,
    };
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
      commonName: v.optional(v.string()),
      recommendedRestHours: v.number(),
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

// Get exercise titles by IDs (for displaying prerequisites/progressions)
// Returns title and whether it's a private exercise
export const getExerciseTitlesByIds = query({
  args: {
    exerciseIds: v.array(v.union(v.id("exercises"), v.id("private_exercises"))),
  },
  returns: v.array(
    v.object({
      _id: v.union(v.id("exercises"), v.id("private_exercises")),
      title: v.string(),
      isPrivate: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const results: Array<{
      _id: Id<"exercises"> | Id<"private_exercises">;
      title: string;
      isPrivate: boolean;
    }> = [];

    for (const exerciseId of args.exerciseIds) {
      // Try private_exercises first
      const privateExercise = await ctx.db.get(
        exerciseId as Id<"private_exercises">,
      );
      if (privateExercise) {
        results.push({
          _id: exerciseId,
          title: privateExercise.title,
          isPrivate: true,
        });
        continue;
      }

      // Try public exercises
      const publicExercise = await ctx.db.get(exerciseId as Id<"exercises">);
      if (publicExercise) {
        results.push({
          _id: exerciseId,
          title: publicExercise.title,
          isPrivate: false,
        });
      }
    }

    return results;
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

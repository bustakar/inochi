import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { internalQuery, mutation, query, QueryCtx } from "../_generated/server";
import {
  exerciseLevelValidator,
  exerciseValidator,
  exerciseVariantValidator,
  progressStatusValidator,
  validateDifficulty,
} from "../validators/validators";
import { getUserId } from "./auth";
// Get all exercises (public exercises only)
export const getAllExercises = query({
  args: {
    searchQuery: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("exercises"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
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
              v.literal("stabilizer"),
            ),
          ),
        }),
      ),
      primaryMuscleGroups: v.array(v.string()),
      userProgress: v.union(
        v.object({ status: progressStatusValidator }),
        v.null(),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    // Fetch all public exercises
    let publicExercises = await ctx.db.query("exercises").collect();

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
    }

    // Pre-fetch all muscles for enrichment
    const muscles = await ctx.db.query("muscles").collect();
    const musclesDataMapBySlug = new Map<string, Doc<"muscles">>();
    muscles.forEach((m) => musclesDataMapBySlug.set(m.slug, m));

    // Fetch muscle relations for all exercises
    const muscleRelations = await ctx.db.query("exercises_muscles").collect();

    // Fetch user progress if authenticated
    const userId = await getUserId(ctx);
    const userProgressMap = new Map<
      Id<"exercises">,
      "novice" | "apprentice" | "journeyman" | "master"
    >();
    if (userId) {
      const allProgress = await ctx.db
        .query("user_exercise_progress")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      for (const p of allProgress) {
        userProgressMap.set(p.exerciseId, p.status);
      }
    }

    // Helper to get muscles for an exercise
    const getMusclesForExercise = (
      exerciseId: Id<"exercises">,
    ): Array<{
      _id: Id<"muscles">;
      name: string;
      muscleGroup?: string;
      role?: "primary" | "secondary" | "stabilizer";
    }> => {
      const relations = muscleRelations.filter(
        (rel) => rel.exercise === exerciseId,
      );
      const result: Array<{
        _id: Id<"muscles">;
        name: string;
        muscleGroup?: string;
        role?: "primary" | "secondary" | "stabilizer";
      }> = [];

      for (const rel of relations) {
        const muscle = musclesDataMapBySlug.get(rel.muscle);
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
        role?: "primary" | "secondary" | "stabilizer";
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

    // Enrich exercises
    const enrichedPublic = publicExercises.map((exercise) => {
      const musclesData = getMusclesForExercise(exercise._id);
      const primaryMuscleGroups = getPrimaryMuscleGroups(musclesData);
      const progressStatus = userProgressMap.get(exercise._id);
      return {
        _id: exercise._id,
        _creationTime: exercise._creationTime,
        title: exercise.title,
        description: exercise.description,
        level: exercise.level,
        difficulty: exercise.difficulty,
        musclesData,
        primaryMuscleGroups,
        userProgress: progressStatus ? { status: progressStatus } : null,
      };
    });

    // Sort by creation time (newest first)
    return enrichedPublic.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// Helper: Fetch exercise title by ID
export async function getExerciseTitle(
  ctx: QueryCtx,
  exerciseId: Id<"exercises">,
): Promise<{ _id: Id<"exercises">; title: string } | null> {
  const exercise = await ctx.db.get(exerciseId);
  if (!exercise) {
    return null;
  }
  return { _id: exerciseId, title: exercise.title };
}

// Helper to check if an ID is a public exercise (exists in exercises table)
async function isPublicExercise(
  ctx: QueryCtx,
  id: Id<"exercises">,
): Promise<
  { isPublic: true; exercise: Doc<"exercises"> } | { isPublic: false }
> {
  const doc = await ctx.db.get(id);
  if (!doc) return { isPublic: false };
  return { isPublic: true, exercise: doc as Doc<"exercises"> };
}

// Helper: Fetch prerequisites for a public exercise (only public exercises)
async function getPublicExercisePrerequisites(
  ctx: QueryCtx,
  exerciseId: Id<"exercises">,
): Promise<Array<{ _id: Id<"exercises">; title: string }>> {
  // Prerequisites are stored in exercise_progressions table
  // where toExercise = this exercise and fromExercise = prerequisite
  const prerequisitesProgressions = await ctx.db
    .query("exercise_progressions")
    .withIndex("by_to_exercise", (q) => q.eq("toExercise", exerciseId))
    .collect();

  const result: Array<{ _id: Id<"exercises">; title: string }> = [];

  for (const prog of prerequisitesProgressions) {
    // Only include public exercises
    const check = await isPublicExercise(ctx, prog.fromExercise);
    if (check.isPublic) {
      result.push({
        _id: prog.fromExercise as Id<"exercises">,
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
    role?: "primary" | "secondary" | "stabilizer";
  }>
> {
  const muscleRelations = await ctx.db
    .query("exercises_muscles")
    .withIndex("by_exercise", (q) => q.eq("exercise", exerciseId))
    .collect();

  // Pre-fetch all muscles to map slugs to muscle data
  const allMuscles = await ctx.db.query("muscles").collect();
  const musclesBySlug = new Map<string, Doc<"muscles">>();
  allMuscles.forEach((m) => musclesBySlug.set(m.slug, m));

  const result: Array<{
    _id: Id<"muscles">;
    name: string;
    muscleGroup?: string;
    role?: "primary" | "secondary" | "stabilizer";
  }> = [];

  for (const rel of muscleRelations) {
    const muscle = musclesBySlug.get(rel.muscle);
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

// Helper: Fetch user's progress for a public exercise
async function getUserProgressForExercise(
  ctx: QueryCtx,
  exerciseId: Id<"exercises">,
): Promise<{
  status: "novice" | "apprentice" | "journeyman" | "master";
} | null> {
  const userId = await getUserId(ctx);
  if (!userId) {
    return null;
  }

  const progress = await ctx.db
    .query("user_exercise_progress")
    .withIndex("by_user_and_exercise", (q) =>
      q.eq("userId", userId).eq("exerciseId", exerciseId),
    )
    .first();

  if (!progress) {
    return null;
  }

  return {
    status: progress.status,
  };
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
      level: exerciseLevelValidator,
      difficulty: v.number(),
      muscles: v.array(
        v.object({
          _id: v.id("muscles"),
          name: v.string(),
          muscleGroup: v.optional(v.string()),
          role: v.optional(
            v.union(
              v.literal("primary"),
              v.literal("secondary"),
              v.literal("stabilizer"),
            ),
          ),
        }),
      ),
      variants: v.array(exerciseVariantValidator),
      userProgress: v.union(
        v.object({
          status: progressStatusValidator,
        }),
        v.null(),
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
    const [muscles, userProgress] = await Promise.all([
      getPublicExerciseMuscles(ctx, args.exerciseId),
      getUserProgressForExercise(ctx, args.exerciseId),
    ]);

    return {
      ...exercise,
      muscles,
      userProgress,
    };
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
    }),
  ),
  handler: async (ctx) => {
    const exercises = await ctx.db.query("exercises").collect();
    return exercises.map((e) => ({
      _id: e._id,
      title: e.title,
      level: e.level,
      difficulty: e.difficulty,
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
export const getExerciseTitlesByIds = query({
  args: {
    exerciseIds: v.array(v.id("exercises")),
  },
  returns: v.array(
    v.object({
      _id: v.id("exercises"),
      title: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const results: Array<{
      _id: Id<"exercises">;
      title: string;
    }> = [];

    for (const exerciseId of args.exerciseIds) {
      const exercise = await ctx.db.get(exerciseId);
      if (exercise) {
        results.push({
          _id: exerciseId,
          title: exercise.title,
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

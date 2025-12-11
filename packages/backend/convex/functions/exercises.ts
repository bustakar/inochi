import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { internalQuery, mutation, query, QueryCtx } from "../_generated/server";
import {
  ExerciseLevel,
  exerciseLevelValidator,
  exerciseVariantValidator,
  progressStatusValidator,
} from "../validators/validators";
import { getUserId } from "./auth";

const exerciseResponseValidator = v.object({
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
});

// Level order for sorting
const LEVEL_ORDER: ExerciseLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
  "elite",
  "legendary",
];

const getLevelOrder = (level: ExerciseLevel): number => {
  return LEVEL_ORDER.indexOf(level);
};

// Helper type for muscle data
type MuscleData = {
  _id: Id<"muscles">;
  name: string;
  muscleGroup?: string;
  role?: "primary" | "secondary" | "stabilizer";
};

// Helper to get muscles for an exercise from pre-fetched data
function getMusclesForExercise(
  exerciseId: Id<"exercises">,
  muscleRelations: Array<Doc<"exercises_muscles">>,
  musclesDataMapBySlug: Map<string, Doc<"muscles">>,
): MuscleData[] {
  const relations = muscleRelations.filter(
    (rel) => rel.exercise === exerciseId,
  );
  const result: MuscleData[] = [];

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
}

// Helper to extract primary muscle groups from muscle data
function getPrimaryMuscleGroups(musclesData: MuscleData[]): string[] {
  const groups: string[] = [];
  for (const m of musclesData) {
    if (m.role === "primary" && m.muscleGroup) {
      groups.push(m.muscleGroup);
    }
  }
  return [...new Set(groups)];
}

const getEnrichedPublicExercises = async (
  ctx: QueryCtx,
  args: { searchQuery?: string | undefined },
) => {
  let publicExercises = await ctx.db.query("exercises").collect();

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

  const muscles = await ctx.db.query("muscles").collect();
  const musclesDataMapBySlug = new Map<string, Doc<"muscles">>();
  muscles.forEach((m) => musclesDataMapBySlug.set(m.slug, m));

  const muscleRelations = await ctx.db.query("exercises_muscles").collect();

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

  const enrichedPublic = publicExercises.map((exercise) => {
    const musclesData = getMusclesForExercise(
      exercise._id,
      muscleRelations,
      musclesDataMapBySlug,
    );
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

  enrichedPublic.sort((a, b) => {
    if (a.difficulty !== b.difficulty) {
      return a.difficulty - b.difficulty;
    }
    return a.title.localeCompare(b.title);
  });

  return enrichedPublic;
};

export const list = query({
  args: {
    searchQuery: v.optional(v.string()),
  },
  returns: v.array(exerciseResponseValidator),
  handler: async (ctx, args) => {
    const enrichedPublic = await getEnrichedPublicExercises(ctx, args);

    return enrichedPublic;
  },
});

export const listByLevel = query({
  args: {
    searchQuery: v.optional(v.string()),
  },
  returns: v.object({
    beginner: v.array(exerciseResponseValidator),
    intermediate: v.array(exerciseResponseValidator),
    advanced: v.array(exerciseResponseValidator),
    expert: v.array(exerciseResponseValidator),
    elite: v.array(exerciseResponseValidator),
    legendary: v.array(exerciseResponseValidator),
  }),
  handler: async (ctx, args) => {
    let enrichedPublic = await getEnrichedPublicExercises(ctx, args);

    const grouped: Record<
      ExerciseLevel,
      Array<{
        _id: Id<"exercises">;
        _creationTime: number;
        title: string;
        description: string;
        level: ExerciseLevel;
        difficulty: number;
        musclesData: MuscleData[];
        primaryMuscleGroups: string[];
        userProgress: {
          status: "novice" | "apprentice" | "journeyman" | "master";
        } | null;
      }>
    > = {
      beginner: [],
      intermediate: [],
      advanced: [],
      expert: [],
      elite: [],
      legendary: [],
    };

    for (const exercise of enrichedPublic) {
      grouped[exercise.level].push(exercise);
    }

    return grouped;
  },
});

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

async function getPublicExerciseMuscles(
  ctx: QueryCtx,
  exerciseId: Id<"exercises">,
): Promise<MuscleData[]> {
  const muscleRelations = await ctx.db
    .query("exercises_muscles")
    .withIndex("by_exercise", (q) => q.eq("exercise", exerciseId))
    .collect();

  const allMuscles = await ctx.db.query("muscles").collect();
  const musclesBySlug = new Map<string, Doc<"muscles">>();
  allMuscles.forEach((m) => musclesBySlug.set(m.slug, m));

  return getMusclesForExercise(exerciseId, muscleRelations, musclesBySlug);
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
      slug: v.string(),
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

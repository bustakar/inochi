import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { mutation, query, QueryCtx } from "../_generated/server";
import {
  exerciseLevelValidator,
  progressStatusValidator,
} from "../validators/validators";
import { getUserId, isAdminOrModerator } from "./auth";

// ============================================================================
// Common Validators
// ============================================================================

const exerciseTreeStatusValidator = v.union(
  v.literal("draft"),
  v.literal("published"),
);

const handlePositionValidator = v.union(
  v.literal("top"),
  v.literal("bottom"),
  v.literal("left"),
  v.literal("right"),
);

const connectionTypeValidator = v.union(
  v.literal("required"),
  v.literal("optional"),
);

const exerciseInTreeValidator = v.object({
  _id: v.id("exercises"),
  title: v.string(),
  description: v.string(),
  level: exerciseLevelValidator,
  difficulty: v.number(),
});

const exerciseInTreeWithProgressValidator = v.object({
  _id: v.id("exercises"),
  title: v.string(),
  description: v.string(),
  level: exerciseLevelValidator,
  difficulty: v.number(),
  userProgress: v.union(
    v.object({ status: progressStatusValidator }),
    v.null(),
  ),
});

const treeNodeValidator = v.object({
  exerciseId: v.id("exercises"),
  x: v.number(),
  y: v.number(),
});

const treeConnectionValidator = v.object({
  fromExercise: v.id("exercises"),
  toExercise: v.id("exercises"),
  type: connectionTypeValidator,
  sourceHandle: handlePositionValidator,
  targetHandle: handlePositionValidator,
});

const exerciseTreeReturnValidator = v.object({
  _id: v.id("exercise_trees"),
  _creationTime: v.number(),
  title: v.string(),
  description: v.optional(v.string()),
  status: exerciseTreeStatusValidator,
  createdBy: v.string(),
  exercises: v.array(exerciseInTreeValidator),
  nodes: v.array(treeNodeValidator),
  connections: v.array(treeConnectionValidator),
  muscleGroups: v.array(v.string()),
});

const exerciseTreeWithProgressReturnValidator = v.object({
  _id: v.id("exercise_trees"),
  _creationTime: v.number(),
  title: v.string(),
  description: v.optional(v.string()),
  status: exerciseTreeStatusValidator,
  createdBy: v.string(),
  exercises: v.array(exerciseInTreeWithProgressValidator),
  nodes: v.array(treeNodeValidator),
  connections: v.array(treeConnectionValidator),
  muscleGroups: v.array(v.string()),
});

// ============================================================================
// Helper Functions
// ============================================================================

function collectExerciseIds(
  nodes: Array<{ exerciseId: Id<"exercises"> }>,
  connections: Array<{
    fromExercise: Id<"exercises">;
    toExercise: Id<"exercises">;
  }>,
): Set<Id<"exercises">> {
  const exerciseIds = new Set<Id<"exercises">>();

  for (const node of nodes) {
    exerciseIds.add(node.exerciseId);
  }

  for (const connection of connections) {
    exerciseIds.add(connection.fromExercise);
    exerciseIds.add(connection.toExercise);
  }

  return exerciseIds;
}

async function fetchExercises(
  ctx: QueryCtx,
  exerciseIds: Set<Id<"exercises">>,
): Promise<
  Array<{
    _id: Id<"exercises">;
    title: string;
    description: string;
    level: Doc<"exercises">["level"];
    difficulty: number;
  }>
> {
  if (exerciseIds.size === 0) {
    return [];
  }

  const exercises: Array<{
    _id: Id<"exercises">;
    title: string;
    description: string;
    level: Doc<"exercises">["level"];
    difficulty: number;
  }> = [];

  for (const exerciseId of exerciseIds) {
    const exercise = await ctx.db.get(exerciseId);
    if (exercise) {
      exercises.push({
        _id: exercise._id,
        title: exercise.title,
        description: exercise.description,
        level: exercise.level,
        difficulty: exercise.difficulty,
      });
    }
  }

  return exercises;
}

async function getMuscleGroupsForTree(
  ctx: QueryCtx,
  exerciseIds: Set<Id<"exercises">>,
): Promise<string[]> {
  if (exerciseIds.size === 0) {
    return [];
  }

  const muscleGroups = new Set<string>();
  const muscleRelations = await ctx.db.query("exercises_muscles").collect();

  const allMuscles = await ctx.db.query("muscles").collect();
  const musclesBySlug = new Map<string, Doc<"muscles">>();
  allMuscles.forEach((m: Doc<"muscles">) => musclesBySlug.set(m.slug, m));

  for (const rel of muscleRelations) {
    if (exerciseIds.has(rel.exercise) && rel.role === "primary") {
      const muscle = musclesBySlug.get(rel.muscle);
      if (muscle?.muscleGroup) {
        muscleGroups.add(muscle.muscleGroup);
      }
    }
  }

  return Array.from(muscleGroups).sort();
}

async function fetchUserProgress(
  ctx: QueryCtx,
  userId: string,
  exerciseIds: Set<Id<"exercises">>,
): Promise<
  Map<Id<"exercises">, "novice" | "apprentice" | "journeyman" | "master">
> {
  const userProgressMap = new Map<
    Id<"exercises">,
    "novice" | "apprentice" | "journeyman" | "master"
  >();

  const allProgress = await ctx.db
    .query("user_exercise_progress")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  for (const p of allProgress) {
    if (exerciseIds.has(p.exerciseId)) {
      userProgressMap.set(p.exerciseId, p.status);
    }
  }

  return userProgressMap;
}

async function enrichTree(
  ctx: QueryCtx,
  tree: Doc<"exercise_trees">,
): Promise<{
  _id: Id<"exercise_trees">;
  _creationTime: number;
  title: string;
  description?: string;
  status: "draft" | "published";
  createdBy: string;
  exercises: Array<{
    _id: Id<"exercises">;
    title: string;
    description: string;
    level: Doc<"exercises">["level"];
    difficulty: number;
  }>;
  nodes: Array<{
    exerciseId: Id<"exercises">;
    x: number;
    y: number;
  }>;
  connections: Array<{
    fromExercise: Id<"exercises">;
    toExercise: Id<"exercises">;
    type: "required" | "optional";
    sourceHandle: "top" | "bottom" | "left" | "right";
    targetHandle: "top" | "bottom" | "left" | "right";
  }>;
  muscleGroups: string[];
}> {
  const nodes = Array.isArray(tree.nodes) ? tree.nodes : [];
  const connections = Array.isArray(tree.connections) ? tree.connections : [];

  const exerciseIds = collectExerciseIds(nodes, connections);
  const [exercises, muscleGroups] = await Promise.all([
    fetchExercises(ctx, exerciseIds),
    getMuscleGroupsForTree(ctx, exerciseIds),
  ]);

  return {
    _id: tree._id,
    _creationTime: tree._creationTime,
    title: tree.title || "",
    description: tree.description,
    status: tree.status || "draft", // Default to published for backward compatibility
    createdBy: tree.createdBy || "",
    exercises,
    nodes,
    connections,
    muscleGroups,
  };
}

async function enrichTreeWithProgress(
  ctx: QueryCtx,
  tree: Doc<"exercise_trees">,
  userId: string | null,
): Promise<{
  _id: Id<"exercise_trees">;
  _creationTime: number;
  title: string;
  description?: string;
  status: "draft" | "published";
  createdBy: string;
  exercises: Array<{
    _id: Id<"exercises">;
    title: string;
    description: string;
    level: Doc<"exercises">["level"];
    difficulty: number;
    userProgress: {
      status: "novice" | "apprentice" | "journeyman" | "master";
    } | null;
  }>;
  nodes: Array<{
    exerciseId: Id<"exercises">;
    x: number;
    y: number;
  }>;
  connections: Array<{
    fromExercise: Id<"exercises">;
    toExercise: Id<"exercises">;
    type: "required" | "optional";
    sourceHandle: "top" | "bottom" | "left" | "right";
    targetHandle: "top" | "bottom" | "left" | "right";
  }>;
  muscleGroups: string[];
}> {
  const base = await enrichTree(ctx, tree);

  if (!userId) {
    return {
      ...base,
      exercises: base.exercises.map((e) => ({ ...e, userProgress: null })),
    };
  }

  const exerciseIds = collectExerciseIds(base.nodes, base.connections);
  const userProgressMap = await fetchUserProgress(ctx, userId, exerciseIds);

  return {
    ...base,
    exercises: base.exercises.map((exercise) => ({
      ...exercise,
      userProgress: userProgressMap.has(exercise._id)
        ? { status: userProgressMap.get(exercise._id)! }
        : null,
    })),
  };
}

export const list = query({
  args: {},
  returns: v.object({
    trees: v.array(exerciseTreeReturnValidator),
    isAdmin: v.boolean(),
  }),
  handler: async (ctx) => {
    const isAdmin = await isAdminOrModerator(ctx);

    const trees = isAdmin
      ? await ctx.db.query("exercise_trees").collect()
      : await ctx.db
          .query("exercise_trees")
          .withIndex("by_status", (q) => q.eq("status", "published"))
          .collect();

    const enrichedTrees = await Promise.all(
      trees.map((tree) => enrichTree(ctx, tree)),
    );

    return { trees: enrichedTrees, isAdmin };
  },
});

export const getById = query({
  args: {
    id: v.id("exercise_trees"),
  },
  returns: v.union(exerciseTreeReturnValidator, v.null()),
  handler: async (ctx, args) => {
    const tree = await ctx.db.get(args.id);
    if (!tree) {
      return null;
    }

    if (tree.status === "draft") {
      if (!(await isAdminOrModerator(ctx))) {
        return null;
      }
    }

    return enrichTree(ctx, tree);
  },
});

export const getByIdWithProgress = query({
  args: {
    id: v.id("exercise_trees"),
  },
  returns: v.union(exerciseTreeWithProgressReturnValidator, v.null()),
  handler: async (ctx, args) => {
    const tree = await ctx.db.get(args.id);
    if (!tree) {
      return null;
    }

    if (tree.status === "draft") {
      if (!(await isAdminOrModerator(ctx))) {
        return null;
      }
    }

    const userId = await getUserId(ctx);
    return enrichTreeWithProgress(ctx, tree, userId ?? null);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id("exercise_trees"),
  handler: async (ctx, args) => {
    if (!(await isAdminOrModerator(ctx))) {
      throw new Error(
        "Unauthorized: Only admins and moderators can create trees",
      );
    }

    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const now = Date.now();
    const treeId = await ctx.db.insert("exercise_trees", {
      title: args.title,
      description: args.description,
      status: "draft",
      createdBy: userId,
      nodes: [],
      connections: [],
      createdAt: now,
      updatedAt: now,
    });

    return treeId;
  },
});

export const update = mutation({
  args: {
    id: v.id("exercise_trees"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    nodes: v.optional(v.array(treeNodeValidator)),
    connections: v.optional(v.array(treeConnectionValidator)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await isAdminOrModerator(ctx))) {
      throw new Error(
        "Unauthorized: Only admins and moderators can update trees",
      );
    }

    const tree = await ctx.db.get(args.id);
    if (!tree) {
      throw new Error("Tree not found");
    }

    const updateData: Partial<Doc<"exercise_trees">> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      updateData.title = args.title;
    }
    if (args.description !== undefined) {
      updateData.description = args.description;
    }
    if (args.nodes !== undefined) {
      updateData.nodes = args.nodes;
    }
    if (args.connections !== undefined) {
      updateData.connections = args.connections;
    }

    await ctx.db.patch(args.id, updateData);
    return null;
  },
});

export const publish = mutation({
  args: {
    id: v.id("exercise_trees"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await isAdminOrModerator(ctx))) {
      throw new Error(
        "Unauthorized: Only admins and moderators can publish trees",
      );
    }

    const tree = await ctx.db.get(args.id);
    if (!tree) {
      throw new Error("Tree not found");
    }

    await ctx.db.patch(args.id, {
      status: "published",
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const unpublish = mutation({
  args: {
    id: v.id("exercise_trees"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await isAdminOrModerator(ctx))) {
      throw new Error(
        "Unauthorized: Only admins and moderators can unpublish trees",
      );
    }

    const tree = await ctx.db.get(args.id);
    if (!tree) {
      throw new Error("Tree not found");
    }

    await ctx.db.patch(args.id, {
      status: "draft",
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const delete_ = mutation({
  args: {
    id: v.id("exercise_trees"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await isAdminOrModerator(ctx))) {
      throw new Error(
        "Unauthorized: Only admins and moderators can delete trees",
      );
    }

    const tree = await ctx.db.get(args.id);
    if (!tree) {
      throw new Error("Tree not found");
    }

    await ctx.db.delete(args.id);
    return null;
  },
});

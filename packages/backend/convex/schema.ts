import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  exerciseLevelValidator,
  exerciseVariantValidator,
  muscleRoleValidator,
  progressStatusValidator,
} from "./validators/validators.js";

export default defineSchema({
  muscles: defineTable({
    name: v.string(),
    slug: v.string(),
    commonName: v.optional(v.string()),
    recommendedRestHours: v.number(),
    muscleGroup: v.string(),
  })
    .index("by_slug", ["slug"])
    .index("by_muscle_group", ["muscleGroup"]),

  equipment: defineTable({
    name: v.string(),
    slug: v.string(),
    category: v.string(),
  })
    .index("by_category", ["category"])
    .index("by_slug", ["slug"]),

  exercises: defineTable({
    title: v.string(),
    description: v.string(),
    level: exerciseLevelValidator,
    difficulty: v.number(),
    variants: v.array(exerciseVariantValidator),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.string(),
    slug: v.string(),
  })
    .index("by_level", ["level"])
    .index("by_difficulty", ["difficulty"])
    .index("by_slug", ["slug"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["level", "difficulty"],
    })
    .searchIndex("search_description", {
      searchField: "description",
      filterFields: ["level", "difficulty"],
    }),

  exercise_trees: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published")),
    createdBy: v.string(),
    nodes: v.array(
      v.object({
        exerciseId: v.id("exercises"),
        x: v.number(),
        y: v.number(),
      }),
    ),
    connections: v.array(
      v.object({
        fromExercise: v.id("exercises"),
        toExercise: v.id("exercises"),
        type: v.union(v.literal("required"), v.literal("optional")),
        sourceHandle: v.union(
          v.literal("top"),
          v.literal("bottom"),
          v.literal("left"),
          v.literal("right"),
        ),
        targetHandle: v.union(
          v.literal("top"),
          v.literal("bottom"),
          v.literal("left"),
          v.literal("right"),
        ),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_user", ["createdBy"]),

  exercises_muscles: defineTable({
    exercise: v.id("exercises"),
    muscle: v.string(), // Muscle slug
    role: muscleRoleValidator,
  })
    .index("by_exercise", ["exercise"])
    .index("by_muscle", ["muscle"])
    .index("by_muscle_and_role", ["muscle", "role"])
    .index("by_exercise_and_role", ["exercise", "role"]),

  exercise_progressions: defineTable({
    fromExercise: v.id("exercises"),
    toExercise: v.id("exercises"),
    createdAt: v.number(),
  })
    .index("by_from_exercise", ["fromExercise"])
    .index("by_to_exercise", ["toExercise"]),

  user_exercise_progress: defineTable({
    userId: v.string(),
    exerciseId: v.id("exercises"),
    status: progressStatusValidator,
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_exercise", ["exerciseId"])
    .index("by_user_and_exercise", ["userId", "exerciseId"]),
});

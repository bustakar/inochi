import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  exerciseLevelValidator,
  exerciseVariantValidator,
  muscleRoleValidator,
} from "./validators/validators.js";

const urlValidator = v.string();

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
  })
    .index("by_level", ["level"])
    .index("by_difficulty", ["difficulty"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["level", "difficulty"],
    })
    .searchIndex("search_description", {
      searchField: "description",
      filterFields: ["level", "difficulty"],
    }),

  exercises_muscles: defineTable({
    exercise: v.id("exercises"),
    muscle: v.id("muscles"),
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
});

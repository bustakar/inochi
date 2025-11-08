import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  exerciseCategoryValidator,
  exerciseLevelValidator,
  muscleRoleValidator,
} from "./validators/validators.js";

const urlValidator = v.string();

export default defineSchema({
  muscles: defineTable({
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
    category: exerciseCategoryValidator,
    level: exerciseLevelValidator,
    difficulty: v.number(),
    prerequisites: v.array(v.id("exercises")),
    progressionFrom: v.array(v.id("exercises")),
    progressionTo: v.array(v.id("exercises")),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.string(),
  })
    .index("by_level", ["level"])
    .index("by_difficulty", ["difficulty"])
    .index("by_category", ["category"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["level", "difficulty", "category"],
    })
    .searchIndex("search_description", {
      searchField: "description",
      filterFields: ["level", "difficulty", "category"],
    }),

  private_exercises: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.string(),
    category: exerciseCategoryValidator,
    level: exerciseLevelValidator,
    difficulty: v.number(),
    prerequisites: v.array(v.id("exercises")),
    progressionFrom: v.array(v.id("exercises")),
    progressionTo: v.array(v.id("exercises")),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.string(),
  })
    .index("by_level", ["level"])
    .index("by_difficulty", ["difficulty"])
    .index("by_category", ["category"])
    .index("by_user", ["createdBy"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["level", "difficulty", "category"],
    })
    .searchIndex("search_description", {
      searchField: "description",
      filterFields: ["level", "difficulty", "category"],
    }),

  exercise_variants: defineTable({
    exercise: v.id("exercises"),
    equipment: v.array(v.id("equipment")),
    tips: v.array(v.string()),
    embedded_videos: v.array(urlValidator),
    overriddenTitle: v.optional(v.string()),
    overriddenDescription: v.optional(v.string()),
    overriddenDifficulty: v.optional(v.number()),
    overriddenMuscles: v.optional(v.array(v.id("exercises_muscles"))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_exercise", ["exercise"])
    .index("by_equipment", ["equipment"]),

  exercises_muscles: defineTable({
    exercise: v.id("exercises"),
    muscle: v.id("muscles"),
    role: muscleRoleValidator,
  })
    .index("by_exercise", ["exercise"])
    .index("by_muscle", ["muscle"])
    .index("by_muscle_and_role", ["muscle", "role"])
    .index("by_exercise_and_role", ["exercise", "role"]),

  skills: defineTable({
    title: v.string(),
    description: v.string(),
    level: exerciseLevelValidator,
    difficulty: v.number(),
    muscles: v.array(v.id("muscles")),
    equipment: v.array(v.id("equipment")),
    embedded_videos: v.array(urlValidator),
    prerequisites: v.array(v.id("skills")),
    variants: v.array(v.id("skills")),
    tips: v.array(v.string()),
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

  private_skills: defineTable({
    title: v.string(),
    description: v.string(),
    level: exerciseLevelValidator,
    difficulty: v.number(),
    muscles: v.array(v.id("muscles")),
    equipment: v.array(v.id("equipment")),
    embedded_videos: v.array(urlValidator),
    prerequisites: v.array(v.union(v.id("skills"), v.id("private_skills"))),
    variants: v.array(v.union(v.id("skills"), v.id("private_skills"))),
    tips: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    userId: v.string(),
  })
    .index("by_user", ["userId"])
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

  user_submissions: defineTable({
    // All skill fields
    title: v.string(),
    description: v.string(),
    level: exerciseLevelValidator,
    difficulty: v.number(),
    muscles: v.array(v.id("muscles")),
    equipment: v.array(v.id("equipment")),
    embedded_videos: v.array(urlValidator),
    prerequisites: v.array(v.id("skills")),
    variants: v.array(v.id("skills")),
    tips: v.array(v.string()),
    // Submission-specific fields
    submissionType: v.union(v.literal("create"), v.literal("edit")),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    originalSkillId: v.optional(v.id("skills")),
    privateSkillId: v.optional(v.id("private_skills")),
    submittedBy: v.string(),
    submittedAt: v.number(),
    reviewedBy: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
  })
    .index("by_user", ["submittedBy"])
    .index("by_status", ["status"])
    .index("by_user_and_status", ["submittedBy", "status"]),
});

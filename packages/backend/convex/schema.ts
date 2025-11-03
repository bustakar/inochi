import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { levelValidator } from "./validators/validators.js";

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
  }).index("by_slug", ["slug"]),

  equipment: defineTable({
    name: v.string(),
    slug: v.string(),
    category: v.string(),
  })
    .index("by_category", ["category"])
    .index("by_slug", ["slug"]),

  skills: defineTable({
    title: v.string(),
    description: v.string(),
    level: levelValidator,
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

  user_submissions: defineTable({
    // All skill fields
    title: v.string(),
    description: v.string(),
    level: levelValidator,
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

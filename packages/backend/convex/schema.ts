import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { levelValidator } from "./validators";

const urlValidator = v.string();

export default defineSchema({
  muscles: defineTable({
    name: v.string(),
    category: v.string(),
  }).index("by_category", ["category"]),

  equipment: defineTable({
    name: v.string(),
    category: v.string(),
  }).index("by_category", ["category"]),

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
});

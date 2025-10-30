import { Auth } from "convex/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import {
  levelValidator,
  validateDifficulty,
  validateUrlArray,
} from "./validators";

export const getUserId = async (ctx: { auth: Auth }) => {
  return (await ctx.auth.getUserIdentity())?.subject;
};

// Get all skills with optional filtering
export const getSkills = query({
  args: {
    level: v.optional(levelValidator),
    minDifficulty: v.optional(v.number()),
    maxDifficulty: v.optional(v.number()),
    muscleIds: v.optional(v.array(v.id("muscles"))),
    equipmentIds: v.optional(v.array(v.id("equipment"))),
  },
  returns: v.array(
    v.object({
      _id: v.id("skills"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      level: levelValidator,
      difficulty: v.number(),
      muscles: v.array(v.id("muscles")),
      equipment: v.array(v.id("equipment")),
      embedded_videos: v.array(v.string()),
      prerequisites: v.array(v.id("skills")),
      variants: v.array(v.id("skills")),
      tips: v.array(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
      createdBy: v.string(),
      musclesData: v.array(
        v.object({
          _id: v.id("muscles"),
          _creationTime: v.number(),
          name: v.string(),
          category: v.string(),
        }),
      ),
      equipmentData: v.array(
        v.object({
          _id: v.id("equipment"),
          _creationTime: v.number(),
          name: v.string(),
          category: v.string(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    let skills: Array<Doc<"skills">>;

    if (args.level) {
      // Use level index if level is specified
      const level = args.level;
      const levelSkills = await ctx.db
        .query("skills")
        .withIndex("by_level", (q) => q.eq("level", level))
        .collect();
      skills = levelSkills;
    } else if (
      args.minDifficulty !== undefined ||
      args.maxDifficulty !== undefined
    ) {
      // Use difficulty index if difficulty range is specified
      const difficultySkills = await ctx.db
        .query("skills")
        .withIndex("by_difficulty")
        .collect();
      skills = difficultySkills;
    } else {
      // Get all skills if no filters
      skills = await ctx.db.query("skills").collect();
    }

    // Filter by difficulty range if provided
    if (args.minDifficulty !== undefined || args.maxDifficulty !== undefined) {
      skills = skills.filter((skill) => {
        if (
          args.minDifficulty !== undefined &&
          skill.difficulty < args.minDifficulty
        ) {
          return false;
        }
        if (
          args.maxDifficulty !== undefined &&
          skill.difficulty > args.maxDifficulty
        ) {
          return false;
        }
        return true;
      });
    }

    // Filter by muscles if provided
    if (args.muscleIds && args.muscleIds.length > 0) {
      skills = skills.filter((skill) =>
        skill.muscles.some((id) => args.muscleIds!.includes(id)),
      );
    }

    // Filter by equipment if provided
    if (args.equipmentIds && args.equipmentIds.length > 0) {
      skills = skills.filter((skill) =>
        skill.equipment.some((id) => args.equipmentIds!.includes(id)),
      );
    }

    // Enrich with muscle and equipment data
    const muscles = await ctx.db.query("muscles").collect();
    const equipment = await ctx.db.query("equipment").collect();

    return skills.map((skill) => ({
      ...skill,
      musclesData: skill.muscles
        .map((id) => muscles.find((m) => m._id === id))
        .filter((m): m is Doc<"muscles"> => m !== undefined),
      equipmentData: skill.equipment
        .map((id) => equipment.find((e) => e._id === id))
        .filter((e): e is Doc<"equipment"> => e !== undefined),
    }));
  },
});

// Get a specific skill by ID
export const getSkill = query({
  args: {
    id: v.id("skills"),
  },
  returns: v.union(
    v.object({
      _id: v.id("skills"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      level: levelValidator,
      difficulty: v.number(),
      muscles: v.array(v.id("muscles")),
      equipment: v.array(v.id("equipment")),
      embedded_videos: v.array(v.string()),
      prerequisites: v.array(v.id("skills")),
      variants: v.array(v.id("skills")),
      tips: v.array(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
      createdBy: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const skill = await ctx.db.get(args.id);
    return skill;
  },
});

// Search skills by title or description
export const searchSkills = query({
  args: {
    searchQuery: v.string(),
    level: v.optional(levelValidator),
    minDifficulty: v.optional(v.number()),
    maxDifficulty: v.optional(v.number()),
    muscleIds: v.optional(v.array(v.id("muscles"))),
    equipmentIds: v.optional(v.array(v.id("equipment"))),
  },
  returns: v.array(
    v.object({
      _id: v.id("skills"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      level: levelValidator,
      difficulty: v.number(),
      muscles: v.array(v.id("muscles")),
      equipment: v.array(v.id("equipment")),
      embedded_videos: v.array(v.string()),
      prerequisites: v.array(v.id("skills")),
      variants: v.array(v.id("skills")),
      tips: v.array(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
      createdBy: v.string(),
      musclesData: v.array(
        v.object({
          _id: v.id("muscles"),
          _creationTime: v.number(),
          name: v.string(),
          category: v.string(),
        }),
      ),
      equipmentData: v.array(
        v.object({
          _id: v.id("equipment"),
          _creationTime: v.number(),
          name: v.string(),
          category: v.string(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    // Search in title first
    let titleQuery = ctx.db
      .query("skills")
      .withSearchIndex("search_title", (q) => {
        let searchQuery = q.search("title", args.searchQuery);
        if (args.level) {
          const level = args.level;
          searchQuery = searchQuery.eq("level", level);
        }
        return searchQuery;
      });

    const titleResults = await titleQuery.take(50);

    // Also search in description
    let descQuery = ctx.db
      .query("skills")
      .withSearchIndex("search_description", (q) => {
        let searchQuery = q.search("description", args.searchQuery);
        if (args.level) {
          const level = args.level;
          searchQuery = searchQuery.eq("level", level);
        }
        return searchQuery;
      });

    const descResults = await descQuery.take(50);

    // Combine and deduplicate results
    const skillMap = new Map<Id<"skills">, Doc<"skills">>();
    [...titleResults, ...descResults].forEach((skill) => {
      if (!skillMap.has(skill._id)) {
        skillMap.set(skill._id, skill);
      }
    });

    // Filter by difficulty range if provided
    let results = Array.from(skillMap.values());
    if (args.minDifficulty !== undefined || args.maxDifficulty !== undefined) {
      results = results.filter((skill) => {
        if (
          args.minDifficulty !== undefined &&
          skill.difficulty < args.minDifficulty
        ) {
          return false;
        }
        if (
          args.maxDifficulty !== undefined &&
          skill.difficulty > args.maxDifficulty
        ) {
          return false;
        }
        return true;
      });
    }

    // Filter by muscles if provided
    if (args.muscleIds && args.muscleIds.length > 0) {
      results = results.filter((skill) =>
        skill.muscles.some((id) => args.muscleIds!.includes(id)),
      );
    }

    // Filter by equipment if provided
    if (args.equipmentIds && args.equipmentIds.length > 0) {
      results = results.filter((skill) =>
        skill.equipment.some((id) => args.equipmentIds!.includes(id)),
      );
    }

    // Enrich with muscle and equipment data
    const muscles = await ctx.db.query("muscles").collect();
    const equipment = await ctx.db.query("equipment").collect();

    return results.map((skill) => ({
      ...skill,
      musclesData: skill.muscles
        .map((id) => muscles.find((m) => m._id === id))
        .filter((m): m is Doc<"muscles"> => m !== undefined),
      equipmentData: skill.equipment
        .map((id) => equipment.find((e) => e._id === id))
        .filter((e): e is Doc<"equipment"> => e !== undefined),
    }));
  },
});

// Create a new skill
export const createSkill = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    level: levelValidator,
    difficulty: v.number(),
    muscles: v.array(v.id("muscles")),
    equipment: v.array(v.id("equipment")),
    embedded_videos: v.array(v.string()),
    prerequisites: v.array(v.id("skills")),
    variants: v.array(v.id("skills")),
    tips: v.array(v.string()),
  },
  returns: v.id("skills"),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("User not found");

    // Validate difficulty
    validateDifficulty(args.difficulty);

    // Validate URLs
    validateUrlArray(args.embedded_videos);

    // Validate that prerequisites and variants exist
    for (const prereqId of args.prerequisites) {
      const prereq = await ctx.db.get(prereqId);
      if (!prereq) {
        throw new Error(`Prerequisite skill not found: ${prereqId}`);
      }
    }

    for (const variantId of args.variants) {
      const variant = await ctx.db.get(variantId);
      if (!variant) {
        throw new Error(`Variant skill not found: ${variantId}`);
      }
    }

    // Validate that muscles and equipment exist
    for (const muscleId of args.muscles) {
      const muscle = await ctx.db.get(muscleId);
      if (!muscle) {
        throw new Error(`Muscle not found: ${muscleId}`);
      }
    }

    for (const equipmentId of args.equipment) {
      const equipment = await ctx.db.get(equipmentId);
      if (!equipment) {
        throw new Error(`Equipment not found: ${equipmentId}`);
      }
    }

    const now = Date.now();
    const skillId = await ctx.db.insert("skills", {
      title: args.title,
      description: args.description,
      level: args.level,
      difficulty: args.difficulty,
      muscles: args.muscles,
      equipment: args.equipment,
      embedded_videos: args.embedded_videos,
      prerequisites: args.prerequisites,
      variants: args.variants,
      tips: args.tips,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    });

    return skillId;
  },
});

// Update an existing skill
export const updateSkill = mutation({
  args: {
    id: v.id("skills"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    level: v.optional(levelValidator),
    difficulty: v.optional(v.number()),
    muscles: v.optional(v.array(v.id("muscles"))),
    equipment: v.optional(v.array(v.id("equipment"))),
    embedded_videos: v.optional(v.array(v.string())),
    prerequisites: v.optional(v.array(v.id("skills"))),
    variants: v.optional(v.array(v.id("skills"))),
    tips: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const skill = await ctx.db.get(args.id);
    if (!skill) {
      throw new Error("Skill not found");
    }

    // Validate difficulty if provided
    if (args.difficulty !== undefined) {
      validateDifficulty(args.difficulty);
    }

    // Validate URLs if provided
    if (args.embedded_videos !== undefined) {
      validateUrlArray(args.embedded_videos);
    }

    // Validate that prerequisites exist if provided
    if (args.prerequisites !== undefined) {
      for (const prereqId of args.prerequisites) {
        const prereq = await ctx.db.get(prereqId);
        if (!prereq) {
          throw new Error(`Prerequisite skill not found: ${prereqId}`);
        }
      }
    }

    // Validate that variants exist if provided
    if (args.variants !== undefined) {
      for (const variantId of args.variants) {
        const variant = await ctx.db.get(variantId);
        if (!variant) {
          throw new Error(`Variant skill not found: ${variantId}`);
        }
      }
    }

    // Validate that muscles exist if provided
    if (args.muscles !== undefined) {
      for (const muscleId of args.muscles) {
        const muscle = await ctx.db.get(muscleId);
        if (!muscle) {
          throw new Error(`Muscle not found: ${muscleId}`);
        }
      }
    }

    // Validate that equipment exists if provided
    if (args.equipment !== undefined) {
      for (const equipmentId of args.equipment) {
        const equipment = await ctx.db.get(equipmentId);
        if (!equipment) {
          throw new Error(`Equipment not found: ${equipmentId}`);
        }
      }
    }

    // Build update object
    const updates: {
      title?: string;
      description?: string;
      level?: Doc<"skills">["level"];
      difficulty?: number;
      muscles?: Id<"muscles">[];
      equipment?: Id<"equipment">[];
      embedded_videos?: string[];
      prerequisites?: Id<"skills">[];
      variants?: Id<"skills">[];
      tips?: string[];
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.level !== undefined) updates.level = args.level;
    if (args.difficulty !== undefined) updates.difficulty = args.difficulty;
    if (args.muscles !== undefined) updates.muscles = args.muscles;
    if (args.equipment !== undefined) updates.equipment = args.equipment;
    if (args.embedded_videos !== undefined)
      updates.embedded_videos = args.embedded_videos;
    if (args.prerequisites !== undefined)
      updates.prerequisites = args.prerequisites;
    if (args.variants !== undefined) updates.variants = args.variants;
    if (args.tips !== undefined) updates.tips = args.tips;

    await ctx.db.patch(args.id, updates);
    return null;
  },
});

// Delete a skill
export const deleteSkill = mutation({
  args: {
    id: v.id("skills"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const skill = await ctx.db.get(args.id);
    if (!skill) {
      throw new Error("Skill not found");
    }
    await ctx.db.delete(args.id);
    return null;
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
      category: v.string(),
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
      category: v.string(),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("equipment").collect();
  },
});

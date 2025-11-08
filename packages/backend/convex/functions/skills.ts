import { Auth } from "convex/server";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { internalQuery, mutation, query } from "../_generated/server";
import {
  createPrivateSkillValidator,
  levelValidator,
  partialSkillDataValidator,
  validateDifficulty,
  validateUrlArray,
} from "../validators/validators";

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
          slug: v.string(),
          recommendedRestHours: v.number(),
          parts: v.array(
            v.object({
              name: v.string(),
              slug: v.string(),
            }),
          ),
          muscleGroup: v.optional(v.string()),
        }),
      ),
      equipmentData: v.array(
        v.object({
          _id: v.id("equipment"),
          _creationTime: v.number(),
          name: v.string(),
          slug: v.string(),
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
          slug: v.string(),
          recommendedRestHours: v.number(),
          parts: v.array(
            v.object({
              name: v.string(),
              slug: v.string(),
            }),
          ),
          muscleGroup: v.optional(v.string()),
        }),
      ),
      equipmentData: v.array(
        v.object({
          _id: v.id("equipment"),
          _creationTime: v.number(),
          name: v.string(),
          slug: v.string(),
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
      slug: v.string(),
      recommendedRestHours: v.number(),
      parts: v.array(
        v.object({
          name: v.string(),
          slug: v.string(),
        }),
      ),
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

// Unified query to get all skills (public, private, or both) with optional filtering
export const getAllSkills = query({
  args: {
    type: v.union(v.literal("all"), v.literal("public"), v.literal("private")),
    level: v.optional(levelValidator),
    minDifficulty: v.optional(v.number()),
    maxDifficulty: v.optional(v.number()),
    muscleIds: v.optional(v.array(v.id("muscles"))),
    equipmentIds: v.optional(v.array(v.id("equipment"))),
    searchQuery: v.optional(v.string()),
  },
  returns: v.array(
    v.union(
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
        isPrivate: v.literal(false),
        musclesData: v.array(
          v.object({
            _id: v.id("muscles"),
            _creationTime: v.number(),
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
          }),
        ),
        equipmentData: v.array(
          v.object({
            _id: v.id("equipment"),
            _creationTime: v.number(),
            name: v.string(),
            slug: v.string(),
            category: v.string(),
          }),
        ),
      }),
      v.object({
        _id: v.id("private_skills"),
        _creationTime: v.number(),
        title: v.string(),
        description: v.string(),
        level: levelValidator,
        difficulty: v.number(),
        muscles: v.array(v.id("muscles")),
        equipment: v.array(v.id("equipment")),
        embedded_videos: v.array(v.string()),
        prerequisites: v.array(v.union(v.id("skills"), v.id("private_skills"))),
        variants: v.array(v.union(v.id("skills"), v.id("private_skills"))),
        tips: v.array(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
        userId: v.string(),
        isPrivate: v.literal(true),
        musclesData: v.array(
          v.object({
            _id: v.id("muscles"),
            _creationTime: v.number(),
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
          }),
        ),
        equipmentData: v.array(
          v.object({
            _id: v.id("equipment"),
            _creationTime: v.number(),
            name: v.string(),
            slug: v.string(),
            category: v.string(),
          }),
        ),
      }),
    ),
  ),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const shouldQueryPublic = args.type === "all" || args.type === "public";
    const shouldQueryPrivate = args.type === "all" || args.type === "private";

    // Helper function to filter and enrich skills
    const filterAndEnrich = async <
      T extends Doc<"skills"> | Doc<"private_skills">,
    >(
      skills: T[],
    ) => {
      // Filter by difficulty range if provided
      let filtered = skills;
      if (
        args.minDifficulty !== undefined ||
        args.maxDifficulty !== undefined
      ) {
        filtered = filtered.filter((skill) => {
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
        filtered = filtered.filter((skill) =>
          skill.muscles.some((id) => args.muscleIds!.includes(id)),
        );
      }

      // Filter by equipment if provided
      if (args.equipmentIds && args.equipmentIds.length > 0) {
        filtered = filtered.filter((skill) =>
          skill.equipment.some((id) => args.equipmentIds!.includes(id)),
        );
      }

      // Enrich with muscle and equipment data
      const muscles = await ctx.db.query("muscles").collect();
      const equipment = await ctx.db.query("equipment").collect();

      return filtered.map((skill) => ({
        ...skill,
        musclesData: skill.muscles
          .map((id) => muscles.find((m) => m._id === id))
          .filter((m): m is Doc<"muscles"> => m !== undefined),
        equipmentData: skill.equipment
          .map((id) => equipment.find((e) => e._id === id))
          .filter((e): e is Doc<"equipment"> => e !== undefined),
      }));
    };

    // Query public skills
    let publicSkills: Array<Doc<"skills">> = [];
    if (shouldQueryPublic) {
      if (args.searchQuery) {
        // Search in title first
        const titleQuery = ctx.db
          .query("skills")
          .withSearchIndex("search_title", (q) => {
            let searchQuery = q.search("title", args.searchQuery!);
            if (args.level) {
              searchQuery = searchQuery.eq("level", args.level);
            }
            return searchQuery;
          });
        const titleResults = await titleQuery.take(50);

        // Also search in description
        const descQuery = ctx.db
          .query("skills")
          .withSearchIndex("search_description", (q) => {
            let searchQuery = q.search("description", args.searchQuery!);
            if (args.level) {
              searchQuery = searchQuery.eq("level", args.level);
            }
            return searchQuery;
          });
        const descResults = await descQuery.take(50);

        // Combine and deduplicate
        const skillMap = new Map<Id<"skills">, Doc<"skills">>();
        [...titleResults, ...descResults].forEach((skill) => {
          if (!skillMap.has(skill._id)) {
            skillMap.set(skill._id, skill);
          }
        });
        publicSkills = Array.from(skillMap.values());
      } else {
        if (args.level) {
          publicSkills = await ctx.db
            .query("skills")
            .withIndex("by_level", (q) => q.eq("level", args.level!))
            .collect();
        } else if (
          args.minDifficulty !== undefined ||
          args.maxDifficulty !== undefined
        ) {
          publicSkills = await ctx.db
            .query("skills")
            .withIndex("by_difficulty")
            .collect();
        } else {
          publicSkills = await ctx.db.query("skills").collect();
        }
      }
    }

    // Query private skills
    let privateSkills: Array<Doc<"private_skills">> = [];
    if (shouldQueryPrivate && userId) {
      if (args.searchQuery) {
        // Search in title first
        const titleQuery = ctx.db
          .query("private_skills")
          .withSearchIndex("search_title", (q) => {
            let searchQuery = q.search("title", args.searchQuery!);
            if (args.level) {
              searchQuery = searchQuery.eq("level", args.level);
            }
            return searchQuery;
          });
        const titleResults = await titleQuery.take(50);

        // Also search in description
        const descQuery = ctx.db
          .query("private_skills")
          .withSearchIndex("search_description", (q) => {
            let searchQuery = q.search("description", args.searchQuery!);
            if (args.level) {
              searchQuery = searchQuery.eq("level", args.level);
            }
            return searchQuery;
          });
        const descResults = await descQuery.take(50);

        // Combine, deduplicate, and filter by user
        const skillMap = new Map<Id<"private_skills">, Doc<"private_skills">>();
        [...titleResults, ...descResults]
          .filter((skill) => skill.userId === userId)
          .forEach((skill) => {
            if (!skillMap.has(skill._id)) {
              skillMap.set(skill._id, skill);
            }
          });
        privateSkills = Array.from(skillMap.values());
      } else {
        if (args.level) {
          const levelSkills = await ctx.db
            .query("private_skills")
            .withIndex("by_level", (q) => q.eq("level", args.level!))
            .collect();
          privateSkills = levelSkills.filter(
            (skill) => skill.userId === userId,
          );
        } else if (
          args.minDifficulty !== undefined ||
          args.maxDifficulty !== undefined
        ) {
          const difficultySkills = await ctx.db
            .query("private_skills")
            .withIndex("by_difficulty")
            .collect();
          privateSkills = difficultySkills.filter(
            (skill) => skill.userId === userId,
          );
        } else {
          privateSkills = await ctx.db
            .query("private_skills")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
        }
      }
    }

    // Filter and enrich both sets
    const enrichedPublic = await filterAndEnrich(publicSkills);
    const enrichedPrivate = await filterAndEnrich(privateSkills);

    // Combine results
    const results = [
      ...enrichedPublic.map((s) => ({ ...s, isPrivate: false as const })),
      ...enrichedPrivate.map((s) => ({ ...s, isPrivate: true as const })),
    ];

    return results;
  },
});

// Get user's private skills with optional filtering
export const getPrivateSkills = query({
  args: {
    level: v.optional(levelValidator),
    minDifficulty: v.optional(v.number()),
    maxDifficulty: v.optional(v.number()),
    muscleIds: v.optional(v.array(v.id("muscles"))),
    equipmentIds: v.optional(v.array(v.id("equipment"))),
  },
  returns: v.array(
    v.object({
      _id: v.id("private_skills"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      level: levelValidator,
      difficulty: v.number(),
      muscles: v.array(v.id("muscles")),
      equipment: v.array(v.id("equipment")),
      embedded_videos: v.array(v.string()),
      prerequisites: v.array(v.union(v.id("skills"), v.id("private_skills"))),
      variants: v.array(v.union(v.id("skills"), v.id("private_skills"))),
      tips: v.array(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
      userId: v.string(),
      musclesData: v.array(
        v.object({
          _id: v.id("muscles"),
          _creationTime: v.number(),
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
        }),
      ),
      equipmentData: v.array(
        v.object({
          _id: v.id("equipment"),
          _creationTime: v.number(),
          name: v.string(),
          slug: v.string(),
          category: v.string(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    let privateSkills: Array<Doc<"private_skills">>;

    if (args.level) {
      const level = args.level;
      const levelSkills = await ctx.db
        .query("private_skills")
        .withIndex("by_level", (q) => q.eq("level", level))
        .collect();
      privateSkills = levelSkills.filter((skill) => skill.userId === userId);
    } else if (
      args.minDifficulty !== undefined ||
      args.maxDifficulty !== undefined
    ) {
      const difficultySkills = await ctx.db
        .query("private_skills")
        .withIndex("by_difficulty")
        .collect();
      privateSkills = difficultySkills.filter(
        (skill) => skill.userId === userId,
      );
    } else {
      privateSkills = await ctx.db
        .query("private_skills")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
    }

    // Filter by difficulty range if provided
    if (args.minDifficulty !== undefined || args.maxDifficulty !== undefined) {
      privateSkills = privateSkills.filter((skill) => {
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
      privateSkills = privateSkills.filter((skill) =>
        skill.muscles.some((id) => args.muscleIds!.includes(id)),
      );
    }

    // Filter by equipment if provided
    if (args.equipmentIds && args.equipmentIds.length > 0) {
      privateSkills = privateSkills.filter((skill) =>
        skill.equipment.some((id) => args.equipmentIds!.includes(id)),
      );
    }

    // Enrich with muscle and equipment data
    const muscles = await ctx.db.query("muscles").collect();
    const equipment = await ctx.db.query("equipment").collect();

    return privateSkills.map((skill) => ({
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

// Get a specific private skill by ID
export const getPrivateSkill = query({
  args: {
    id: v.id("private_skills"),
  },
  returns: v.union(
    v.object({
      _id: v.id("private_skills"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      level: levelValidator,
      difficulty: v.number(),
      muscles: v.array(v.id("muscles")),
      equipment: v.array(v.id("equipment")),
      embedded_videos: v.array(v.string()),
      prerequisites: v.array(v.union(v.id("skills"), v.id("private_skills"))),
      variants: v.array(v.union(v.id("skills"), v.id("private_skills"))),
      tips: v.array(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
      userId: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const skill = await ctx.db.get(args.id);
    if (!skill) {
      return null;
    }

    // Verify ownership
    if (skill.userId !== userId) {
      throw new Error(
        "Unauthorized: You can only view your own private skills",
      );
    }

    return skill;
  },
});

// Get a specific private skill by ID (alias)
export const getPrivateSkillById = query({
  args: {
    private_skill_id: v.id("private_skills"),
  },
  returns: v.union(
    v.object({
      _id: v.id("private_skills"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      level: levelValidator,
      difficulty: v.number(),
      muscles: v.array(v.id("muscles")),
      equipment: v.array(v.id("equipment")),
      embedded_videos: v.array(v.string()),
      prerequisites: v.array(v.union(v.id("skills"), v.id("private_skills"))),
      variants: v.array(v.union(v.id("skills"), v.id("private_skills"))),
      tips: v.array(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
      userId: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const skill = await ctx.db.get(args.private_skill_id);
    if (!skill) {
      return null;
    }

    // Verify ownership
    if (skill.userId !== userId) {
      throw new Error(
        "Unauthorized: You can only view your own private skills",
      );
    }

    return skill;
  },
});

// Search user's private skills by title or description
export const searchPrivateSkills = query({
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
      _id: v.id("private_skills"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      level: levelValidator,
      difficulty: v.number(),
      muscles: v.array(v.id("muscles")),
      equipment: v.array(v.id("equipment")),
      embedded_videos: v.array(v.string()),
      prerequisites: v.array(v.union(v.id("skills"), v.id("private_skills"))),
      variants: v.array(v.union(v.id("skills"), v.id("private_skills"))),
      tips: v.array(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
      userId: v.string(),
      musclesData: v.array(
        v.object({
          _id: v.id("muscles"),
          _creationTime: v.number(),
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
        }),
      ),
      equipmentData: v.array(
        v.object({
          _id: v.id("equipment"),
          _creationTime: v.number(),
          name: v.string(),
          slug: v.string(),
          category: v.string(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Search in title first
    let titleQuery = ctx.db
      .query("private_skills")
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
      .query("private_skills")
      .withSearchIndex("search_description", (q) => {
        let searchQuery = q.search("description", args.searchQuery);
        if (args.level) {
          const level = args.level;
          searchQuery = searchQuery.eq("level", level);
        }
        return searchQuery;
      });

    const descResults = await descQuery.take(50);

    // Combine and deduplicate results, filter by user
    const skillMap = new Map<Id<"private_skills">, Doc<"private_skills">>();
    [...titleResults, ...descResults]
      .filter((skill) => skill.userId === userId)
      .forEach((skill) => {
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

// Create a new private skill
export const createPrivateSkillMutation = mutation({
  args: {
    data: createPrivateSkillValidator,
  },
  returns: v.id("private_skills"),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("User not found");

    const now = Date.now();
    const skillId = await ctx.db.insert("private_skills", {
      title: args.data.title,
      description: "",
      level: "beginner",
      difficulty: 1,
      muscles: [],
      equipment: [],
      embedded_videos: [],
      prerequisites: [],
      variants: [],
      tips: [],
      createdAt: now,
      updatedAt: now,
      userId: userId,
    });

    return skillId;
  },
});

export const createPrivateSkill = mutation({
  args: {
    data: createPrivateSkillValidator,
  },
  returns: v.id("private_skills"),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("User not found");

    const now = Date.now();
    const skillId = await ctx.db.insert("private_skills", {
      title: args.data.title,
      description: "",
      level: "beginner",
      difficulty: 1,
      muscles: [],
      equipment: [],
      embedded_videos: [],
      prerequisites: [],
      variants: [],
      tips: [],
      createdAt: now,
      updatedAt: now,
      userId: userId,
    });

    return skillId;
  },
});

// Update an existing private skill
export const updatePrivateSkill = mutation({
  args: {
    id: v.id("private_skills"),
    skillData: partialSkillDataValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const skill = await ctx.db.get(args.id);
    if (!skill) {
      throw new Error("Private skill not found");
    }

    // Verify ownership
    if (skill.userId !== userId) {
      throw new Error(
        "Unauthorized: You can only update your own private skills",
      );
    }

    // Validate difficulty if provided
    if (args.skillData.difficulty !== undefined) {
      validateDifficulty(args.skillData.difficulty);
    }

    // Validate URLs if provided
    if (args.skillData.embedded_videos !== undefined) {
      validateUrlArray(args.skillData.embedded_videos);
    }

    // Validate that prerequisites exist if provided
    if (args.skillData.prerequisites !== undefined) {
      for (const prereqId of args.skillData.prerequisites) {
        const prereqPublic = await ctx.db.get(prereqId as Id<"skills">);
        const prereqPrivate = prereqPublic
          ? null
          : await ctx.db.get(prereqId as Id<"private_skills">);

        if (!prereqPublic && !prereqPrivate) {
          throw new Error(`Prerequisite skill not found: ${prereqId}`);
        }

        if (prereqPrivate && prereqPrivate.userId !== userId) {
          throw new Error(
            `Unauthorized: You can only reference your own private skills`,
          );
        }
      }
    }

    // Validate that variants exist if provided
    if (args.skillData.variants !== undefined) {
      for (const variantId of args.skillData.variants) {
        const variantPublic = await ctx.db.get(variantId as Id<"skills">);
        const variantPrivate = variantPublic
          ? null
          : await ctx.db.get(variantId as Id<"private_skills">);

        if (!variantPublic && !variantPrivate) {
          throw new Error(`Variant skill not found: ${variantId}`);
        }

        if (variantPrivate && variantPrivate.userId !== userId) {
          throw new Error(
            `Unauthorized: You can only reference your own private skills`,
          );
        }
      }
    }

    // Validate that muscles exist if provided
    if (args.skillData.muscles !== undefined) {
      for (const muscleId of args.skillData.muscles) {
        const muscle = await ctx.db.get(muscleId);
        if (!muscle) {
          throw new Error(`Muscle not found: ${muscleId}`);
        }
      }
    }

    // Validate that equipment exists if provided
    if (args.skillData.equipment !== undefined) {
      for (const equipmentId of args.skillData.equipment) {
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
      level?: Doc<"private_skills">["level"];
      difficulty?: number;
      muscles?: Id<"muscles">[];
      equipment?: Id<"equipment">[];
      embedded_videos?: string[];
      prerequisites?: Array<Id<"skills"> | Id<"private_skills">>;
      variants?: Array<Id<"skills"> | Id<"private_skills">>;
      tips?: string[];
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.skillData.title !== undefined)
      updates.title = args.skillData.title;
    if (args.skillData.description !== undefined)
      updates.description = args.skillData.description;
    if (args.skillData.level !== undefined)
      updates.level = args.skillData.level;
    if (args.skillData.difficulty !== undefined)
      updates.difficulty = args.skillData.difficulty;
    if (args.skillData.muscles !== undefined)
      updates.muscles = args.skillData.muscles;
    if (args.skillData.equipment !== undefined)
      updates.equipment = args.skillData.equipment;
    if (args.skillData.embedded_videos !== undefined)
      updates.embedded_videos = args.skillData.embedded_videos;
    if (args.skillData.prerequisites !== undefined)
      updates.prerequisites = args.skillData.prerequisites;
    if (args.skillData.variants !== undefined)
      updates.variants = args.skillData.variants;
    if (args.skillData.tips !== undefined) updates.tips = args.skillData.tips;

    await ctx.db.patch(args.id, updates);
    return null;
  },
});

// Delete a private skill
export const deletePrivateSkill = mutation({
  args: {
    id: v.id("private_skills"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const skill = await ctx.db.get(args.id);
    if (!skill) {
      throw new Error("Private skill not found");
    }

    // Verify ownership
    if (skill.userId !== userId) {
      throw new Error(
        "Unauthorized: You can only delete your own private skills",
      );
    }

    await ctx.db.delete(args.id);
    return null;
  },
});

// Internal query for AI - returns simplified muscle data
export const getAllMusclesForAI = internalQuery({
  handler: async (ctx) => {
    const muscles = await ctx.db.query("muscles").collect();
    return muscles.map((m) => ({ _id: m._id, name: m.name }));
  },
});

// Internal query for AI - returns simplified equipment data
export const getAllEquipmentForAI = internalQuery({
  handler: async (ctx) => {
    const equipment = await ctx.db.query("equipment").collect();
    return equipment.map((e) => ({ _id: e._id, name: e.name }));
  },
});

// Internal query for AI - returns simplified skill data
export const getAllSkillsForAI = internalQuery({
  handler: async (ctx) => {
    const skills = await ctx.db.query("skills").collect();
    return skills.map((s) => ({
      _id: s._id,
      title: s.title,
      level: s.level,
      difficulty: s.difficulty,
      isPrivate: false as const,
    }));
  },
});

// Internal query for AI - returns user's private skills
export const getPrivateSkillsForAI = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const privateSkills = await ctx.db
      .query("private_skills")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return privateSkills.map((s) => ({
      _id: s._id,
      title: s.title,
      level: s.level,
      difficulty: s.difficulty,
      isPrivate: true as const,
    }));
  },
});

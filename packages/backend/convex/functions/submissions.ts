import { Auth } from "convex/server";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import {
  levelValidator,
  validateDifficulty,
  validateUrlArray,
} from "../validators/validators";

export const getUserId = async (ctx: { auth: Auth }) => {
  return (await ctx.auth.getUserIdentity())?.subject;
};

// Get user role from Clerk token metadata
// Note: This assumes the role is passed from the frontend since Convex
// doesn't directly expose JWT claims. The frontend will pass the role.
export const getUserRole = async (
  ctx: { auth: Auth },
  roleFromClient?: string,
): Promise<"admin" | "moderator" | "user"> => {
  // Try to get role from token claims if available
  // If not available, use role passed from client (defaults to "user")
  // In production, you might want to verify the role server-side
  return (roleFromClient as "admin" | "moderator" | "user") || "user";
};

export const isAdminOrModerator = async (
  ctx: { auth: Auth },
  roleFromClient?: string,
): Promise<boolean> => {
  const role = await getUserRole(ctx, roleFromClient);
  return role === "admin" || role === "moderator";
};

// Get all submissions (for admin/moderator) or user's own submissions
export const getUserSubmissions = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
      ),
    ),
    userRole: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("user_submissions"),
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
          category: v.string(),
        }),
      ),
      originalSkillData: v.optional(
        v.object({
          _id: v.id("skills"),
          _creationTime: v.number(),
          title: v.string(),
          description: v.string(),
          level: levelValidator,
          difficulty: v.number(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const role = await getUserRole(ctx, args.userRole);
    const isAdminMod = role === "admin" || role === "moderator";

    let submissions: Array<Doc<"user_submissions">>;

    if (isAdminMod) {
      // Admin/moderator can see all submissions
      if (args.status !== undefined) {
        submissions = await ctx.db
          .query("user_submissions")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .collect();
      } else {
        submissions = await ctx.db.query("user_submissions").collect();
      }
    } else {
      // Regular users can only see their own submissions
      if (args.status !== undefined) {
        submissions = await ctx.db
          .query("user_submissions")
          .withIndex("by_user_and_status", (q) =>
            q.eq("submittedBy", userId).eq("status", args.status!),
          )
          .collect();
      } else {
        submissions = await ctx.db
          .query("user_submissions")
          .withIndex("by_user", (q) => q.eq("submittedBy", userId))
          .collect();
      }
    }

    // Sort by submittedAt descending (newest first)
    submissions.sort((a, b) => b.submittedAt - a.submittedAt);

    // Enrich with muscle and equipment data
    const muscles = await ctx.db.query("muscles").collect();
    const equipment = await ctx.db.query("equipment").collect();

    const enrichedSubmissions = await Promise.all(
      submissions.map(async (submission) => {
        const enriched = {
          ...submission,
          musclesData: submission.muscles
            .map((id) => muscles.find((m) => m._id === id))
            .filter((m): m is Doc<"muscles"> => m !== undefined),
          equipmentData: submission.equipment
            .map((id) => equipment.find((e) => e._id === id))
            .filter((e): e is Doc<"equipment"> => e !== undefined),
        };

        // Fetch original skill data if it's an edit submission
        if (submission.originalSkillId) {
          const originalSkill = await ctx.db.get(submission.originalSkillId);
          return {
            ...enriched,
            originalSkillData: originalSkill
              ? {
                  _id: originalSkill._id,
                  _creationTime: originalSkill._creationTime,
                  title: originalSkill.title,
                  description: originalSkill.description,
                  level: originalSkill.level,
                  difficulty: originalSkill.difficulty,
                }
              : undefined,
          };
        }

        return enriched;
      }),
    );

    return enrichedSubmissions;
  },
});

// Get a single submission by ID (user can view own, admin/moderator can view any)
export const getSubmission = query({
  args: {
    id: v.id("user_submissions"),
    userRole: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      _id: v.id("user_submissions"),
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
          category: v.string(),
        }),
      ),
      originalSkillData: v.optional(
        v.object({
          _id: v.id("skills"),
          _creationTime: v.number(),
          title: v.string(),
          description: v.string(),
          level: levelValidator,
          difficulty: v.number(),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const submission = await ctx.db.get(args.id);
    if (!submission) {
      return null;
    }

    const role = await getUserRole(ctx, args.userRole);
    const isAdminMod = role === "admin" || role === "moderator";

    // Verify user owns this submission OR is admin/moderator
    if (submission.submittedBy !== userId && !isAdminMod) {
      throw new Error("Unauthorized: You can only view your own submissions");
    }

    // Enrich with muscle and equipment data
    const muscles = await ctx.db.query("muscles").collect();
    const equipment = await ctx.db.query("equipment").collect();

    const enriched = {
      ...submission,
      musclesData: submission.muscles
        .map((id) => muscles.find((m) => m._id === id))
        .filter((m): m is Doc<"muscles"> => m !== undefined),
      equipmentData: submission.equipment
        .map((id) => equipment.find((e) => e._id === id))
        .filter((e): e is Doc<"equipment"> => e !== undefined),
    };

    // Fetch original skill data if it's an edit submission
    let originalSkillData:
      | {
          _id: Id<"skills">;
          _creationTime: number;
          title: string;
          description: string;
          level: Doc<"skills">["level"];
          difficulty: number;
        }
      | undefined = undefined;

    if (submission.originalSkillId) {
      const originalSkill = await ctx.db.get(submission.originalSkillId);
      if (originalSkill) {
        originalSkillData = {
          _id: originalSkill._id,
          _creationTime: originalSkill._creationTime,
          title: originalSkill.title,
          description: originalSkill.description,
          level: originalSkill.level,
          difficulty: originalSkill.difficulty,
        };
      }
    }

    return {
      ...enriched,
      originalSkillData,
    };
  },
});

// Create a new submission
export const createSubmission = mutation({
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
    submissionType: v.union(v.literal("create"), v.literal("edit")),
    originalSkillId: v.optional(v.id("skills")),
    privateSkillId: v.optional(v.id("private_skills")),
  },
  returns: v.id("user_submissions"),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Validate difficulty
    validateDifficulty(args.difficulty);

    // Validate URLs
    validateUrlArray(args.embedded_videos);

    // Validate privateSkillId if provided
    if (args.privateSkillId) {
      const privateSkill = await ctx.db.get(args.privateSkillId);
      if (!privateSkill) {
        throw new Error(`Private skill not found: ${args.privateSkillId}`);
      }
      if (privateSkill.userId !== userId) {
        throw new Error(
          "Unauthorized: You can only suggest your own private skills",
        );
      }

      // Validate that all prerequisites and variants are public skills
      // Since args.prerequisites/variants are typed as Id<"skills">[], they should be public
      // We verify they exist in the public skills table
      for (const prereqId of args.prerequisites) {
        const prereq = await ctx.db.get(prereqId);
        if (!prereq) {
          throw new Error(`Prerequisite skill not found: ${prereqId}`);
        }
        // If we successfully got it from the skills table, it's a public skill
        // (Convex IDs are table-specific, so it can't be a private skill)
      }

      for (const variantId of args.variants) {
        const variant = await ctx.db.get(variantId);
        if (!variant) {
          throw new Error(`Variant skill not found: ${variantId}`);
        }
        // If we successfully got it from the skills table, it's a public skill
      }
    }

    // Validate submission type and originalSkillId
    if (args.submissionType === "edit") {
      if (!args.originalSkillId) {
        throw new Error("originalSkillId is required for edit submissions");
      }
      const originalSkill = await ctx.db.get(args.originalSkillId);
      if (!originalSkill) {
        throw new Error(`Original skill not found: ${args.originalSkillId}`);
      }
    } else {
      if (args.originalSkillId) {
        throw new Error(
          "originalSkillId should not be provided for create submissions",
        );
      }
    }

    // Validate that prerequisites and variants exist (if not already validated above)
    if (!args.privateSkillId) {
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
    const submissionId = await ctx.db.insert("user_submissions", {
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
      submissionType: args.submissionType,
      status: "pending",
      originalSkillId: args.originalSkillId,
      privateSkillId: args.privateSkillId,
      submittedBy: userId,
      submittedAt: now,
    });

    return submissionId;
  },
});

// Update a pending submission (only if user owns it and it's pending)
export const updateSubmission = mutation({
  args: {
    id: v.id("user_submissions"),
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
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const submission = await ctx.db.get(args.id);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Verify user owns this submission
    if (submission.submittedBy !== userId) {
      throw new Error("Unauthorized: You can only update your own submissions");
    }

    // Only allow updates if status is pending
    if (submission.status !== "pending") {
      throw new Error("You can only update pending submissions");
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
      level?: Doc<"user_submissions">["level"];
      difficulty?: number;
      muscles?: Id<"muscles">[];
      equipment?: Id<"equipment">[];
      embedded_videos?: string[];
      prerequisites?: Id<"skills">[];
      variants?: Id<"skills">[];
      tips?: string[];
    } = {};

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

// Approve a submission (admin/moderator only)
export const approveSubmission = mutation({
  args: {
    id: v.id("user_submissions"),
    userRole: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const role = await getUserRole(ctx, args.userRole);
    if (role !== "admin" && role !== "moderator") {
      throw new Error(
        "Unauthorized: Only admins and moderators can approve submissions",
      );
    }

    const submission = await ctx.db.get(args.id);
    if (!submission) {
      throw new Error("Submission not found");
    }

    if (submission.status !== "pending") {
      throw new Error("Only pending submissions can be approved");
    }

    const now = Date.now();

    // If this is a submission from a private skill, copy it to public skills table
    if (submission.privateSkillId) {
      const privateSkill = await ctx.db.get(submission.privateSkillId);
      if (!privateSkill) {
        throw new Error(
          `Private skill not found: ${submission.privateSkillId}`,
        );
      }

      // Create public skill from submission data
      await ctx.db.insert("skills", {
        title: submission.title,
        description: submission.description,
        level: submission.level,
        difficulty: submission.difficulty,
        muscles: submission.muscles,
        equipment: submission.equipment,
        embedded_videos: submission.embedded_videos,
        prerequisites: submission.prerequisites,
        variants: submission.variants,
        tips: submission.tips,
        createdAt: now,
        updatedAt: now,
        createdBy: submission.submittedBy,
      });

      // Delete the private skill
      await ctx.db.delete(submission.privateSkillId);
    } else if (submission.submissionType === "create") {
      // For regular create submissions, also create the skill in public table
      await ctx.db.insert("skills", {
        title: submission.title,
        description: submission.description,
        level: submission.level,
        difficulty: submission.difficulty,
        muscles: submission.muscles,
        equipment: submission.equipment,
        embedded_videos: submission.embedded_videos,
        prerequisites: submission.prerequisites,
        variants: submission.variants,
        tips: submission.tips,
        createdAt: now,
        updatedAt: now,
        createdBy: submission.submittedBy,
      });
    } else if (
      submission.submissionType === "edit" &&
      submission.originalSkillId
    ) {
      // For edit submissions, update the existing skill
      await ctx.db.patch(submission.originalSkillId, {
        title: submission.title,
        description: submission.description,
        level: submission.level,
        difficulty: submission.difficulty,
        muscles: submission.muscles,
        equipment: submission.equipment,
        embedded_videos: submission.embedded_videos,
        prerequisites: submission.prerequisites,
        variants: submission.variants,
        tips: submission.tips,
        updatedAt: now,
      });
    }

    // Mark submission as approved
    await ctx.db.patch(args.id, {
      status: "approved",
      reviewedBy: userId,
      reviewedAt: now,
    });

    return null;
  },
});

// Reject a submission (admin/moderator only)
export const rejectSubmission = mutation({
  args: {
    id: v.id("user_submissions"),
    rejectionReason: v.optional(v.string()),
    userRole: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const role = await getUserRole(ctx, args.userRole);
    if (role !== "admin" && role !== "moderator") {
      throw new Error(
        "Unauthorized: Only admins and moderators can reject submissions",
      );
    }

    const submission = await ctx.db.get(args.id);
    if (!submission) {
      throw new Error("Submission not found");
    }

    if (submission.status !== "pending") {
      throw new Error("Only pending submissions can be rejected");
    }

    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "rejected",
      reviewedBy: userId,
      reviewedAt: now,
      rejectionReason: args.rejectionReason,
    });

    return null;
  },
});

// Delete a submission (users can delete their own pending submissions)
export const deleteSubmission = mutation({
  args: {
    id: v.id("user_submissions"),
    userRole: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const submission = await ctx.db.get(args.id);
    if (!submission) {
      throw new Error("Submission not found");
    }

    const role = await getUserRole(ctx, args.userRole);
    const isAdminMod = role === "admin" || role === "moderator";

    // Verify user owns this submission
    if (submission.submittedBy !== userId && !isAdminMod) {
      throw new Error("Unauthorized: You can only delete your own submissions");
    }

    // Users can only delete pending submissions
    // Admin/moderator can delete any submission
    if (!isAdminMod && submission.status !== "pending") {
      throw new Error("You can only delete pending submissions");
    }

    await ctx.db.delete(args.id);
    return null;
  },
});

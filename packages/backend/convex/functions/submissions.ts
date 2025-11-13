import { Auth } from "convex/server";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import {
  exerciseCategoryValidator,
  exerciseLevelValidator,
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
      level: exerciseLevelValidator,
      difficulty: v.number(),
      category: exerciseCategoryValidator,
      muscles: v.array(v.id("muscles")),
      equipment: v.array(v.id("equipment")),
      embedded_videos: v.array(v.string()),
      prerequisites: v.array(
        v.union(v.id("exercises"), v.id("private_exercises")),
      ),
      tips: v.array(v.string()),
      submissionType: v.union(v.literal("create"), v.literal("edit")),
      status: v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
      ),
      originalExerciseId: v.optional(v.id("exercises")),
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
      originalExerciseData: v.optional(
        v.object({
          _id: v.union(v.id("exercises"), v.id("private_exercises")),
          _creationTime: v.number(),
          title: v.string(),
          description: v.string(),
          level: exerciseLevelValidator,
          difficulty: v.number(),
          category: exerciseCategoryValidator,
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

        // Fetch original exercise data if it's an edit submission
        if (submission.originalExerciseId) {
          const originalExercise = await ctx.db.get(
            submission.originalExerciseId,
          );
          return {
            ...enriched,
            originalExerciseData: originalExercise
              ? {
                  _id: originalExercise._id,
                  _creationTime: originalExercise._creationTime,
                  title: originalExercise.title,
                  description: originalExercise.description,
                  level: originalExercise.level,
                  difficulty: originalExercise.difficulty,
                  category: originalExercise.category,
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
      level: exerciseLevelValidator,
      difficulty: v.number(),
      category: exerciseCategoryValidator,
      muscles: v.array(v.id("muscles")),
      equipment: v.array(v.id("equipment")),
      embedded_videos: v.array(v.string()),
      prerequisites: v.array(
        v.union(v.id("exercises"), v.id("private_exercises")),
      ),
      tips: v.array(v.string()),
      submissionType: v.union(v.literal("create"), v.literal("edit")),
      status: v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
      ),
      originalExerciseId: v.optional(v.id("exercises")),
      privateExerciseId: v.optional(v.id("private_exercises")),
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
      originalExerciseData: v.optional(
        v.object({
          _id: v.union(v.id("exercises"), v.id("private_exercises")),
          _creationTime: v.number(),
          title: v.string(),
          description: v.string(),
          level: exerciseLevelValidator,
          difficulty: v.number(),
          category: exerciseCategoryValidator,
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

    // Fetch original exercise data if it's an edit submission
    let originalExerciseData:
      | {
          _id: Id<"exercises"> | Id<"private_exercises">;
          _creationTime: number;
          title: string;
          description: string;
          level: Doc<"exercises">["level"] | Doc<"private_exercises">["level"];
          difficulty: number;
          category:
            | Doc<"exercises">["category"]
            | Doc<"private_exercises">["category"];
        }
      | undefined = undefined;

    if (submission.originalExerciseId) {
      const originalExercise = await ctx.db.get(submission.originalExerciseId);
      if (originalExercise) {
        originalExerciseData = {
          _id: originalExercise._id,
          _creationTime: originalExercise._creationTime,
          title: originalExercise.title,
          description: originalExercise.description,
          level: originalExercise.level,
          difficulty: originalExercise.difficulty,
          category: originalExercise.category,
        };
      }
    }

    return {
      ...enriched,
      originalExerciseData,
    };
  },
});

// Create a new submission from a private exercise
export const createSubmission = mutation({
  args: {
    privateExerciseId: v.id("private_exercises"),
  },
  returns: v.id("user_submissions"),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Get the private exercise
    const privateExercise = await ctx.db.get(args.privateExerciseId);
    if (!privateExercise) {
      throw new Error(`Private exercise not found: ${args.privateExerciseId}`);
    }

    // Verify ownership
    if (privateExercise.createdBy !== userId) {
      throw new Error(
        "Unauthorized: You can only submit your own private exercises",
      );
    }

    // Check if there's already a pending submission for this exercise
    const existingSubmission = await ctx.db
      .query("user_submissions")
      .withIndex("by_user", (q) => q.eq("submittedBy", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("privateExerciseId"), args.privateExerciseId),
          q.eq(q.field("status"), "pending"),
        ),
      )
      .first();

    if (existingSubmission) {
      throw new Error(
        "A pending submission already exists for this exercise",
      );
    }

    // Get exercise variants to extract equipment, tips, and videos
    const variants = await ctx.db
      .query("exercise_variants")
      .withIndex("by_exercise", (q) => q.eq("exercise", args.privateExerciseId))
      .collect();

    // Collect all equipment IDs from variants
    const equipmentSet = new Set<Id<"equipment">>();
    const allTips: string[] = [];
    const allVideos: string[] = [];

    for (const variant of variants) {
      variant.equipment.forEach((eqId) => equipmentSet.add(eqId));
      if (variant.tips) {
        allTips.push(...variant.tips);
      }
      if (variant.embedded_videos) {
        allVideos.push(...variant.embedded_videos);
      }
      if (variant.tipsV2) {
        variant.tipsV2.forEach((tip) => {
          if (tip.text) allTips.push(tip.text);
          if (tip.videoUrl) allVideos.push(tip.videoUrl);
        });
      }
    }

    // Get muscle IDs from exercises_muscles table
    const muscleRelations = await ctx.db
      .query("exercises_muscles")
      .withIndex("by_exercise", (q) => q.eq("exercise", args.privateExerciseId))
      .collect();

    const muscleIds = muscleRelations.map((rel) => rel.muscle);

    // Validate that all prerequisites exist
    for (const prereqId of privateExercise.prerequisites) {
      const prereq = await ctx.db.get(prereqId);
      if (!prereq) {
        throw new Error(`Prerequisite exercise not found: ${prereqId}`);
      }
    }

    // Validate that all muscles exist
    for (const muscleId of muscleIds) {
      const muscle = await ctx.db.get(muscleId);
      if (!muscle) {
        throw new Error(`Muscle not found: ${muscleId}`);
      }
    }

    // Validate that all equipment exists
    for (const equipmentId of equipmentSet) {
      const equipment = await ctx.db.get(equipmentId);
      if (!equipment) {
        throw new Error(`Equipment not found: ${equipmentId}`);
      }
    }

    // Validate difficulty
    validateDifficulty(privateExercise.difficulty);

    // Validate URLs
    validateUrlArray(allVideos);

    const now = Date.now();
    const submissionId = await ctx.db.insert("user_submissions", {
      title: privateExercise.title,
      description: privateExercise.description,
      level: privateExercise.level,
      difficulty: privateExercise.difficulty,
      category: privateExercise.category,
      muscles: muscleIds,
      equipment: Array.from(equipmentSet),
      embedded_videos: allVideos,
      prerequisites: privateExercise.prerequisites,
      tips: allTips,
      submissionType: "create",
      status: "pending",
      privateExerciseId: args.privateExerciseId,
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
    level: v.optional(exerciseLevelValidator),
    difficulty: v.optional(v.number()),
    muscles: v.optional(v.array(v.id("muscles"))),
    equipment: v.optional(v.array(v.id("equipment"))),
    embedded_videos: v.optional(v.array(v.string())),
    category: v.optional(exerciseCategoryValidator),
    prerequisites: v.optional(
      v.array(v.union(v.id("exercises"), v.id("private_exercises"))),
    ),
    tips: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    return null;
    //   const userId = await getUserId(ctx);
    //   if (!userId) {
    //     throw new Error("User not authenticated");
    //   }

    //   const submission = await ctx.db.get(args.id);
    //   if (!submission) {
    //     throw new Error("Submission not found");
    //   }

    //   // Verify user owns this submission
    //   if (submission.submittedBy !== userId) {
    //     throw new Error("Unauthorized: You can only update your own submissions");
    //   }

    //   // Only allow updates if status is pending
    //   if (submission.status !== "pending") {
    //     throw new Error("You can only update pending submissions");
    //   }

    //   // Validate difficulty if provided
    //   if (args.difficulty !== undefined) {
    //     validateDifficulty(args.difficulty);
    //   }

    //   // Validate URLs if provided
    //   if (args.embedded_videos !== undefined) {
    //     validateUrlArray(args.embedded_videos);
    //   }

    //   // Validate that prerequisites exist if provided
    //   if (args.prerequisites !== undefined) {
    //     for (const prereqId of args.prerequisites) {
    //       const prereq = await ctx.db.get(prereqId);
    //       if (!prereq) {
    //         throw new Error(`Prerequisite skill not found: ${prereqId}`);
    //       }
    //     }
    //   }

    //   // Validate that variants exist if provided
    //   if (args.variants !== undefined) {
    //     for (const variantId of args.variants) {
    //       const variant = await ctx.db.get(variantId);
    //       if (!variant) {
    //         throw new Error(`Variant skill not found: ${variantId}`);
    //       }
    //     }
    //   }

    //   // Validate that muscles exist if provided
    //   if (args.muscles !== undefined) {
    //     for (const muscleId of args.muscles) {
    //       const muscle = await ctx.db.get(muscleId);
    //       if (!muscle) {
    //         throw new Error(`Muscle not found: ${muscleId}`);
    //       }
    //     }
    //   }

    //   // Validate that equipment exists if provided
    //   if (args.equipment !== undefined) {
    //     for (const equipmentId of args.equipment) {
    //       const equipment = await ctx.db.get(equipmentId);
    //       if (!equipment) {
    //         throw new Error(`Equipment not found: ${equipmentId}`);
    //       }
    //     }
    //   }

    //   // Build update object
    //   const updates: {
    //     title?: string;
    //     description?: string;
    //     level?: Doc<"user_submissions">["level"];
    //     difficulty?: number;
    //     muscles?: Id<"muscles">[];
    //     equipment?: Id<"equipment">[];
    //     embedded_videos?: string[];
    //     prerequisites?: Id<"skills">[];
    //     variants?: Id<"skills">[];
    //     tips?: string[];
    //   } = {};

    //   if (args.title !== undefined) updates.title = args.title;
    //   if (args.description !== undefined) updates.description = args.description;
    //   if (args.level !== undefined) updates.level = args.level;
    //   if (args.difficulty !== undefined) updates.difficulty = args.difficulty;
    //   if (args.muscles !== undefined) updates.muscles = args.muscles;
    //   if (args.equipment !== undefined) updates.equipment = args.equipment;
    //   if (args.embedded_videos !== undefined)
    //     updates.embedded_videos = args.embedded_videos;
    //   if (args.prerequisites !== undefined)
    //     updates.prerequisites = args.prerequisites;
    //   if (args.variants !== undefined) updates.variants = args.variants;
    //   if (args.tips !== undefined) updates.tips = args.tips;

    //   await ctx.db.patch(args.id, updates);
    //   return null;
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

    // If this is a submission from a private exercise, copy it to public exercises table
    if (submission.privateExerciseId) {
      const privateExercise = await ctx.db.get(submission.privateExerciseId);
      if (!privateExercise) {
        throw new Error(
          `Private exercise not found: ${submission.privateExerciseId}`,
        );
      }

      // Create public exercise from submission data
      const publicExerciseId = await ctx.db.insert("exercises", {
        title: submission.title,
        description: submission.description,
        level: submission.level,
        difficulty: submission.difficulty,
        category: submission.category,
        prerequisites: submission.prerequisites,
        createdAt: now,
        updatedAt: now,
        createdBy: submission.submittedBy,
      });

      // Copy exercise variants (equipment, tips, videos)
      const variants = await ctx.db
        .query("exercise_variants")
        .withIndex("by_exercise", (q) =>
          q.eq("exercise", submission.privateExerciseId!),
        )
        .collect();

      for (const variant of variants) {
        await ctx.db.insert("exercise_variants", {
          exercise: publicExerciseId,
          equipment: variant.equipment,
          tips: variant.tips || [],
          embedded_videos: variant.embedded_videos || [],
          tipsV2: variant.tipsV2,
          overriddenTitle: variant.overriddenTitle,
          overriddenDescription: variant.overriddenDescription,
          overriddenDifficulty: variant.overriddenDifficulty,
          overriddenMuscles: variant.overriddenMuscles,
          createdAt: variant.createdAt,
          updatedAt: now,
        });
      }

      // Copy muscle relationships
      const muscleRelations = await ctx.db
        .query("exercises_muscles")
        .withIndex("by_exercise", (q) =>
          q.eq("exercise", submission.privateExerciseId!),
        )
        .collect();

      for (const relation of muscleRelations) {
        await ctx.db.insert("exercises_muscles", {
          exercise: publicExerciseId,
          muscle: relation.muscle,
          role: relation.role,
        });
      }

      // Delete the private exercise (this will cascade delete variants and muscle relations)
      await ctx.db.delete(submission.privateExerciseId);
    } else if (submission.submissionType === "create") {
      // For regular create submissions, also create the exercise in public table
      await ctx.db.insert("exercises", {
        title: submission.title,
        description: submission.description,
        level: submission.level,
        difficulty: submission.difficulty,
        category: submission.category,
        prerequisites: submission.prerequisites,
        createdAt: now,
        updatedAt: now,
        createdBy: submission.submittedBy,
      });
    } else if (
      submission.submissionType === "edit" &&
      submission.originalExerciseId
    ) {
      // For edit submissions, update the existing exercise
      await ctx.db.patch(submission.originalExerciseId, {
        title: submission.title,
        description: submission.description,
        level: submission.level,
        difficulty: submission.difficulty,
        category: submission.category,
        prerequisites: submission.prerequisites,
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

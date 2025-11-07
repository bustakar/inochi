import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

/**
 * Migration: Add muscleGroup and expand muscles from parts
 * 
 * This migration:
 * 1. Adds muscleGroup field to existing muscles based on their slug
 * 2. Creates new muscle records for remaining parts (parts[1..n])
 * 3. Updates all skills/private_skills/user_submissions to include new muscle IDs
 * 
 * Run via: npx convex run migrations:addMuscleGroupAndExpandMuscles
 */
export const addMuscleGroupAndExpandMuscles = mutation({
  args: {},
  handler: async (ctx) => {
    const existingMuscles = await ctx.db.query("muscles").collect();
    
    // Map: old muscle ID -> array of all muscle IDs (existing + newly created)
    const muscleIdMapping = new Map<Id<"muscles">, Id<"muscles">[]>();
    const stats = {
      musclesUpdated: 0,
      musclesCreated: 0,
      skillsUpdated: 0,
      privateSkillsUpdated: 0,
      submissionsUpdated: 0,
    };
    
    // Map slugs to muscle groups based on seed data structure
    const slugToGroup: Record<string, string> = {
      // Top-level groups (these become muscleGroup for parts)
      chest: "chest",
      back: "back",
      shoulders: "shoulders",
      biceps: "biceps",
      triceps: "triceps",
      forearms: "forearms",
      core: "core",
      glutes: "glutes",
      quadriceps: "quadriceps",
      hamstrings: "hamstrings",
      calves: "calves",
      // Chest parts
      upper_chest: "chest",
      middle_chest: "chest",
      lower_chest: "chest",
      // Back parts
      lats: "back",
      rhomboids: "back",
      trapezius: "back",
      erector_spinae: "back",
      // Shoulders parts
      front_deltoid: "shoulders",
      side_deltoid: "shoulders",
      rear_deltoid: "shoulders",
      // Biceps parts
      biceps_long_head: "biceps",
      biceps_short_head: "biceps",
      // Triceps parts
      triceps_long_head: "triceps",
      triceps_lateral_head: "triceps",
      triceps_medial_head: "triceps",
      // Forearms parts
      brachioradialis: "forearms",
      forearm_flexors: "forearms",
      forearm_extensors: "forearms",
      // Core parts
      rectus_abdominis: "core",
      obliques: "core",
      transverse_abdominis: "core",
      lower_back: "core",
      // Glutes parts
      gluteus_maximus: "glutes",
      gluteus_medius: "glutes",
      gluteus_minimus: "glutes",
      // Quadriceps parts
      rectus_femoris: "quadriceps",
      vastus_lateralis: "quadriceps",
      vastus_medialis: "quadriceps",
      vastus_intermedius: "quadriceps",
      // Hamstrings parts
      biceps_femoris: "hamstrings",
      semitendinosus: "hamstrings",
      semimembranosus: "hamstrings",
      // Calves parts
      gastrocnemius: "calves",
      soleus: "calves",
      tibialis_anterior: "calves",
    };
    
    // Step 1: Process each existing muscle
    for (const muscle of existingMuscles) {
      const allMuscleIds: Id<"muscles">[] = [];
      
      // Determine muscleGroup
      const muscleGroup = slugToGroup[muscle.slug] || muscle.slug;
      
      // Add muscleGroup to existing muscle (keep parts for now)
      await ctx.db.patch(muscle._id, {
        muscleGroup: muscleGroup,
      });
      allMuscleIds.push(muscle._id);
      stats.musclesUpdated++;
      
      // If muscle has parts, create new muscles for remaining parts (skip first one)
      if (muscle.parts && muscle.parts.length > 0) {
        // Check if parts already exist as separate muscles (by slug)
        for (let i = 1; i < muscle.parts.length; i++) {
          const part = muscle.parts[i];
          if (!part) continue;
          
          // Check if a muscle with this slug already exists
          const existingPartMuscle = await ctx.db
            .query("muscles")
            .withIndex("by_slug", (q) => q.eq("slug", part.slug))
            .first();
          
          if (!existingPartMuscle) {
            // Create new muscle for this part
            const newMuscleId = await ctx.db.insert("muscles", {
              name: part.name,
              slug: part.slug,
              recommendedRestHours: muscle.recommendedRestHours,
              muscleGroup: muscleGroup,
              parts: [], // Empty parts array
            });
            allMuscleIds.push(newMuscleId);
            stats.musclesCreated++;
          } else {
            // Part already exists, add to mapping
            allMuscleIds.push(existingPartMuscle._id);
          }
        }
      }
      
      muscleIdMapping.set(muscle._id, allMuscleIds);
    }
    
    // Step 2: Update all skills
    const skills = await ctx.db.query("skills").collect();
    for (const skill of skills) {
      const newMuscleIds: Id<"muscles">[] = [];
      let updated = false;
      
      for (const oldMuscleId of skill.muscles) {
        const mappedIds = muscleIdMapping.get(oldMuscleId);
        if (mappedIds && mappedIds.length > 1) {
          // Add all mapped IDs (including the original and new ones)
          newMuscleIds.push(...mappedIds);
          updated = true;
        } else {
          // No expansion needed, keep original
          newMuscleIds.push(oldMuscleId);
        }
      }
      
      if (updated) {
        // Remove duplicates and update
        const uniqueMuscleIds = Array.from(new Set(newMuscleIds)) as Id<"muscles">[];
        await ctx.db.patch(skill._id, {
          muscles: uniqueMuscleIds,
        });
        stats.skillsUpdated++;
      }
    }
    
    // Step 3: Update all private_skills
    const privateSkills = await ctx.db.query("private_skills").collect();
    for (const skill of privateSkills) {
      const newMuscleIds: Id<"muscles">[] = [];
      let updated = false;
      
      for (const oldMuscleId of skill.muscles) {
        const mappedIds = muscleIdMapping.get(oldMuscleId);
        if (mappedIds && mappedIds.length > 1) {
          newMuscleIds.push(...mappedIds);
          updated = true;
        } else {
          newMuscleIds.push(oldMuscleId);
        }
      }
      
      if (updated) {
        const uniqueMuscleIds = Array.from(new Set(newMuscleIds)) as Id<"muscles">[];
        await ctx.db.patch(skill._id, {
          muscles: uniqueMuscleIds,
        });
        stats.privateSkillsUpdated++;
      }
    }
    
    // Step 4: Update all user_submissions
    const submissions = await ctx.db.query("user_submissions").collect();
    for (const submission of submissions) {
      const newMuscleIds: Id<"muscles">[] = [];
      let updated = false;
      
      for (const oldMuscleId of submission.muscles) {
        const mappedIds = muscleIdMapping.get(oldMuscleId);
        if (mappedIds && mappedIds.length > 1) {
          newMuscleIds.push(...mappedIds);
          updated = true;
        } else {
          newMuscleIds.push(oldMuscleId);
        }
      }
      
      if (updated) {
        const uniqueMuscleIds = Array.from(new Set(newMuscleIds)) as Id<"muscles">[];
        await ctx.db.patch(submission._id, {
          muscles: uniqueMuscleIds,
        });
        stats.submissionsUpdated++;
      }
    }
    
    return {
      success: true,
      ...stats,
    };
  },
});


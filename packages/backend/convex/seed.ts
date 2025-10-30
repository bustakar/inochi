import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Seed muscles - main muscle groups for calisthenics
const MUSCLES = [
  // Upper Body - Push
  { name: "Chest", category: "upper_body_push" },
  { name: "Front Deltoids", category: "upper_body_push" },
  { name: "Triceps", category: "upper_body_push" },
  { name: "Side Deltoids", category: "upper_body_push" },

  // Upper Body - Pull
  { name: "Back", category: "upper_body_pull" },
  { name: "Lats", category: "upper_body_pull" },
  { name: "Rhomboids", category: "upper_body_pull" },
  { name: "Rear Deltoids", category: "upper_body_pull" },
  { name: "Biceps", category: "upper_body_pull" },
  { name: "Forearms", category: "upper_body_pull" },

  // Core
  { name: "Abs", category: "core" },
  { name: "Obliques", category: "core" },
  { name: "Lower Back", category: "core" },
  { name: "Transverse Abdominis", category: "core" },

  // Lower Body
  { name: "Quadriceps", category: "lower_body" },
  { name: "Hamstrings", category: "lower_body" },
  { name: "Glutes", category: "lower_body" },
  { name: "Calves", category: "lower_body" },
  { name: "Hip Flexors", category: "lower_body" },
];

// Seed equipment - categorized by sport/activity type
const EQUIPMENT = [
  // Calisthenics Equipment
  { name: "None (Bodyweight)", category: "calisthenics" },
  { name: "Pull-up Bar", category: "calisthenics" },
  { name: "Dip Bars", category: "calisthenics" },
  { name: "Parallettes", category: "calisthenics" },
  { name: "Weighted Vest", category: "calisthenics" },
  { name: "Resistance Bands", category: "calisthenics" },
  { name: "Hanging Leg Raise Station", category: "calisthenics" },

  // Gymnastics Equipment
  { name: "Gymnastic Rings", category: "gymnastics" },
  { name: "Handstand Blocks", category: "gymnastics" },
  { name: "Wall Bars", category: "gymnastics" },
  { name: "Parallel Bars", category: "gymnastics" },
  { name: "Pommel Horse", category: "gymnastics" },

  // Gym Equipment
  { name: "Barbell", category: "gym" },
  { name: "Dumbbells", category: "gym" },
  { name: "Kettlebells", category: "gym" },
  { name: "Cable Machine", category: "gym" },
  { name: "Smith Machine", category: "gym" },

  // Other Sports/Fitness
  { name: "TRX Straps", category: "functional" },
  { name: "Box/Platform", category: "functional" },
  { name: "Climbing Rope", category: "functional" },
  { name: "Sandbag", category: "functional" },
];

export const seedMusclesAndEquipment = mutation({
  args: {},
  returns: v.union(
    v.object({
      message: v.string(),
      skipped: v.literal(true),
    }),
    v.object({
      message: v.string(),
      musclesCount: v.number(),
      equipmentCount: v.number(),
    }),
  ),
  handler: async (ctx) => {
    // Check if already seeded
    const existingMuscles = await ctx.db.query("muscles").first();
    const existingEquipment = await ctx.db.query("equipment").first();

    if (existingMuscles || existingEquipment) {
      return { message: "Data already seeded", skipped: true as const };
    }

    // Insert muscles
    const muscleIds = [];
    for (const muscle of MUSCLES) {
      const id = await ctx.db.insert("muscles", muscle);
      muscleIds.push(id);
    }

    // Insert equipment
    const equipmentIds = [];
    for (const equip of EQUIPMENT) {
      const id = await ctx.db.insert("equipment", equip);
      equipmentIds.push(id);
    }

    return {
      message: "Successfully seeded muscles and equipment",
      musclesCount: muscleIds.length,
      equipmentCount: equipmentIds.length,
    };
  },
});

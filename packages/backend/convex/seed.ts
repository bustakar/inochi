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

// Seed equipment - calisthenics equipment
const EQUIPMENT = [
  // Basic Equipment
  { name: "None (Bodyweight)", category: "basic" },
  { name: "Pull-up Bar", category: "basic" },
  { name: "Parallettes", category: "basic" },
  { name: "Rings", category: "basic" },
  { name: "Dip Bars", category: "basic" },
  
  // Advanced Equipment
  { name: "Weighted Vest", category: "advanced" },
  { name: "Resistance Bands", category: "advanced" },
  { name: "Gymnastic Rings", category: "advanced" },
  { name: "Wall Bars", category: "advanced" },
  { name: "TRX Straps", category: "advanced" },
  
  // Specialty Equipment
  { name: "Box/Platform", category: "specialty" },
  { name: "Handstand Blocks", category: "specialty" },
  { name: "Climbing Rope", category: "specialty" },
  { name: "Hanging Leg Raise Station", category: "specialty" },
];

export const seedMusclesAndEquipment = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingMuscles = await ctx.db.query("muscles").first();
    const existingEquipment = await ctx.db.query("equipment").first();
    
    if (existingMuscles || existingEquipment) {
      return { message: "Data already seeded", skipped: true };
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


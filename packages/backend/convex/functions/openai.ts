import { v } from "convex/values";
import OpenAI from "openai";
import { internal } from "../_generated/api";
import { action, query } from "../_generated/server";
import { missingEnvVariableUrl } from "../utils";
import { exerciseLevelValidator } from "../validators/validators";

export const openaiKeySet = query({
  args: {},
  handler: async () => {
    return !!process.env.OPENROUTER_API_KEY;
  },
});

// Generate skill data using AI
export const generateSkillData = action({
  args: {
    skillName: v.string(),
  },
  returns: v.object({
    description: v.string(),
    level: exerciseLevelValidator,
    difficulty: v.number(),
    tips: v.array(v.string()),
    muscles: v.array(v.id("muscles")),
    equipment: v.array(v.id("equipment")),
    prerequisites: v.array(v.union(v.id("skills"), v.id("private_skills"))),
    variants: v.array(v.union(v.id("skills"), v.id("private_skills"))),
  }),
  handler: async (ctx, { skillName }) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error(
        missingEnvVariableUrl(
          "OPENROUTER_API_KEY",
          "https://openrouter.ai/keys",
        ),
      );
    }

    // Get user ID for private skills
    const userId = (await ctx.auth.getUserIdentity())?.subject;

    // Fetch all available options from database
    const muscles = await ctx.runQuery(
      internal.functions.skills.getAllMusclesForAI,
    );
    const equipment = await ctx.runQuery(
      internal.functions.skills.getAllEquipmentForAI,
    );
    const publicSkills = await ctx.runQuery(
      internal.functions.skills.getAllSkillsForAI,
    );

    // Fetch user's private skills if authenticated
    const privateSkills = userId
      ? await ctx.runQuery(internal.functions.skills.getPrivateSkillsForAI, {
          userId,
        })
      : [];

    // Combine public and private skills
    const skills = [...publicSkills, ...privateSkills];

    const musclesList = muscles.map((m) => m.name).join(", ");
    const equipmentList = equipment.map((e) => e.name).join(", ");
    const skillsList = skills
      .map(
        (s) => `${s.title} (level: ${s.level}, difficulty: ${s.difficulty}/10)`,
      )
      .join(", ");

    const prompt = `You are an expert fitness and calisthenics coach. Generate comprehensive data for a skill called "${skillName}".

Available muscles (use exact names): ${musclesList}
Available equipment (use exact names): ${equipmentList}
Available skills for prerequisites/variants (use exact titles with level and difficulty shown): ${skillsList}

Return a JSON object with this exact structure:
{
  "description": "A detailed description of the skill (maximum 100 characters)",
  "level": "beginner" | "intermediate" | "advanced" | "expert" | "elite",
  "difficulty": number between 1-10,
  "tips": ["tip 1", "tip 2", "tip 3"],
  "muscles": ["exact muscle name 1", "exact muscle name 2"],
  "equipment": ["exact equipment name 1"] or [],
  "prerequisites": ["exact skill title 1", "exact skill title 2"] or [],
  "variants": ["exact skill title 1"] or []
}

Important:
- Description must be maximum 100 characters
- Use EXACT names/titles from the lists above (without the level/difficulty info in parentheses)
- If a muscle/equipment/skill doesn't exist in the lists, don't include it
- Prerequisites should be skills that are easier or foundational to this skill (choose skills with lower difficulty/level)
- Variants should be similar or related skills (can be similar difficulty or level)
- Consider the difficulty and level of existing skills when determining appropriate prerequisites
- Tips should be practical and actionable`;

    // Initialize OpenRouter client
    const openai = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://inochi.app",
        "X-Title": "Inochi Skill Generator",
      },
    });

    const output = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant designed to output JSON. Always return valid JSON matching the exact structure requested.",
        },
        { role: "user", content: prompt },
      ],
      model: "google/gemini-2.0-flash-exp:free",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const messageContent = output.choices[0]?.message.content;
    if (!messageContent) {
      throw new Error("No response from AI");
    }

    const aiData = JSON.parse(messageContent);

    // Match names to IDs (case-insensitive)
    const matchedMuscles =
      aiData.muscles
        ?.map((name: string) =>
          muscles.find((m) => m.name.toLowerCase() === name.toLowerCase()),
        )
        .filter(
          (
            m: { _id: string; name: string } | undefined,
          ): m is {
            _id: string;
            name: string;
          } => m !== undefined,
        )
        .map((m: { _id: string; name: string }) => m._id) || [];

    const matchedEquipment =
      aiData.equipment
        ?.map((name: string) =>
          equipment.find((e) => e.name.toLowerCase() === name.toLowerCase()),
        )
        .filter(
          (
            e: { _id: string; name: string } | undefined,
          ): e is {
            _id: string;
            name: string;
          } => e !== undefined,
        )
        .map((e: { _id: string; name: string }) => e._id) || [];

    const matchedPrerequisites =
      aiData.prerequisites
        ?.map((title: string) =>
          skills.find((s) => s.title.toLowerCase() === title.toLowerCase()),
        )
        .filter(
          (
            s:
              | {
                  _id: string;
                  title: string;
                  isPrivate: boolean;
                }
              | undefined,
          ): s is {
            _id: string;
            title: string;
            isPrivate: boolean;
          } => s !== undefined,
        )
        .map((s: { _id: string }) => s._id) || [];

    const matchedVariants =
      aiData.variants
        ?.map((title: string) =>
          skills.find((s) => s.title.toLowerCase() === title.toLowerCase()),
        )
        .filter(
          (
            s:
              | {
                  _id: string;
                  title: string;
                  isPrivate: boolean;
                }
              | undefined,
          ): s is {
            _id: string;
            title: string;
            isPrivate: boolean;
          } => s !== undefined,
        )
        .map((s: { _id: string }) => s._id) || [];

    return {
      description: aiData.description || "",
      level: aiData.level || "beginner",
      difficulty: aiData.difficulty || 1,
      tips: aiData.tips || [],
      muscles: matchedMuscles,
      equipment: matchedEquipment,
      prerequisites: matchedPrerequisites,
      variants: matchedVariants,
    };
  },
});

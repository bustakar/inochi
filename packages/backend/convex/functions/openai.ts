import { v } from "convex/values";
import OpenAI from "openai";
import { internal } from "../_generated/api";
import { action, query } from "../_generated/server";
import { env } from "../env";
import { missingEnvVariableUrl } from "../utils";
import {
  exerciseLevelValidator,
  muscleRoleValidator,
} from "../validators/validators";

export const openaiKeySet = query({
  args: {},
  handler: async () => {
    return !!env.OPENROUTER_API_KEY;
  },
});

// Generate exercise data using AI
export const generateExerciseData = action({
  args: {
    exerciseName: v.string(),
  },
  returns: v.object({
    description: v.string(),
    level: exerciseLevelValidator,
    difficulty: v.number(),
    muscles: v.array(
      v.object({
        muscleId: v.id("muscles"),
        role: muscleRoleValidator,
      }),
    ),
    prerequisites: v.array(v.id("exercises")),
  }),
  handler: async (ctx, { exerciseName }) => {
    const apiKey = env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error(
        missingEnvVariableUrl(
          "OPENROUTER_API_KEY",
          "https://openrouter.ai/keys",
        ),
      );
    }

    // Fetch all available options from database
    const muscles = await ctx.runQuery(
      internal.functions.exercises.getAllMusclesForAI,
    );
    const exercises = await ctx.runQuery(
      internal.functions.exercises.getAllExercisesForAI,
    );

    const musclesList = muscles.map((m: { name: string }) => m.name).join(", ");
    const exercisesList = exercises
      .map(
        (e) => `${e.title} (level: ${e.level}, difficulty: ${e.difficulty}/10)`,
      )
      .join(", ");

    const prompt = `You are an expert fitness and calisthenics coach. Generate comprehensive data for an exercise called "${exerciseName}".

Available muscles (use exact names): ${musclesList}
Available exercises for prerequisites (use exact titles with level and difficulty shown): ${exercisesList}

Return a JSON object with this exact structure:
{
  "description": "A detailed description of the exercise (maximum 200 characters)",
  "level": "beginner" | "intermediate" | "advanced" | "expert" | "elite",
  "difficulty": number between 1-10,
  "muscles": [
    {"muscleName": "exact muscle name 1", "role": "primary"},
    {"muscleName": "exact muscle name 2", "role": "secondary"}
  ],
  "prerequisites": ["exact exercise title 1", "exact exercise title 2"] or []
}

Important:
- Description must be maximum 200 characters
- Use EXACT names/titles from the lists above (without the level/difficulty info in parentheses)
- If a muscle/exercise doesn't exist in the lists, don't include it
- For muscles, assign roles: "primary" for main muscles used, "secondary" for supporting muscles, "tertiary" for minor muscles, "stabilizer" for stabilizing muscles
- Typically, 1-3 muscles should be "primary", others should be "secondary", "tertiary", or "stabilizer"
- Prerequisites should be exercises that are easier or foundational to this exercise (choose exercises with lower difficulty/level)
- Consider the difficulty and level of existing exercises when determining appropriate prerequisites`;

    // Initialize OpenRouter client
    const openai = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://inochi.app",
        "X-Title": "Inochi Exercise Generator",
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
      model: "google/gemini-2.0-flash-lite-001",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const messageContent = output.choices[0]?.message.content;
    if (!messageContent) {
      throw new Error("No response from AI");
    }

    const aiData = JSON.parse(messageContent);

    // Match names to IDs with roles (case-insensitive)
    const matchedMuscles =
      aiData.muscles
        ?.map((muscleData: { muscleName: string; role: string }) => {
          const muscle = muscles.find(
            (m: { name: string }) =>
              m.name.toLowerCase() === muscleData.muscleName.toLowerCase(),
          );
          if (!muscle) return null;

          // Validate and normalize role
          const validRoles = ["primary", "secondary", "tertiary", "stabilizer"];
          const role = validRoles.includes(muscleData.role?.toLowerCase())
            ? (muscleData.role.toLowerCase() as
                | "primary"
                | "secondary"
                | "tertiary"
                | "stabilizer")
            : "primary"; // Default to primary if invalid role

          return {
            muscleId: muscle._id,
            role,
          };
        })
        .filter(
          (
            m: { muscleId: string; role: string } | null,
          ): m is {
            muscleId: string;
            role: "primary" | "secondary" | "tertiary" | "stabilizer";
          } => m !== null,
        ) || [];

    const matchedPrerequisites =
      aiData.prerequisites
        ?.map((title: string) =>
          exercises.find((e) => e.title.toLowerCase() === title.toLowerCase()),
        )
        .filter(
          (
            e:
              | {
                  _id: string;
                  title: string;
                  isPrivate: boolean;
                }
              | undefined,
          ): e is {
            _id: string;
            title: string;
            isPrivate: boolean;
          } => e !== undefined,
        )
        .map((e: { _id: string }) => e._id) || [];

    return {
      description: aiData.description || "",
      level: aiData.level || "beginner",
      difficulty: aiData.difficulty || 1,
      muscles: matchedMuscles.map(
        (m: {
          muscleId: string;
          role: "primary" | "secondary" | "tertiary" | "stabilizer";
        }) => ({
          muscleId: m.muscleId,
          role: m.role,
        }),
      ),
      prerequisites: matchedPrerequisites,
    };
  },
});

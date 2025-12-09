import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import type { ExerciseLevel, ProgressStatus } from "../validators/validators";
import { getUserId } from "./auth";

// Point system for exercise levels
const LEVEL_POINTS: Record<ExerciseLevel, number> = {
  beginner: 100,
  intermediate: 200,
  advanced: 500,
  expert: 1000,
  elite: 5000,
  legendary: 10000,
};

// Status multipliers
const STATUS_MULTIPLIERS: Record<ProgressStatus, number> = {
  novice: 0.1,
  apprentice: 0.25,
  journeyman: 0.5,
  master: 1.0,
};

// Muscle group mappings for spider graph
const PUSH_MUSCLES = ["chest", "triceps", "shoulders"];
const PULL_MUSCLES = ["back", "biceps"];
const CORE_MUSCLES = ["core"];
const LEGS_MUSCLES = ["legs"];

interface ExerciseWithProgress {
  _id: Id<"exercises">;
  title: string;
  level: ExerciseLevel;
  difficulty: number;
  muscleGroups: string[];
  status: ProgressStatus;
  weightedPoints: number;
  weightedDifficulty: number;
}

function calculatePowerLevel(exercises: ExerciseWithProgress[]): number {
  return Math.round(exercises.reduce((sum, ex) => sum + ex.weightedPoints, 0));
}

function calculateLevel(xp: number): {
  level: number;
  currentXP: number;
  xpForNextLevel: number;
  xpProgress: number;
} {
  const calculatedLevel = Math.floor(Math.sqrt(xp / 100));
  const level = Math.max(1, calculatedLevel);
  const xpForCurrentLevel = level * level * 100;
  const xpForNextLevel = (level + 1) * (level + 1) * 100;
  const xpProgress =
    xpForNextLevel > xpForCurrentLevel
      ? ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100
      : 0;
  return {
    level,
    currentXP: xp,
    xpForNextLevel,
    xpProgress: Math.max(0, Math.min(100, xpProgress)),
  };
}

function calculateSpiderStats(exercises: ExerciseWithProgress[]): {
  push: number;
  pull: number;
  core: number;
  legs: number;
} {
  const pushExercises: number[] = [];
  const pullExercises: number[] = [];
  const coreExercises: number[] = [];
  const legsExercises: number[] = [];

  for (const ex of exercises) {
    const hasPush = ex.muscleGroups.some((mg) => PUSH_MUSCLES.includes(mg));
    const hasPull = ex.muscleGroups.some((mg) => PULL_MUSCLES.includes(mg));
    const hasCore = ex.muscleGroups.some((mg) => CORE_MUSCLES.includes(mg));
    const hasLegs = ex.muscleGroups.some((mg) => LEGS_MUSCLES.includes(mg));

    if (hasPush) pushExercises.push(ex.weightedDifficulty);
    if (hasPull) pullExercises.push(ex.weightedDifficulty);
    if (hasCore) coreExercises.push(ex.weightedDifficulty);
    if (hasLegs) legsExercises.push(ex.weightedDifficulty);
  }

  const average = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return {
    push: average(pushExercises),
    pull: average(pullExercises),
    core: average(coreExercises),
    legs: average(legsExercises),
  };
}

const ARCHETYPE_DEFINITIONS: Record<
  string,
  { slug: string; title: string; description: string }
> = {
  "hand-balancer": {
    slug: "hand-balancer",
    title: "Hand Balancer",
    description: "Master of balance and upper body strength",
  },
  "bar-warrior": {
    slug: "bar-warrior",
    title: "Bar Warrior",
    description: "Dominant in pulling movements and core stability",
  },
  "ring-master": {
    slug: "ring-master",
    title: "Ring Master",
    description: "Elite in advanced pulling and skill movements",
  },
  gymnast: {
    slug: "gymnast",
    title: "Gymnast",
    description: "Powerful legs and exceptional core control",
  },
  "street-athlete": {
    slug: "street-athlete",
    title: "Street Athlete",
    description: "Well-rounded athlete with balanced attributes",
  },
  "the-t-rex": {
    slug: "the-t-rex",
    title: "The T-Rex",
    description: "Legs of steel, tiny arms (just kidding!)",
  },
  "push-specialist": {
    slug: "push-specialist",
    title: "Push Specialist",
    description: "Specialized in pushing movements",
  },
  "pull-specialist": {
    slug: "pull-specialist",
    title: "Pull Specialist",
    description: "Specialized in pulling movements",
  },
  "core-specialist": {
    slug: "core-specialist",
    title: "Core Specialist",
    description: "Specialized in core strength",
  },
  "leg-specialist": {
    slug: "leg-specialist",
    title: "Leg Specialist",
    description: "Specialized in leg strength",
  },
  "skill-specialist": {
    slug: "skill-specialist",
    title: "Skill Specialist",
    description: "Specialized in skill-based movements",
  },
  beginner: {
    slug: "beginner",
    title: "Beginner",
    description: "Starting your fitness journey",
  },
};

function determineArchetype(stats: {
  push: number;
  pull: number;
  core: number;
  legs: number;
}): { slug: string; title: string; description: string } {
  const { push, pull, core, legs } = stats;

  // Find max stat
  const maxStat = Math.max(push, pull, core, legs);
  const threshold = maxStat * 0.8; // 80% of max to be considered "high"

  // Check for balanced stats (all within 20% of each other)
  const statsArray = [push, pull, core, legs];
  const minStat = Math.min(...statsArray);
  const isBalanced = maxStat - minStat < maxStat * 0.3;

  // Easter egg: Only legs dominant
  if (legs > threshold && legs > push * 1.5 && legs > pull * 1.5) {
    return ARCHETYPE_DEFINITIONS["the-t-rex"]!;
  }

  // High Push + High Core (hand balancing requires both)
  if (push >= threshold && core >= threshold) {
    return ARCHETYPE_DEFINITIONS["hand-balancer"]!;
  }

  // High Pull + High Core
  if (pull >= threshold && core >= threshold) {
    return ARCHETYPE_DEFINITIONS["bar-warrior"]!;
  }

  // High Pull + High Push (ring mastery requires both)
  if (pull >= threshold && push >= threshold) {
    return ARCHETYPE_DEFINITIONS["ring-master"]!;
  }

  // High Legs + High Core
  if (legs >= threshold && core >= threshold) {
    return ARCHETYPE_DEFINITIONS["gymnast"]!;
  }

  // Balanced stats
  if (isBalanced) {
    return ARCHETYPE_DEFINITIONS["street-athlete"]!;
  }

  // Default fallback based on highest stat
  if (push === maxStat) return ARCHETYPE_DEFINITIONS["push-specialist"]!;
  if (pull === maxStat) return ARCHETYPE_DEFINITIONS["pull-specialist"]!;
  if (core === maxStat) return ARCHETYPE_DEFINITIONS["core-specialist"]!;
  if (legs === maxStat) return ARCHETYPE_DEFINITIONS["leg-specialist"]!;
  return ARCHETYPE_DEFINITIONS["street-athlete"]!;
}

export const getUserProfileStats = query({
  args: {},
  returns: v.object({
    powerLevel: v.number(),
    level: v.number(),
    currentXP: v.number(),
    xpForNextLevel: v.number(),
    xpProgress: v.number(),
    spiderStats: v.object({
      push: v.number(),
      pull: v.number(),
      core: v.number(),
      legs: v.number(),
    }),
    archetype: v.object({
      slug: v.string(),
      title: v.string(),
      description: v.string(),
    }),
    trophyCase: v.array(
      v.object({
        _id: v.id("exercises"),
        title: v.string(),
        level: v.string(),
        difficulty: v.number(),
        status: v.string(),
      }),
    ),
  }),
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Fetch user's exercise progress
    const userProgress = await ctx.db
      .query("user_exercise_progress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (userProgress.length === 0) {
      const levelData = calculateLevel(0);
      return {
        powerLevel: 0,
        level: levelData.level,
        currentXP: levelData.currentXP,
        xpForNextLevel: levelData.xpForNextLevel,
        xpProgress: levelData.xpProgress,
        spiderStats: {
          push: 0,
          pull: 0,
          core: 0,
          legs: 0,
        },
        archetype: ARCHETYPE_DEFINITIONS["beginner"]!,
        trophyCase: [],
      };
    }

    // Fetch all exercises and muscle relations
    const exercises = await ctx.db.query("exercises").collect();
    const muscleRelations = await ctx.db.query("exercises_muscles").collect();
    const muscles = await ctx.db.query("muscles").collect();

    // Create muscle slug to muscle group map
    const muscleGroupMap = new Map<string, string>();
    for (const muscle of muscles) {
      if (muscle.muscleGroup) {
        muscleGroupMap.set(muscle.slug, muscle.muscleGroup);
      }
    }

    // Create exercise to muscle groups map
    const exerciseMuscleGroupsMap = new Map<Id<"exercises">, string[]>();
    for (const rel of muscleRelations) {
      const muscleGroup = muscleGroupMap.get(rel.muscle);
      if (muscleGroup) {
        const existing = exerciseMuscleGroupsMap.get(rel.exercise) || [];
        if (!existing.includes(muscleGroup)) {
          existing.push(muscleGroup);
          exerciseMuscleGroupsMap.set(rel.exercise, existing);
        }
      }
    }

    // Create exercise map for quick lookup
    const exerciseMap = new Map<Id<"exercises">, Doc<"exercises">>();
    for (const exercise of exercises) {
      exerciseMap.set(exercise._id, exercise);
    }

    // Process exercises with progress
    const exercisesWithProgress: ExerciseWithProgress[] = [];

    for (const progress of userProgress) {
      const exercise = exerciseMap.get(progress.exerciseId);
      if (!exercise) continue;

      const levelPoints = LEVEL_POINTS[exercise.level];
      const statusMultiplier = STATUS_MULTIPLIERS[progress.status];
      const weightedPoints = levelPoints * statusMultiplier;
      const weightedDifficulty = exercise.difficulty * statusMultiplier;

      const muscleGroups = exerciseMuscleGroupsMap.get(exercise._id) || [];

      exercisesWithProgress.push({
        _id: exercise._id,
        title: exercise.title,
        level: exercise.level,
        difficulty: exercise.difficulty,
        muscleGroups,
        status: progress.status,
        weightedPoints,
        weightedDifficulty,
      });
    }

    // Calculate power level (XP) from all exercises with progress
    // This is the total XP the user has earned
    const powerLevel = calculatePowerLevel(exercisesWithProgress);

    // Calculate level from XP (powerLevel is the total XP earned)
    const levelData = calculateLevel(powerLevel);

    // Calculate spider stats
    const spiderStats = calculateSpiderStats(exercisesWithProgress);

    // Determine archetype
    const archetype = determineArchetype(spiderStats);

    // Get top 3 hardest mastered exercises (master or journeyman only)
    const masteredExercises = exercisesWithProgress
      .filter((ex) => ex.status === "master" || ex.status === "journeyman")
      .sort((a, b) => {
        // Sort by difficulty first, then by level points
        if (b.difficulty !== a.difficulty) {
          return b.difficulty - a.difficulty;
        }
        return LEVEL_POINTS[b.level] - LEVEL_POINTS[a.level];
      })
      .slice(0, 3)
      .map((ex) => ({
        _id: ex._id,
        title: ex.title,
        level: ex.level,
        difficulty: ex.difficulty,
        status: ex.status,
      }));

    return {
      powerLevel,
      level: levelData.level,
      currentXP: levelData.currentXP,
      xpForNextLevel: levelData.xpForNextLevel,
      xpProgress: levelData.xpProgress,
      spiderStats,
      archetype,
      trophyCase: masteredExercises,
    };
  },
});

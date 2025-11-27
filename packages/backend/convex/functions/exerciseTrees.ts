import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import {
  exerciseCategoryValidator,
  exerciseLevelValidator,
} from "../validators/validators";

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("exercise_trees"),
      _creationTime: v.number(),
      title: v.string(),
      exercises: v.array(
        v.object({
          _id: v.id("exercises"),
          title: v.string(),
          description: v.string(),
          category: exerciseCategoryValidator,
          level: exerciseLevelValidator,
          difficulty: v.number(),
        }),
      ),
      connections: v.array(
        v.object({
          fromExercise: v.id("exercises"),
          toExercise: v.id("exercises"),
          type: v.union(v.literal("required"), v.literal("optional")),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const allExerciseTrees = await ctx.db.query("exercise_trees").collect();
    const enrichedTrees = await Promise.all(
      allExerciseTrees.map(async (tree) => {
        const exerciseIds = new Set<Id<"exercises">>();
        for (const connection of tree.connections) {
          exerciseIds.add(connection.fromExercise);
          exerciseIds.add(connection.toExercise);
        }

        const exercises: Array<{
          _id: Id<"exercises">;
          title: string;
          description: string;
          category: Doc<"exercises">["category"];
          level: Doc<"exercises">["level"];
          difficulty: number;
        }> = [];

        for (const exerciseId of exerciseIds) {
          const exercise = await ctx.db.get(exerciseId);
          if (exercise) {
            exercises.push({
              _id: exercise._id,
              title: exercise.title,
              description: exercise.description,
              category: exercise.category,
              level: exercise.level,
              difficulty: exercise.difficulty,
            });
          }
        }

        return {
          _id: tree._id,
          _creationTime: tree._creationTime,
          title: tree.title,
          exercises,
          connections: tree.connections,
        };
      }),
    );

    return enrichedTrees;
  },
});

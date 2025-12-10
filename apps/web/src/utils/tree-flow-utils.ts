import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { Edge, Node } from "@xyflow/react";

import { TREE_EDGE_STYLE } from "./react-flow-config";

/**
 * Tree node structure from backend
 */
export interface TreeNode {
  exerciseId: Id<"exercises">;
  x: number;
  y: number;
}

/**
 * Tree connection structure from backend
 */
export interface TreeConnection {
  fromExercise: Id<"exercises">;
  toExercise: Id<"exercises">;
  type: "required" | "optional";
  sourceHandle: "top" | "bottom" | "left" | "right";
  targetHandle: "top" | "bottom" | "left" | "right";
}

/**
 * Exercise data structure (without progress)
 */
export interface ExerciseData {
  _id: Id<"exercises">;
  title: string;
  description: string;
  level: string;
  difficulty: number;
}

/**
 * Exercise data structure (with progress)
 */
export interface ExerciseDataWithProgress extends ExerciseData {
  userProgress: { status: string } | null;
}

/**
 * Convert tree nodes and exercises to React Flow nodes
 */
export function convertTreeToFlowNodes<
  T extends ExerciseData | ExerciseDataWithProgress,
>(treeNodes: TreeNode[], exercises: T[], nodeType = "exercise"): Node[] {
  const exerciseMap = new Map(exercises.map((ex) => [ex._id, ex]));

  return treeNodes
    .map((node): Node | null => {
      const exercise = exerciseMap.get(node.exerciseId);
      if (!exercise) return null;

      return {
        id: node.exerciseId,
        type: nodeType,
        position: { x: node.x, y: node.y },
        data: exercise as unknown as Record<string, unknown>,
      };
    })
    .filter((n): n is Node => n !== null);
}

/**
 * Convert tree connections to React Flow edges
 */
export function convertTreeToFlowEdges(connections: TreeConnection[]): Edge[] {
  return connections.map((conn, index) => ({
    id: `edge-${index}`,
    source: conn.fromExercise,
    target: conn.toExercise,
    sourceHandle: conn.sourceHandle,
    targetHandle: conn.targetHandle,
    type: "smoothstep",
    style: TREE_EDGE_STYLE,
    data: { type: conn.type },
  }));
}

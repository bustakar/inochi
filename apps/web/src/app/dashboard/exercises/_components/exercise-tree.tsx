"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { Edge, Node } from "@xyflow/react";
import { useCallback, useEffect, useMemo } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useQuery } from "convex/react";

import "@xyflow/react/dist/style.css";

import { api } from "@packages/backend/convex/_generated/api";

import type { ExerciseNodeData } from "./exercise-node";
import { ExerciseNode } from "./exercise-node";

const nodeTypes = {
  exercise: ExerciseNode,
};

// Level order for sorting (higher = harder)
const levelOrder: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
  elite: 5,
};

interface ExerciseTreeProps {
  searchQuery?: string;
}

export function ExerciseTree({ searchQuery }: ExerciseTreeProps) {
  const exercises = useQuery(api.functions.exercises.getExercisesForTree, {
    searchQuery: searchQuery?.trim() ?? undefined,
  });

  // Transform exercises to nodes and edges
  const { nodes, edges } = useMemo(() => {
    if (!exercises || exercises.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Create a map of exercise IDs to exercises for quick lookup
    const exerciseMap = new Map<
      Id<"exercises"> | Id<"private_exercises">,
      (typeof exercises)[0]
    >();
    exercises.forEach((ex) => exerciseMap.set(ex._id, ex));

    // Calculate depth for each exercise using topological sort
    // Depth represents how many prerequisite levels deep an exercise is
    const depthMap = new Map<
      Id<"exercises"> | Id<"private_exercises">,
      number
    >();
    const visited = new Set<Id<"exercises"> | Id<"private_exercises">>();

    const calculateDepth = (
      exerciseId: Id<"exercises"> | Id<"private_exercises">,
    ): number => {
      if (visited.has(exerciseId)) {
        return depthMap.get(exerciseId) ?? 0;
      }
      visited.add(exerciseId);

      const exercise = exerciseMap.get(exerciseId);
      if (!exercise || exercise.prerequisites.length === 0) {
        depthMap.set(exerciseId, 0);
        return 0;
      }

      const maxPrereqDepth = Math.max(
        ...exercise.prerequisites.map((prereqId) => calculateDepth(prereqId)),
      );
      const depth = maxPrereqDepth + 1;
      depthMap.set(exerciseId, depth);
      return depth;
    };

    // Calculate depth for all exercises
    exercises.forEach((ex) => calculateDepth(ex._id));

    // Sort exercises by:
    // 1. Depth (deeper = harder, goes to top)
    // 2. Difficulty (higher = harder)
    // 3. Level (higher level = harder)
    // 4. Title (alphabetical for consistency)
    const sortedExercises = [...exercises].sort((a, b) => {
      const depthA = depthMap.get(a._id) ?? 0;
      const depthB = depthMap.get(b._id) ?? 0;

      if (depthA !== depthB) {
        return depthB - depthA; // Deeper (harder) first
      }

      if (a.difficulty !== b.difficulty) {
        return b.difficulty - a.difficulty; // Higher difficulty first
      }

      const levelA = levelOrder[a.level] ?? 0;
      const levelB = levelOrder[b.level] ?? 0;
      if (levelA !== levelB) {
        return levelB - levelA; // Higher level first
      }

      return a.title.localeCompare(b.title);
    });

    // Group exercises by depth for horizontal positioning
    const exercisesByDepth = new Map<number, typeof sortedExercises>();
    sortedExercises.forEach((ex) => {
      const depth = depthMap.get(ex._id) ?? 0;
      if (!exercisesByDepth.has(depth)) {
        exercisesByDepth.set(depth, []);
      }
      const depthArray = exercisesByDepth.get(depth);
      if (depthArray) {
        depthArray.push(ex);
      }
    });

    // Create nodes with positions
    const horizontalSpacing = 300;
    const verticalSpacing = 200;
    const startX = 100;
    const startY = 100;

    const flowNodes: Node<ExerciseNodeData>[] = sortedExercises.map(
      (exercise) => {
        const depth = depthMap.get(exercise._id) ?? 0;
        const depthExercises = exercisesByDepth.get(depth) ?? [];
        const positionInDepth = depthExercises.indexOf(exercise);

        // Calculate horizontal position within depth layer
        const totalInDepth = depthExercises.length;
        const layerWidth = (totalInDepth - 1) * horizontalSpacing;
        const layerStartX = startX - layerWidth / 2;
        const x = layerStartX + positionInDepth * horizontalSpacing;

        // Calculate vertical position based on depth
        const y = startY + depth * verticalSpacing;

        return {
          id: exercise._id,
          type: "exercise",
          position: { x, y },
          data: {
            _id: exercise._id,
            title: exercise.title,
            description: exercise.description,
            category: exercise.category,
            level: exercise.level,
            difficulty: exercise.difficulty,
            isPrivate: exercise.isPrivate,
          },
        };
      },
    );

    // Create edges from prerequisites
    const flowEdges: Edge[] = [];
    exercises.forEach((exercise) => {
      exercise.prerequisites.forEach((prereqId) => {
        // Only create edge if both exercises are in the current set
        if (exerciseMap.has(prereqId)) {
          flowEdges.push({
            id: `${prereqId}-${exercise._id}`,
            source: prereqId,
            target: exercise._id,
            type: "smoothstep",
            animated: false,
          });
        }
      });
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [exercises]);

  const [flowNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  // Update nodes and edges when data changes
  useEffect(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  const onInit = useCallback(() => {
    // Fit view after initial render
    setTimeout(() => {
      const reactFlowInstance = document.querySelector(".react-flow");
      if (reactFlowInstance) {
        // Trigger fit view through React Flow's internal API
        // This will be handled by the Controls component's fit view button
      }
    }, 100);
  }, []);

  if (exercises === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading exercises...</p>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">
          {searchQuery?.trim()
            ? "No exercises found matching your search."
            : "No exercises found."}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        onInit={onInit}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as ExerciseNodeData | undefined;
            if (data?.isPrivate) {
              return "#f59e0b"; // amber
            }
            return "#10b981"; // emerald
          }}
          className="bg-background"
        />
      </ReactFlow>
    </div>
  );
}

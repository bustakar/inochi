"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { Edge, Node } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useQuery } from "convex/react";
import { Dumbbell, Star, Target, Trophy } from "lucide-react";

import {
  Badge,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Skeleton,
} from "@inochi/ui";

import "@xyflow/react/dist/style.css";

import { api } from "@packages/backend/convex/_generated/api";

import type { ExerciseStatus } from "./exercise-orb";
import { layoutElements } from "~/utils/tree-layout";
import { ExerciseOrb } from "./exercise-orb";

// Register node types
const nodeTypes = {
  exercise: ExerciseOrb,
};

// --- Mock Status Logic ---
function getMockStatus(difficulty: number): ExerciseStatus {
  if (difficulty <= 2) return "mastered";
  if (difficulty <= 4) return "unlocked";
  return "locked";
}

// --- Detail Sheet Component ---
function ExerciseDetailSheet({
  exerciseId,
  isPrivate: _isPrivate,
  isOpen,
  onClose,
}: {
  exerciseId: Id<"exercises"> | null;
  isPrivate: boolean;
  isOpen: boolean;
  onClose: () => void;
}) {
  const publicData = useQuery(
    api.functions.exercises.getPublicExerciseById,
    exerciseId ? { exerciseId } : "skip",
  );

  const data = publicData as
    | (typeof publicData & {
        prerequisites?: { _id: Id<"exercises">; title: string }[];
        progressions?: { _id: Id<"exercises">; title: string }[];
      })
    | null;
  const isLoading = publicData === undefined;

  if (!exerciseId) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2 text-2xl font-bold">
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : data?.title}
            {data && getMockStatus(data.difficulty) === "mastered" && (
              <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
            )}
          </SheetTitle>
          <SheetDescription>
            {isLoading ? (
              <Skeleton className="h-4 w-1/2" />
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">{data?.level}</Badge>
                <Badge variant="outline">
                  Difficulty: {data?.difficulty}/10
                </Badge>
              </div>
            )}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : data ? (
          <div className="h-[calc(100vh-200px)] overflow-y-auto pr-4">
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="mb-2 flex items-center gap-2 font-semibold">
                  <Target className="h-4 w-4" /> Description
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {data.description || "No description provided."}
                </p>
              </div>

              <Separator />

              {/* Muscles */}
              {data.muscles.length > 0 && (
                <div>
                  <h4 className="mb-2 flex items-center gap-2 font-semibold">
                    <Dumbbell className="h-4 w-4" /> Targeted Muscles
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {data.muscles.map(
                      (m: {
                        _id: Id<"muscles">;
                        name: string;
                        role?: string;
                      }) => (
                        <Badge
                          key={m._id}
                          variant="secondary"
                          className="capitalize"
                        >
                          {m.name}{" "}
                          {m.role && (
                            <span className="ml-1 text-[10px] opacity-50">
                              ({m.role})
                            </span>
                          )}
                        </Badge>
                      ),
                    )}
                  </div>
                </div>
              )}

              <Separator />

              {/* Progressions */}
              {((data.prerequisites?.length ?? 0) > 0 ||
                (data.progressions?.length ?? 0) > 0) && (
                <div>
                  <h4 className="mb-2 flex items-center gap-2 font-semibold">
                    <Trophy className="h-4 w-4" /> Progression Path
                  </h4>
                  <div className="space-y-4 text-sm">
                    {(data.prerequisites?.length ?? 0) > 0 && (
                      <div>
                        <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                          Prerequisites
                        </span>
                        <ul className="text-muted-foreground mt-1 list-inside list-disc space-y-1">
                          {(data.prerequisites ?? []).map(
                            (p: { _id: Id<"exercises">; title: string }) => (
                              <li key={p._id}>{p.title}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                    {(data.progressions?.length ?? 0) > 0 && (
                      <div>
                        <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                          Unlocks
                        </span>
                        <ul className="text-primary mt-1 list-inside list-disc space-y-1 font-medium">
                          {(data.progressions ?? []).map(
                            (p: { _id: Id<"exercises">; title: string }) => (
                              <li key={p._id}>{p.title}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground flex h-40 items-center justify-center">
            Exercise not found.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// --- Main Component ---
interface ExerciseTreeProps {
  searchQuery?: string;
}

export function ExerciseTree({ searchQuery }: ExerciseTreeProps) {
  // Fetch all exercise trees
  const exerciseTrees = useQuery(api.functions.exerciseTrees.list, {});

  // State for layouted graph
  const [layoutedNodes, setLayoutedNodes, onNodesChange] = useNodesState<Node>(
    [],
  );
  const [layoutedEdges, setLayoutedEdges, onEdgesChange] = useEdgesState<Edge>(
    [],
  );

  // State for detail sheet
  const [selectedNode, setSelectedNode] = useState<{
    id: Id<"exercises">;
  } | null>(null);

  // Transform trees into flat exercise list with prerequisites
  const exercises = useMemo(() => {
    if (!exerciseTrees || exerciseTrees.length === 0) {
      return [];
    }

    // Collect all unique exercises from all trees
    const exerciseMap = new Map<
      Id<"exercises">,
      {
        _id: Id<"exercises">;
        title: string;
        description: string;
        level:
          | "beginner"
          | "intermediate"
          | "advanced"
          | "expert"
          | "elite"
          | "legendary";
        difficulty: number;
        prerequisites: Id<"exercises">[];
        isPrivate: false;
      }
    >();

    // Build prerequisites map from all connections across all trees
    const prerequisitesMap = new Map<Id<"exercises">, Id<"exercises">[]>();

    // First pass: collect all exercises and build prerequisites map
    for (const tree of exerciseTrees) {
      for (const exercise of tree.exercises) {
        if (!exerciseMap.has(exercise._id)) {
          exerciseMap.set(exercise._id, {
            _id: exercise._id,
            title: exercise.title,
            description: exercise.description,
            level: exercise.level,
            difficulty: exercise.difficulty,
            prerequisites: [],
            isPrivate: false,
          });
        }
      }

      // Build prerequisites from connections
      for (const connection of tree.connections) {
        if (!prerequisitesMap.has(connection.toExercise)) {
          prerequisitesMap.set(connection.toExercise, []);
        }
        const prereqs = prerequisitesMap.get(connection.toExercise);
        if (prereqs) {
          prereqs.push(connection.fromExercise);
        }
      }
    }

    // Second pass: assign prerequisites to exercises
    const exercisesList = Array.from(exerciseMap.values()).map((ex) => ({
      ...ex,
      prerequisites: prerequisitesMap.get(ex._id) ?? [],
    }));

    // Apply search filter if provided
    if (searchQuery?.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      return exercisesList.filter((ex) => {
        return (
          ex.title.toLowerCase().includes(searchLower) ||
          ex.description.toLowerCase().includes(searchLower)
        );
      });
    }

    return exercisesList;
  }, [exerciseTrees, searchQuery]);

  // Layout calculation
  const { nodes, edges } = useMemo(() => {
    if (!exerciseTrees || exerciseTrees.length === 0) {
      return { nodes: [], edges: [] };
    }

    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];
    let currentXOffset = 0;
    const TREE_GAP = 400; // Gap between trees

    // Process each tree independently
    for (const tree of exerciseTrees) {
      // 1. Prepare data for this tree
      interface ExerciseWithStatus extends Record<string, unknown> {
        _id: Id<"exercises">;
        title: string;
        description: string;
        level:
          | "beginner"
          | "intermediate"
          | "advanced"
          | "expert"
          | "elite"
          | "legendary";
        difficulty: number;
        prerequisites: Id<"exercises">[];
        status: ExerciseStatus;
      }
      const treeExercisesMap = new Map<Id<"exercises">, ExerciseWithStatus>();

      // Collect exercises for this tree
      tree.exercises.forEach((ex) => {
        treeExercisesMap.set(ex._id, {
          ...ex,
          prerequisites: [], // Will be filled from connections
          status: getMockStatus(ex.difficulty),
        });
      });

      // Build local prerequisites map to create edges
      // We only care about connections within this tree
      const treeConnections: {
        source: Id<"exercises">;
        target: Id<"exercises">;
      }[] = [];

      tree.connections.forEach((conn) => {
        // Only add connection if both nodes exist in this tree (sanity check)
        if (
          treeExercisesMap.has(conn.fromExercise) &&
          treeExercisesMap.has(conn.toExercise)
        ) {
          treeConnections.push({
            source: conn.fromExercise,
            target: conn.toExercise,
          });
        }
      });

      // Create raw nodes for layout
      const rawNodes: Node[] = Array.from(treeExercisesMap.values()).map(
        (ex) => ({
          id: ex._id, // Use original ID for layout calculation
          type: "exercise",
          position: { x: 0, y: 0 },
          data: ex,
        }),
      );

      // Create raw edges for layout
      const rawEdges: Edge[] = treeConnections.map((conn) => ({
        id: `${conn.source}-${conn.target}`,
        source: conn.source,
        target: conn.target,
        type: "smoothstep",
      }));

      // 2. Layout this tree
      const { nodes: layoutedTreeNodes } = layoutElements(rawNodes, rawEdges, {
        direction: "BT",
      });

      // 3. Calculate bounding box to shift next tree
      let minX = Infinity;
      let maxX = -Infinity;

      if (layoutedTreeNodes.length > 0) {
        layoutedTreeNodes.forEach((node) => {
          if (node.position.x < minX) minX = node.position.x;
          if (node.position.x > maxX) maxX = node.position.x;
        });
      } else {
        minX = 0;
        maxX = 0;
      }

      const treeWidth = maxX - minX;

      // 4. Shift nodes and add to global collection with namespaced IDs
      // Namespaced ID format: `${tree._id}__${exercise._id}`

      layoutedTreeNodes.forEach((node) => {
        const originalId = node.id;
        const namespacedId = `${tree._id}__${originalId}`;

        // Shift X position
        // We also need to normalize the X position relative to the tree's minX so it starts at 0 locally, then add currentXOffset
        const normalizedX = node.position.x - minX;

        const finalNode: Node = {
          ...node,
          id: namespacedId,
          position: {
            x: currentXOffset + normalizedX,
            y: node.position.y,
          },
          data: {
            ...node.data,
            originalId: originalId, // Keep original ID for easy access
            treeId: tree._id,
          },
        };
        allNodes.push(finalNode);
      });

      // Add edges with namespaced IDs
      // We need to recreate edges because IDs changed
      treeConnections.forEach((conn) => {
        const sourceId = `${tree._id}__${conn.source}`;
        const targetId = `${tree._id}__${conn.target}`;

        // Find target node to determine lock status
        const targetNode = treeExercisesMap.get(conn.target);

        // In the previous logic, edge style depended on target node's status (or similar logic)
        // Let's stick to the existing logic: animate if !locked

        // Logic from previous implementation:
        // ex.prerequisites.forEach(prereqId => ... target: ex._id ...)
        // so 'ex' is the target.
        // const status = getMockStatus(ex.difficulty);
        // const isLocked = status === "locked";

        const targetStatus = targetNode
          ? getMockStatus(targetNode.difficulty)
          : "locked";
        const isLocked = targetStatus === "locked";

        allEdges.push({
          id: `${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          type: "smoothstep",
          animated: !isLocked,
          style: {
            stroke: isLocked ? "var(--muted-foreground)" : "var(--primary)",
            strokeWidth: isLocked ? 1 : 2,
            opacity: isLocked ? 0.3 : 0.8,
          },
        });
      });

      // Update offset for next tree
      // Add width of this tree + gap
      // If tree was empty, width is 0
      if (layoutedTreeNodes.length > 0) {
        currentXOffset += treeWidth + TREE_GAP;
      }
    }

    return { nodes: allNodes, edges: allEdges };
  }, [exerciseTrees]);

  // Update layout when calculation changes
  useEffect(() => {
    setLayoutedNodes(nodes);
    setLayoutedEdges(edges);
  }, [nodes, edges, setLayoutedNodes, setLayoutedEdges]);

  // Handle node click
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === "exercise") {
      const data = node.data as {
        _id: Id<"exercises">;
      };
      setSelectedNode({
        id: data._id,
      });
    }
  }, []);

  if (exerciseTrees === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground animate-pulse">
          Loading skill tree...
        </p>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="bg-muted rounded-full p-6">
          <Dumbbell className="text-muted-foreground h-10 w-10" />
        </div>
        <p className="text-muted-foreground">
          {searchQuery?.trim()
            ? "No exercises found matching your search."
            : "No exercises found. Start your journey!"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background/50 relative h-full w-full">
      <ReactFlow
        nodes={layoutedNodes}
        edges={layoutedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        minZoom={0.2}
        maxZoom={4}
        defaultEdgeOptions={{ type: "smoothstep" }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="currentColor"
          className="text-muted-foreground/20"
        />
        <Controls
          showInteractive={false}
          className="bg-background border-border"
        />
        <MiniMap
          nodeColor={(n) => {
            const status = (n.data as { status?: ExerciseStatus }).status;
            return status === "locked"
              ? "#52525b"
              : status === "mastered"
                ? "#f59e0b"
                : "#10b981";
          }}
          className="!bg-background !border-border overflow-hidden rounded-lg"
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>

      {/* Detail Sheet */}
      <ExerciseDetailSheet
        exerciseId={selectedNode?.id ?? null}
        isPrivate={false}
        isOpen={selectedNode !== null}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}

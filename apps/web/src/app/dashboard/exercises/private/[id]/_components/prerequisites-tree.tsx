"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Edge,
  Handle,
  MarkerType,
  Node,
  Position,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";

import "reactflow/dist/style.css";

import { Id } from "@packages/backend/convex/_generated/dataModel";

import { Badge } from "@inochi/ui";

// ============================================================================
// Types
// ============================================================================

type ExerciseId = Id<"exercises"> | Id<"private_exercises">;

interface PrerequisiteTreeData {
  exercise: {
    _id: ExerciseId;
    title: string;
  };
  prerequisites: Array<{
    exercise: {
      _id: ExerciseId;
      title: string;
    };
    prerequisites: Array<{
      exercise: {
        _id: ExerciseId;
        title: string;
      };
      prerequisites: Array<unknown>;
    }>;
  }>;
}

// ============================================================================
// Custom Node Component
// ============================================================================

interface ExerciseNodeData {
  label: string;
  exerciseId: ExerciseId;
  isCurrent: boolean;
}

function ExerciseNode({ data }: { data: ExerciseNodeData }) {
  const router = useRouter();

  const handleClick = () => {
    // TODO: Handle public exercises once implemented
    router.push(`/dashboard/exercises/private/${data.exerciseId}`);
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        handleClick();
      }}
      className="relative z-10 cursor-pointer"
      style={{ pointerEvents: "auto" }}
    >
      {/* Source handle at top for prerequisites (edges flow upward) */}
      <Handle
        type="source"
        position={Position.Top}
        style={{ visibility: "hidden", width: 0, height: 0 }}
      />
      <Badge
        variant={data.isCurrent ? "default" : "secondary"}
        className="pointer-events-auto text-xs font-medium"
      >
        {data.label}
      </Badge>
      {/* Target handle at bottom for receiving connections */}
      <Handle
        type="target"
        position={Position.Bottom}
        style={{ visibility: "hidden", width: 0, height: 0 }}
      />
    </div>
  );
}

const nodeTypes = {
  exercise: ExerciseNode,
};

// ============================================================================
// Helper Functions
// ============================================================================

function buildNodesAndEdges(
  tree: PrerequisiteTreeData,
  currentExerciseId: ExerciseId,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Calculate layout: top-bottom, current exercise at top
  // Level 0: current exercise (top)
  // Level 1: direct prerequisites (middle)
  // Level 2: prerequisites of prerequisites (bottom)

  const HORIZONTAL_SPACING = 180;
  const VERTICAL_SPACING = 100;
  const START_Y = 30;

  // Track all exercise IDs to detect duplicates
  const seenExerciseIds = new Set<string>();

  // Collect all level 2 nodes first to calculate proper spacing
  const level2Nodes: Array<{
    prereqId: string;
    parentId: string;
    index: number;
    exercise: { _id: ExerciseId; title: string };
  }> = [];
  tree.prerequisites.forEach((prereq, prereqIndex) => {
    prereq.prerequisites.forEach((prereq2, index2) => {
      level2Nodes.push({
        prereqId: prereq2.exercise._id as string,
        parentId: prereq.exercise._id as string,
        index: index2,
        exercise: prereq2.exercise,
      });
    });
  });

  // Calculate total width needed for level 2
  const totalLevel2Width =
    level2Nodes.length > 0 ? (level2Nodes.length - 1) * HORIZONTAL_SPACING : 0;

  // Add current exercise node (level 0) - will center later
  const currentY = START_Y;
  nodes.push({
    id: currentExerciseId as string,
    type: "exercise",
    position: { x: 0, y: currentY },
    data: {
      label: tree.exercise.title,
      exerciseId: currentExerciseId,
      isCurrent: true,
    },
    draggable: false,
  });

  // Add level 1 nodes (direct prerequisites)
  const level1Count = tree.prerequisites.length;
  const level1StartX =
    level1Count > 0 ? -((level1Count - 1) * HORIZONTAL_SPACING) / 2 : 0;

  tree.prerequisites.forEach((prereq, index) => {
    const prereqId = prereq.exercise._id as string;
    const y = START_Y + VERTICAL_SPACING;
    const x = level1StartX + index * HORIZONTAL_SPACING;

    nodes.push({
      id: prereqId,
      type: "exercise",
      position: { x, y },
      data: {
        label: prereq.exercise.title,
        exerciseId: prereq.exercise._id,
        isCurrent: false,
      },
      draggable: false,
    });

    // Add edge from prerequisite to current exercise (flowing upward)
    edges.push({
      id: `edge-${prereqId}-${currentExerciseId}`,
      source: prereqId,
      target: currentExerciseId as string,
      type: "smoothstep",
      animated: false,
      style: {
        strokeWidth: 1.5,
        stroke: "#52525b",
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 12,
        height: 12,
        color: "#52525b",
      },
    });

    // Add level 2 nodes (prerequisites of prerequisites)
    const level2ForThisPrereq = prereq.prerequisites;
    if (level2ForThisPrereq.length > 0) {
      const level2StartX =
        x - ((level2ForThisPrereq.length - 1) * HORIZONTAL_SPACING) / 2;
      level2ForThisPrereq.forEach((prereq2, index2) => {
        const prereq2Id = prereq2.exercise._id as string;

        // Check if this exercise is already a direct prerequisite
        const isDirectPrereq = tree.prerequisites.some(
          (p) => p.exercise._id === prereq2.exercise._id,
        );

        // If it's a direct prerequisite, skip adding it as a level 2 node
        if (isDirectPrereq) {
          return;
        }

        const y2 = START_Y + VERTICAL_SPACING * 2;
        const x2 = level2StartX + index2 * HORIZONTAL_SPACING;

        nodes.push({
          id: prereq2Id,
          type: "exercise",
          position: { x: x2, y: y2 },
          data: {
            label: prereq2.exercise.title,
            exerciseId: prereq2.exercise._id,
            isCurrent: false,
          },
          draggable: false,
        });

        // Add edge from level 2 prerequisite to level 1 prerequisite
        edges.push({
          id: `edge-${prereq2Id}-${prereqId}`,
          source: prereq2Id,
          target: prereqId,
          type: "smoothstep",
          animated: false,
          style: {
            strokeWidth: 1.5,
            stroke: "#52525b",
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 12,
            height: 12,
            color: "#52525b",
          },
        });
      });
    }
  });

  // Center the current exercise node horizontally based on all nodes
  if (nodes.length > 1) {
    const allXPositions = nodes.map((n) => n.position.x);
    const minX = Math.min(...allXPositions);
    const maxX = Math.max(...allXPositions);
    const centerX = (minX + maxX) / 2;

    // Adjust current exercise node to be centered
    const currentNode = nodes.find(
      (n) => n.id === (currentExerciseId as string),
    );
    if (currentNode) {
      currentNode.position.x = centerX;
    }
  }

  return { nodes, edges };
}

// ============================================================================
// Helper: Filter tree by max depth
// ============================================================================

function filterTreeByDepth(
  tree: PrerequisiteTreeData,
  maxDepth: number,
): PrerequisiteTreeData {
  // maxDepth means "number of levels below current exercise"
  // 1 level = current + 1 level below (direct prerequisites only)
  // 2 levels = current + 2 levels below (full tree, since backend fetches max 3)
  // 3 levels = same as 2 levels (backend limitation)

  if (maxDepth === 1) {
    // Show current + 1 level below (direct prerequisites only)
    return {
      exercise: tree.exercise,
      prerequisites: tree.prerequisites.map((prereq) => ({
        exercise: prereq.exercise,
        prerequisites: [],
      })),
    };
  }

  // maxDepth >= 2: Show full tree (current + 2 levels below)
  // This is the maximum we fetch from backend
  return tree;
}

// ============================================================================
// Main Component
// ============================================================================

interface PrerequisitesTreeProps {
  tree: PrerequisiteTreeData;
  currentExerciseId: ExerciseId;
  maxDepth: number;
}

function PrerequisitesTreeInner({
  tree,
  currentExerciseId,
  maxDepth,
}: PrerequisitesTreeProps) {
  const filteredTree = React.useMemo(
    () => filterTreeByDepth(tree, maxDepth),
    [tree, maxDepth],
  );
  const { nodes: initialNodes, edges: initialEdges } = React.useMemo(
    () => buildNodesAndEdges(filteredTree, currentExerciseId),
    [filteredTree, currentExerciseId],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();

  // Update nodes and edges when tree data changes
  React.useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildNodesAndEdges(
      filteredTree,
      currentExerciseId,
    );
    setNodes(newNodes);
    setEdges(newEdges);
  }, [filteredTree, currentExerciseId, setNodes, setEdges]);

  // Fit view when maxDepth changes to ensure nothing is cut off
  React.useEffect(() => {
    // Use setTimeout to ensure nodes are rendered before fitting view
    const timeoutId = setTimeout(() => {
      fitView({ padding: 0.2, duration: 300 });
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [maxDepth, fitView]);

  if (filteredTree.prerequisites.length === 0) {
    return (
      <div>
        <p className="text-muted-foreground text-sm">None</p>
      </div>
    );
  }

  return (
    <div className="bg-background h-[500px] w-full overflow-hidden">
      <style
        dangerouslySetInnerHTML={{
          __html: `
              .prerequisites-tree .react-flow {
                background: transparent !important;
              }
              .prerequisites-tree .react-flow__background {
                display: none !important;
              }
              .prerequisites-tree .react-flow__edge-path {
                stroke: #52525b !important;
                stroke-width: 1.5px !important;
                fill: none !important;
              }
              .prerequisites-tree .react-flow__edge {
                pointer-events: none !important;
              }
              .prerequisites-tree .react-flow__edge.selected .react-flow__edge-path {
                stroke: #52525b !important;
              }
              .prerequisites-tree .react-flow__connectionline {
                stroke: #52525b !important;
                stroke-width: 1.5px !important;
              }
              .prerequisites-tree .react-flow__viewport {
                pointer-events: none !important;
              }
              .prerequisites-tree .react-flow__node {
                pointer-events: auto !important;
              }
              .prerequisites-tree .react-flow__renderer {
                pointer-events: none !important;
              }
            `,
        }}
      />
      <div className="prerequisites-tree h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          proOptions={{ hideAttribution: true }}
        />
      </div>
    </div>
  );
}

export function PrerequisitesTree(props: PrerequisitesTreeProps) {
  return (
    <ReactFlowProvider>
      <PrerequisitesTreeInner {...props} />
    </ReactFlowProvider>
  );
}

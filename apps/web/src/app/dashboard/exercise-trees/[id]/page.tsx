"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { Edge, Node, NodeTypes } from "@xyflow/react";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@packages/backend/convex/_generated/api";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import { useQuery } from "convex/react";

import "@xyflow/react/dist/style.css";

import { Button } from "@inochi/ui";

import type { ViewerNodeData } from "./_components/viewer-node";
import { DEFAULT_EDGE_OPTIONS } from "../../../../utils/react-flow-config";
import {
  convertTreeToFlowEdges,
  convertTreeToFlowNodes,
} from "../../../../utils/tree-flow-utils";
import { ViewerNode } from "./_components/viewer-node";

const nodeTypes: NodeTypes = {
  exercise: ViewerNode,
};

// Inner component that uses React Flow hooks
function TreeViewerCanvas({
  tree,
}: {
  tree: NonNullable<
    ReturnType<
      typeof useQuery<typeof api.functions.exerciseTrees.getByIdWithProgress>
    >
  >;
}) {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Initialize nodes and edges from tree data
  useEffect(() => {
    const flowNodes = convertTreeToFlowNodes<ViewerNodeData>(
      tree.nodes,
      tree.exercises.map((ex) => ({
        _id: ex._id,
        title: ex.title,
        description: ex.description,
        level: ex.level,
        difficulty: ex.difficulty,
        userProgress: ex.userProgress,
      })),
      "exercise",
    );

    const flowEdges = convertTreeToFlowEdges(tree.connections);

    setNodes(flowNodes);
    setEdges(flowEdges);

    // Fit view after a short delay to ensure nodes are rendered
    setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 100);
  }, [tree, setNodes, setEdges, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      panOnDrag={true}
      zoomOnScroll={true}
      zoomOnPinch={true}
      fitView
      minZoom={0.2}
      maxZoom={4}
      defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
      proOptions={{ hideAttribution: true }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        color="currentColor"
        className="text-muted-foreground/20"
      />
    </ReactFlow>
  );
}

export default function ExerciseTreeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const treeId = params.id as string;

  const tree = useQuery(api.functions.exerciseTrees.getByIdWithProgress, {
    id: treeId as Id<"exercise_trees">,
  });

  if (tree === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (tree === null) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Exercise tree not found</p>
        <Button onClick={() => router.push("/dashboard/exercise-trees")}>
          Back to Exercise Trees
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="shrink-0 p-4">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <div>
            <h1 className="retro text-2xl font-bold">{tree.title}</h1>
            {tree.description && (
              <p className="text-muted-foreground text-sm">
                {tree.description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <ReactFlowProvider>
          <TreeViewerCanvas tree={tree} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}

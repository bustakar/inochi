"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { Connection, Edge, Node } from "@xyflow/react";
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/clerk-react";
import { api } from "@packages/backend/convex/_generated/api";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import { useMutation, useQuery } from "convex/react";

import "@xyflow/react/dist/style.css";

import type { EditorNodeData } from "./_components/editor-node";
import {
  DEFAULT_EDGE_OPTIONS,
  TREE_EDGE_STYLE,
} from "../../../../../utils/react-flow-config";
import { isClientAdminOrModerator } from "../../../../../utils/roles";
import {
  convertTreeToFlowEdges,
  convertTreeToFlowNodes,
} from "../../../../../utils/tree-flow-utils";
import { EditorNode } from "./_components/editor-node";
import { ExercisePickerSidebar } from "./_components/exercise-picker-sidebar";
import { TreeToolbar } from "./_components/tree-toolbar";

const nodeTypes = {
  exercise: EditorNode,
};

// Inner component that uses React Flow hooks
const TreeEditorCanvas = React.forwardRef<
  { save: () => Promise<void> },
  {
    tree: NonNullable<
      ReturnType<typeof useQuery<typeof api.functions.exerciseTrees.getById>>
    >;
    exercises: NonNullable<
      ReturnType<typeof useQuery<typeof api.functions.exercises.list>>
    >;
    treeId: Id<"exercise_trees">;
  }
>(({ tree, exercises: _exercises, treeId }, ref) => {
  const updateTree = useMutation(api.functions.exerciseTrees.update);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition } = useReactFlow();

  // Load tree data into React Flow state
  useEffect(() => {
    // tree and exercises are guaranteed to be defined by parent component
    const flowNodes = convertTreeToFlowNodes<EditorNodeData>(
      tree.nodes,
      tree.exercises.map((ex) => ({
        _id: ex._id,
        title: ex.title,
        description: ex.description,
        level: ex.level,
        difficulty: ex.difficulty,
      })),
      "exercise",
    );

    const flowEdges = convertTreeToFlowEdges(tree.connections);

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [tree, setNodes, setEdges]);

  // Handle new connections
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            style: TREE_EDGE_STYLE,
            data: { type: "required" },
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  // Handle dropping exercises onto canvas
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const exerciseData = JSON.parse(
        event.dataTransfer.getData("application/exercise"),
      ) as EditorNodeData;

      // Check if node already exists
      if (nodes.some((n) => n.id === exerciseData._id)) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: exerciseData._id,
        type: "exercise",
        position,
        data: exerciseData,
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [nodes, screenToFlowPosition, setNodes],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  // Handle node deletion
  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      const deletedIds = new Set(deleted.map((n) => n.id));
      setEdges((eds) =>
        eds.filter(
          (e) => !deletedIds.has(e.source) && !deletedIds.has(e.target),
        ),
      );
    },
    [setEdges],
  );

  // Save tree handler
  const handleSave = useCallback(async () => {
    try {
      const nodesData = nodes.map((n) => ({
        exerciseId: n.id as Id<"exercises">,
        x: n.position.x,
        y: n.position.y,
      }));

      const connectionsData = edges.map((e) => ({
        fromExercise: e.source as Id<"exercises">,
        toExercise: e.target as Id<"exercises">,
        type: (e.data?.type ?? "required") as "required" | "optional",
        sourceHandle: (e.sourceHandle ?? "bottom") as
          | "top"
          | "bottom"
          | "left"
          | "right",
        targetHandle: (e.targetHandle ?? "top") as
          | "top"
          | "bottom"
          | "left"
          | "right",
      }));

      await updateTree({
        id: treeId,
        nodes: nodesData,
        connections: connectionsData,
      });
    } catch (error) {
      console.error("Failed to save tree:", error);
      throw error;
    }
  }, [nodes, edges, treeId, updateTree]);

  // Expose save function via ref
  useImperativeHandle(ref, () => ({
    save: handleSave,
  }));

  return (
    <div className="relative flex-1">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodesDelete={onNodesDelete}
        nodeTypes={nodeTypes}
        nodesDraggable
        nodesConnectable
        deleteKeyCode="Delete"
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
        <Controls className="bg-background border-border" />
      </ReactFlow>
    </div>
  );
});

TreeEditorCanvas.displayName = "TreeEditorCanvas";

export default function ExerciseTreeEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { sessionClaims, isLoaded } = useAuth();
  const treeId = params.id as Id<"exercise_trees">;

  // All hooks must be called before any conditional returns
  const tree = useQuery(api.functions.exerciseTrees.getById, { id: treeId });
  const exercises = useQuery(api.functions.exercises.list, {});
  const [isSaving, setIsSaving] = useState(false);
  const canvasRef = useRef<{ save: () => Promise<void> }>(null);

  const handleSave = useCallback(async () => {
    if (!canvasRef.current) return;
    setIsSaving(true);
    try {
      await canvasRef.current.save();
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Now we can do conditional returns after all hooks
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const isAdminOrMod = isClientAdminOrModerator(sessionClaims);
  if (!isAdminOrMod) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <p className="text-muted-foreground">
          You don&apos;t have permission to access this page.
        </p>
      </div>
    );
  }

  if (tree === undefined || exercises === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading tree...</p>
      </div>
    );
  }

  if (tree === null) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <p className="text-muted-foreground">Tree not found.</p>
        <button
          onClick={() => router.push("/dashboard/admin/exercise-trees")}
          className="text-primary underline"
        >
          Back to Trees
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <TreeToolbar
        treeId={treeId}
        title={tree.title}
        description={tree.description}
        status={tree.status}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ExercisePickerSidebar
          onExerciseSelect={(_exercise) => {
            // This is handled by drag-drop, but we keep it for API consistency
          }}
        />

        {/* tree and exercises are guaranteed to be defined at this point */}
        <ReactFlowProvider>
          <TreeEditorCanvas
            ref={canvasRef}
            tree={tree}
            exercises={exercises}
            treeId={treeId}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}

"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { ExerciseLevel } from "@packages/backend/convex/validators/validators";
import type { NodeProps } from "@xyflow/react";

import { ExerciseNodeCard } from "../../../../../../components/exercise-node-card";
import { NodeHandles } from "../../../../../../components/react-flow/node-handles";

export interface EditorNodeData extends Record<string, unknown> {
  _id: Id<"exercises">;
  title: string;
  description: string;
  level: ExerciseLevel;
  difficulty: number;
}

export function EditorNode({ data }: NodeProps) {
  const nodeData = data as EditorNodeData;
  const { title, difficulty, level } = nodeData;

  return (
    <div className="group relative">
      <NodeHandles visible={true} />
      <ExerciseNodeCard
        title={title}
        difficulty={difficulty}
        level={level}
        variant="editor"
        width="wide"
        titleLines={2}
      />
    </div>
  );
}

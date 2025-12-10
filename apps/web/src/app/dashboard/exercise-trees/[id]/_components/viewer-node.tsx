"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type {
  ExerciseLevel,
  ProgressStatus,
} from "@packages/backend/convex/validators/validators";
import type { NodeProps } from "@xyflow/react";
import { useRouter } from "next/navigation";

import { ExerciseNodeCard } from "../../../../../components/exercise-node-card";
import { NodeHandles } from "../../../../../components/react-flow/node-handles";

export interface ViewerNodeData extends Record<string, unknown> {
  _id: Id<"exercises">;
  title: string;
  description: string;
  level: ExerciseLevel;
  difficulty: number;
  userProgress: { status: ProgressStatus } | null;
}

export function ViewerNode({ data }: NodeProps) {
  const router = useRouter();
  const nodeData = data as ViewerNodeData;
  const { title, difficulty, level, userProgress, _id } = nodeData;

  const handleCardClick = () => {
    router.push(`/dashboard/exercises/public/${_id}`);
  };

  return (
    <div className="group relative">
      <NodeHandles visible={false} />
      <ExerciseNodeCard
        title={title}
        difficulty={difficulty}
        level={level}
        progressStatus={userProgress?.status ?? null}
        onClick={handleCardClick}
        isGrayscale={!userProgress}
        variant="viewer"
        width="wide"
        titleLines={2}
      />
    </div>
  );
}

"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { ExerciseLevel } from "@packages/backend/convex/validators/validators";
import type { NodeProps } from "@xyflow/react";
import { useRouter } from "next/navigation";
import { Handle, Position } from "@xyflow/react";

import { Badge } from "@inochi/ui";

import { exerciseLevelColors } from "../../../../utils/exercise-utils";

export interface ExerciseNodeData extends Record<string, unknown> {
  _id: Id<"exercises">;
  title: string;
  description: string;
  level: ExerciseLevel;
  difficulty: number;
}

export function ExerciseNode({ data }: NodeProps) {
  const nodeData = data as ExerciseNodeData;
  const router = useRouter();

  const detailUrl = `/dashboard/exercises/public/${nodeData._id}`;

  const handleClick = () => {
    router.push(detailUrl);
  };

  return (
    <div
      className="bg-card max-w-[250px] min-w-[200px] cursor-pointer rounded-lg border p-3 shadow-sm transition-shadow hover:shadow-md"
      onClick={handleClick}
    >
      {/* Target handle at top - receives edges from prerequisites below */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ visibility: "hidden", width: 0, height: 0 }}
      />
      {/* Title */}
      <h3 className="text-card-foreground mb-2 line-clamp-2 text-sm font-semibold">
        {nodeData.title}
      </h3>

      {/* Badges */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <Badge className={exerciseLevelColors[nodeData.level]}>
          <span className="text-xs">{nodeData.level}</span>
        </Badge>
      </div>

      {/* Difficulty */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs font-medium">
          Difficulty:
        </span>
        <div className="flex gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                i < nodeData.difficulty ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className="text-muted-foreground text-xs">
          {nodeData.difficulty}/10
        </span>
      </div>
      {/* Source handle at bottom - sends edges upward to harder exercises above */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ visibility: "hidden", width: 0, height: 0 }}
      />
    </div>
  );
}

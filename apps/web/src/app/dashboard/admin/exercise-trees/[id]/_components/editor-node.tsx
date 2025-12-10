"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { ExerciseLevel } from "@packages/backend/convex/validators/validators";
import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";

import {
  BitCard,
  BitCardContent,
  BitCardHeader,
  BitCardTitle,
  HealthBar,
} from "@inochi/ui";

import { exerciseLevelHealthBarColors } from "../../../../../../utils/exercise-utils";

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
      {/* Handles - 4 positions for both source and target */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!bg-primary/50 !-top-1.5 !h-3 !w-3"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className="!bg-primary/50 !-bottom-1.5 !h-3 !w-3"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!bg-primary/50 !-left-1.5 !h-3 !w-3"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className="!bg-primary/50 !-right-1.5 !h-3 !w-3"
      />

      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="!bg-primary/50 !-top-1.5 !h-3 !w-3"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!bg-primary/50 !-bottom-1.5 !h-3 !w-3"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!bg-primary/50 !-left-1.5 !h-3 !w-3"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-primary/50 !-right-1.5 !h-3 !w-3"
      />

      {/* Card Container */}
      <div className="w-[240px]">
        <BitCard>
          <BitCardHeader className="pb-1">
            <BitCardTitle className="retro line-clamp-1 text-sm font-semibold">
              {title}
            </BitCardTitle>
          </BitCardHeader>
          <BitCardContent className="pt-0">
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex w-full justify-between gap-2">
                <span className="text-muted-foreground retro text-xs font-medium">
                  Difficulty:
                </span>
                <span className="text-muted-foreground retro text-xs">
                  {difficulty}/12
                </span>
              </div>
              <HealthBar
                value={(difficulty / 12) * 100}
                sections={12}
                className="h-3"
                progressBg={exerciseLevelHealthBarColors[level]}
              />
            </div>
          </BitCardContent>
        </BitCard>
      </div>
    </div>
  );
}

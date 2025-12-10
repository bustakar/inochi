"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { ExerciseLevel } from "@packages/backend/convex/validators/validators";
import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { Dumbbell } from "lucide-react";

import { cn } from "@inochi/ui";

export interface EditorNodeData extends Record<string, unknown> {
  _id: Id<"exercises">;
  title: string;
  description: string;
  level: ExerciseLevel;
  difficulty: number;
}

export function EditorNode({ data }: NodeProps) {
  const nodeData = data as EditorNodeData;
  const { title, difficulty } = nodeData;

  return (
    <div className="group relative">
      {/* Orb Container */}
      <div
        className={cn(
          "relative flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 transition-all duration-300",
          "bg-background border-primary/50 hover:border-primary hover:shadow-primary/20 hover:shadow-lg",
        )}
      >
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

        {/* Icon / Content */}
        <div className="flex flex-col items-center gap-1 p-2 text-center">
          <Dumbbell className="text-primary h-6 w-6" />
          <span className="text-[10px] leading-none font-bold">
            {difficulty}/10
          </span>
        </div>
      </div>

      {/* Label */}
      <div className="absolute -bottom-8 left-1/2 w-32 -translate-x-1/2 text-center">
        <span className="text-foreground bg-background/80 block truncate rounded border px-2 py-0.5 text-xs font-medium shadow-sm backdrop-blur-sm">
          {title}
        </span>
      </div>
    </div>
  );
}

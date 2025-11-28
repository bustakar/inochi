"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { Dumbbell } from "lucide-react";
import { cn } from "@inochi/ui";

export interface EditorNodeData extends Record<string, unknown> {
  _id: Id<"exercises">;
  title: string;
  description: string;
  category: "calisthenics" | "gym" | "stretch" | "mobility";
  level: "beginner" | "intermediate" | "advanced" | "expert" | "elite";
  difficulty: number;
}

export function EditorNode({ data }: NodeProps) {
  const nodeData = data as EditorNodeData;
  const { title, difficulty } = nodeData;

  return (
    <div className="relative group">
      {/* Orb Container */}
      <div
        className={cn(
          "relative flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 transition-all duration-300",
          "bg-background border-primary/50 hover:border-primary hover:shadow-lg hover:shadow-primary/20",
        )}
      >
        {/* Handles - 4 positions for both source and target */}
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className="!bg-primary/50 !w-3 !h-3 !-top-1.5"
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="bottom"
          className="!bg-primary/50 !w-3 !h-3 !-bottom-1.5"
        />
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="!bg-primary/50 !w-3 !h-3 !-left-1.5"
        />
        <Handle
          type="target"
          position={Position.Right}
          id="right"
          className="!bg-primary/50 !w-3 !h-3 !-right-1.5"
        />

        <Handle
          type="source"
          position={Position.Top}
          id="top"
          className="!bg-primary/50 !w-3 !h-3 !-top-1.5"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="!bg-primary/50 !w-3 !h-3 !-bottom-1.5"
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          className="!bg-primary/50 !w-3 !h-3 !-left-1.5"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="!bg-primary/50 !w-3 !h-3 !-right-1.5"
        />

        {/* Icon / Content */}
        <div className="flex flex-col items-center gap-1 p-2 text-center">
          <Dumbbell className="h-6 w-6 text-primary" />
          <span className="text-[10px] font-bold leading-none">
            {difficulty}/10
          </span>
        </div>
      </div>

      {/* Label */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 text-center">
        <span className="text-xs text-foreground bg-background/80 px-2 py-0.5 rounded backdrop-blur-sm shadow-sm border truncate block font-medium">
          {title}
        </span>
      </div>
    </div>
  );
}


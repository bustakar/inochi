"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { Lock, Check, Star, Dumbbell } from "lucide-react";
import { cn } from "@inochi/ui";

export type ExerciseStatus = "locked" | "unlocked" | "mastered";

export interface ExerciseOrbData extends Record<string, unknown> {
  _id: Id<"exercises"> | Id<"private_exercises">;
  title: string;
  description: string;
  category: "calisthenics" | "gym" | "stretch" | "mobility";
  level: "beginner" | "intermediate" | "advanced" | "expert" | "elite";
  difficulty: number;
  isPrivate: boolean;
  status: ExerciseStatus;
}

export function ExerciseOrb({ data }: NodeProps) {
  const nodeData = data as ExerciseOrbData;
  const { status, title, difficulty } = nodeData;

  // Visual variants based on status
  const statusStyles = {
    locked: "bg-muted text-muted-foreground border-muted-foreground/20 opacity-80 grayscale",
    unlocked: "bg-background border-primary/50 hover:border-primary hover:shadow-lg hover:shadow-primary/20",
    mastered: "bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] text-amber-600",
  };

  const iconStyles = {
    locked: "text-muted-foreground",
    unlocked: "text-primary",
    mastered: "text-amber-500",
  };

  return (
    <div className="relative group">
      {/* Glow for mastered */}
      {status === "mastered" && (
        <div className="absolute -inset-1 rounded-full bg-amber-500/20 blur-md animate-pulse" />
      )}
      
      {/* Orb Container */}
      <div
        className={cn(
          "relative flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 transition-all duration-300",
          statusStyles[status]
        )}
      >
        {/* Handles */}
        <Handle
          type="target"
          position={Position.Bottom}
          className="!bg-muted-foreground/50 !w-3 !h-3 !-bottom-1.5"
        />
        
        <Handle
          type="source"
          position={Position.Top}
          className="!bg-muted-foreground/50 !w-3 !h-3 !-top-1.5"
        />

        {/* Icon / Content */}
        <div className="flex flex-col items-center gap-1 p-2 text-center">
          {status === "locked" ? (
            <Lock className="h-6 w-6" />
          ) : status === "mastered" ? (
            <Star className={cn("h-6 w-6 fill-current", iconStyles.mastered)} />
          ) : (
             // Default icon based on category could go here, for now generic
             <Dumbbell className={cn("h-6 w-6", iconStyles.unlocked)} />
          )}
          
          <span className="text-[10px] font-bold leading-none">
            {difficulty}/10
          </span>
        </div>
      </div>

      {/* Label (Tooltip-ish, visible on hover or always for unlocked?) */}
      {/* Always visible label below node for better map feel */}
      <div className={cn(
        "absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 text-center transition-opacity",
        status === "locked" ? "opacity-50" : "opacity-100 font-medium"
      )}>
        <span className="text-xs text-foreground bg-background/80 px-2 py-0.5 rounded backdrop-blur-sm shadow-sm border truncate block">
          {title}
        </span>
      </div>
    </div>
  );
}


"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type {
  ExerciseLevel,
  ProgressStatus,
} from "@packages/backend/convex/validators/validators";
import type { NodeProps } from "@xyflow/react";
import { useRouter } from "next/navigation";
import { Handle, Position } from "@xyflow/react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  HealthBar,
} from "@inochi/ui";

import {
  exerciseLevelHealthBarColors,
  getProgressStatusColor,
  getProgressStatusLabel,
} from "../../../../../utils/exercise-utils";

export interface ViewerNodeData extends Record<string, unknown> {
  _id: Id<"exercises">;
  title: string;
  description: string;
  level: ExerciseLevel;
  difficulty: number;
  userProgress: { status: ProgressStatus } | null;
}

function ProgressRibbon({ status }: { status: ProgressStatus | null }) {
  return (
    <>
      {status && (
        <div
          className={cn(
            "retro absolute top-2 right-2 px-2 py-1 text-xs font-bold",
            getProgressStatusColor(status),
          )}
        >
          {getProgressStatusLabel(status)}
        </div>
      )}
    </>
  );
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
      {/* Handles - 4 positions for both source and target (invisible but functional) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!pointer-events-none !opacity-0"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className="!pointer-events-none !opacity-0"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!pointer-events-none !opacity-0"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className="!pointer-events-none !opacity-0"
      />

      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="!pointer-events-none !opacity-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!pointer-events-none !opacity-0"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!pointer-events-none !opacity-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!pointer-events-none !opacity-0"
      />

      {/* Card Container */}
      <div className="w-[280px]">
        <Card
          className={cn(
            "cursor-pointer transition-transform active:translate-y-1",
            !userProgress && "opacity-90 grayscale-70",
          )}
          onClick={handleCardClick}
        >
          <ProgressRibbon status={userProgress?.status ?? null} />
          <CardHeader className="pb-1">
            <CardTitle className="retro line-clamp-2 text-sm font-semibold">
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { NodeProps } from "@xyflow/react";
import { useRouter } from "next/navigation";
import { Globe, Lock } from "lucide-react";

import { Badge } from "@inochi/ui";

const levelColors: Record<string, string> = {
  beginner:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  intermediate:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  advanced:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  expert:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  elite: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const categoryColors: Record<string, string> = {
  calisthenics:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  gym: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  stretch:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  mobility:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
};

export interface ExerciseNodeData extends Record<string, unknown> {
  _id: Id<"exercises"> | Id<"private_exercises">;
  title: string;
  description: string;
  category: "calisthenics" | "gym" | "stretch" | "mobility";
  level: "beginner" | "intermediate" | "advanced" | "expert" | "elite";
  difficulty: number;
  isPrivate: boolean;
}

export function ExerciseNode({ data }: NodeProps) {
  const nodeData = data as ExerciseNodeData;
  const router = useRouter();

  const detailUrl = nodeData.isPrivate
    ? `/dashboard/exercises/private/${nodeData._id}`
    : `/dashboard/exercises/public/${nodeData._id}`;

  const handleClick = () => {
    router.push(detailUrl);
  };

  return (
    <div
      className="bg-card max-w-[250px] min-w-[200px] cursor-pointer rounded-lg border p-3 shadow-sm transition-shadow hover:shadow-md"
      onClick={handleClick}
    >
      {/* Title */}
      <h3 className="text-card-foreground mb-2 line-clamp-2 text-sm font-semibold">
        {nodeData.title}
      </h3>

      {/* Badges */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <Badge
          className={
            levelColors[nodeData.level] ??
            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
          }
        >
          <span className="text-xs">{nodeData.level}</span>
        </Badge>
        <Badge
          className={
            categoryColors[nodeData.category] ??
            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
          }
        >
          <span className="text-xs">{nodeData.category}</span>
        </Badge>
        {nodeData.isPrivate ? (
          <Badge
            variant="outline"
            className="border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
          >
            <Lock className="mr-1 h-2.5 w-2.5" />
            <span className="text-xs">Private</span>
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
          >
            <Globe className="mr-1 h-2.5 w-2.5" />
            <span className="text-xs">Public</span>
          </Badge>
        )}
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
    </div>
  );
}

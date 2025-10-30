"use client";

import { Id } from "@packages/backend/convex/_generated/dataModel";
import { Doc } from "@packages/backend/convex/_generated/dataModel";
import { Dumbbell, Target } from "lucide-react";
import { Badge } from "@inochi/ui";

interface SkillCardProps {
  skill: Doc<"skills"> & {
    musclesData?: Array<Doc<"muscles">>;
    equipmentData?: Array<Doc<"equipment">>;
  };
}

const levelColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-blue-100 text-blue-800",
  advanced: "bg-purple-100 text-purple-800",
  expert: "bg-orange-100 text-orange-800",
  elite: "bg-red-100 text-red-800",
};

export function SkillCard({ skill }: SkillCardProps) {
  const truncatedDescription =
    skill.description.length > 100
      ? skill.description.substring(0, 100) + "..."
      : skill.description;

  // Show description in 2 lines (approximately 80 chars per line)
  const lines = truncatedDescription.match(/.{1,80}(\s|$)/g) || [
    truncatedDescription,
  ];
  const displayDescription = lines.slice(0, 2).join(" ");

  return (
    <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-card-foreground">
          {skill.title}
        </h3>
        <Badge
          className={levelColors[skill.level] || "bg-gray-100 text-gray-800"}
        >
          {skill.level}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {displayDescription}
      </p>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-muted-foreground">
          Difficulty:
        </span>
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < skill.difficulty ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {skill.difficulty}/10
        </span>
      </div>

      {(skill.musclesData && skill.musclesData.length > 0) ||
      (skill.equipmentData && skill.equipmentData.length > 0) ? (
        <div className="flex flex-wrap gap-2 mt-3">
          {skill.musclesData?.map((muscle) => (
            <Badge
              key={muscle._id}
              variant="outline"
              className="text-xs flex items-center gap-1"
            >
              <Target className="w-3 h-3" />
              {muscle.name}
            </Badge>
          ))}
          {skill.equipmentData?.map((equip) => (
            <Badge
              key={equip._id}
              variant="outline"
              className="text-xs flex items-center gap-1"
            >
              <Dumbbell className="w-3 h-3" />
              {equip.name}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

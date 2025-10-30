"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/common/dropdown-menu";
import { Badge } from "@inochi/ui";
import { Button } from "@inochi/ui/Button";
import { Doc } from "@packages/backend/convex/_generated/dataModel";
import { Dumbbell, MoreVertical, Target } from "lucide-react";
import React, { useMemo } from "react";

interface SkillCardProps {
  skill: Doc<"skills"> & {
    musclesData?: Array<Doc<"muscles">>;
    equipmentData?: Array<Doc<"equipment">>;
  };
  onSuggestEdit?: (skill: Doc<"skills">) => void;
}

const levelColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-blue-100 text-blue-800",
  advanced: "bg-purple-100 text-purple-800",
  expert: "bg-orange-100 text-orange-800",
  elite: "bg-red-100 text-red-800",
};

function SkillCardComponent({ skill, onSuggestEdit }: SkillCardProps) {
  const displayDescription = useMemo(() => {
    // Truncate at word boundary to avoid breaking words
    const maxLength = 150; // Allow more characters since line-clamp-2 will handle display
    if (skill.description.length <= maxLength) {
      return skill.description;
    }

    // Find the last space before maxLength to avoid breaking words
    const truncated = skill.description.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    const cutoff = lastSpace > 0 ? lastSpace : maxLength;

    return skill.description.substring(0, cutoff) + "...";
  }, [skill.description]);
  return (
    <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow relative">
      {/* Header with title and more button */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-card-foreground pr-8 flex-1">
          {skill.title}
        </h3>
        {onSuggestEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSuggestEdit(skill)}>
                Suggest Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Level badge on its own row */}
      <div className="mb-2">
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

export const SkillCard = React.memo(SkillCardComponent);

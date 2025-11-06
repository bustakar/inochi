"use client";

import React, { useMemo, useState } from "react";
import { api } from "@packages/backend/convex/_generated/api";
import { Doc } from "@packages/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Dumbbell, MoreVertical, Target } from "lucide-react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@inochi/ui";

interface SkillCardProps {
  skill:
    | (Doc<"skills"> & {
        musclesData?: Array<Doc<"muscles">>;
        equipmentData?: Array<Doc<"equipment">>;
      })
    | (Doc<"private_skills"> & {
        musclesData?: Array<Doc<"muscles">>;
        equipmentData?: Array<Doc<"equipment">>;
      });
  isPrivate?: boolean;
  onSuggestEdit?: (skill: Doc<"skills">) => void;
  onEditPrivateSkill?: (skill: Doc<"private_skills">) => void;
}

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

function SkillCardComponent({
  skill,
  isPrivate = false,
  onSuggestEdit,
  onEditPrivateSkill,
}: SkillCardProps) {
  const createSubmission = useMutation(
    api.functions.submissions.createSubmission,
  );
  const publicSkills = useQuery(api.functions.skills.getSkills, {});
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleSuggestToPublic = async () => {
    if (!isPrivate || !("userId" in skill)) return;

    setIsSuggesting(true);
    try {
      // Validate prerequisites and variants are public
      const publicSkillIds = new Set(
        publicSkills?.map((s) => s._id) || [],
      );

      const allPrereqsPublic = (skill.prerequisites || []).every((id: string) =>
        publicSkillIds.has(id as Doc<"skills">["_id"]),
      );
      const allVariantsPublic = (skill.variants || []).every((id: string) =>
        publicSkillIds.has(id as Doc<"skills">["_id"]),
      );

      if (!allPrereqsPublic || !allVariantsPublic) {
        toast.error(
          "All prerequisites and variants must be public skills before suggesting to public database.",
        );
        setIsSuggesting(false);
        return;
      }

      await createSubmission({
        title: skill.title,
        description: skill.description,
        level: skill.level as
          | "beginner"
          | "intermediate"
          | "advanced"
          | "expert"
          | "elite",
        difficulty: skill.difficulty,
        muscles: skill.muscles as Doc<"muscles">["_id"][],
        equipment: skill.equipment as Doc<"equipment">["_id"][],
        embedded_videos: skill.embedded_videos.filter(
          (v: string) => v.trim() !== "",
        ),
        prerequisites: skill.prerequisites.filter((id: string) =>
          publicSkillIds.has(id as Doc<"skills">["_id"]),
        ) as Doc<"skills">["_id"][],
        variants: skill.variants.filter((id: string) =>
          publicSkillIds.has(id as Doc<"skills">["_id"]),
        ) as Doc<"skills">["_id"][],
        tips: skill.tips.filter((t: string) => t.trim() !== ""),
        submissionType: "create",
        privateSkillId: skill._id as Doc<"private_skills">["_id"],
      });

      toast.success("Private skill suggested to public database!");
    } catch (error) {
      console.error("Error suggesting skill:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to suggest skill. Please try again.",
      );
    } finally {
      setIsSuggesting(false);
    }
  };

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
    <div className="bg-card relative rounded-lg border p-4 transition-shadow hover:shadow-md">
      {/* Header with title and more button */}
      <div className="mb-2 flex items-start justify-between">
        <h3 className="text-card-foreground flex-1 pr-8 text-lg font-semibold">
          {skill.title}
        </h3>
        {(onSuggestEdit || onEditPrivateSkill) && (
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
              {isPrivate && onEditPrivateSkill ? (
                <DropdownMenuItem
                  onClick={() => onEditPrivateSkill(skill as Doc<"private_skills">)}
                >
                  Edit
                </DropdownMenuItem>
              ) : onSuggestEdit ? (
                <DropdownMenuItem
                  onClick={() => onSuggestEdit(skill as Doc<"skills">)}
                >
                  Suggest Edit
                </DropdownMenuItem>
              ) : null}
              {isPrivate && (
                <DropdownMenuItem
                  onClick={handleSuggestToPublic}
                  disabled={isSuggesting}
                >
                  {isSuggesting ? "Suggesting..." : "Suggest to Public"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Level badge and private indicator */}
      <div className="mb-2 flex items-center gap-2">
        <Badge
          className={
            levelColors[skill.level] ||
            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
          }
        >
          {skill.level}
        </Badge>
        {isPrivate && (
          <Badge variant="outline" className="text-xs">
            Private
          </Badge>
        )}
      </div>

      <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">
        {displayDescription}
      </p>

      <div className="mb-3 flex items-center gap-2">
        <span className="text-muted-foreground text-xs font-medium">
          Difficulty:
        </span>
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${
                i < skill.difficulty ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className="text-muted-foreground text-xs">
          {skill.difficulty}/10
        </span>
      </div>

      {(skill.musclesData && skill.musclesData.length > 0) ||
      (skill.equipmentData && skill.equipmentData.length > 0) ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {skill.musclesData?.map((muscle) => (
            <Badge
              key={muscle._id}
              variant="outline"
              className="flex items-center gap-1 text-xs"
            >
              <Target className="h-3 w-3" />
              {muscle.name}
            </Badge>
          ))}
          {skill.equipmentData?.map((equip) => (
            <Badge
              key={equip._id}
              variant="outline"
              className="flex items-center gap-1 text-xs"
            >
              <Dumbbell className="h-3 w-3" />
              {equip.name}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export const SkillCard = React.memo(SkillCardComponent);

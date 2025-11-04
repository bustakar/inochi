"use client";

import { api } from "@packages/backend/convex/_generated/api";
import type { Doc, Id } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useMemo } from "react";
import { SkillCard } from "./skill-card";

interface SkillsListProps {
  level?: "beginner" | "intermediate" | "advanced" | "expert" | "elite";
  minDifficulty?: number;
  maxDifficulty?: number;
  searchQuery?: string;
  muscleIds?: Id<"muscles">[];
  equipmentIds?: Id<"equipment">[];
  onSuggestEdit?: (
    skill: Doc<"skills"> & {
      musclesData?: Doc<"muscles">[];
      equipmentData?: Doc<"equipment">[];
    },
  ) => void;
}

export function SkillsList({
  level,
  minDifficulty,
  maxDifficulty,
  searchQuery,
  muscleIds,
  equipmentIds,
  onSuggestEdit,
}: SkillsListProps) {
  // Build query args with all filters
  const queryArgs = useMemo(
    () => ({
      level,
      minDifficulty,
      maxDifficulty,
      muscleIds: muscleIds && muscleIds.length > 0 ? muscleIds : undefined,
      equipmentIds:
        equipmentIds && equipmentIds.length > 0 ? equipmentIds : undefined,
    }),
    [level, minDifficulty, maxDifficulty, muscleIds, equipmentIds],
  );

  // Use search if query provided, otherwise use regular getSkills
  const searchSkillsResult = useQuery(
    api.functions.skills.searchSkills,
    searchQuery ? { searchQuery, ...queryArgs } : "skip",
  );
  const allSkillsResult = useQuery(
    api.functions.skills.getSkills,
    !searchQuery ? queryArgs : "skip",
  );
  const skills = searchQuery ? searchSkillsResult : allSkillsResult;

  if (skills === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading skills...</p>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">No skills found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {skills.map((skill) => (
        <SkillCard
          key={skill._id}
          skill={skill}
          onSuggestEdit={onSuggestEdit}
        />
      ))}
    </div>
  );
}

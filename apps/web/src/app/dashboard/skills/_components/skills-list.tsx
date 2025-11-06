"use client";

import { useMemo } from "react";
import { api } from "@packages/backend/convex/_generated/api";
import { Doc, Id } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";

import { SkillCard } from "./skill-card";

type SkillFilter = "all" | "public" | "private";

interface SkillsListProps {
  filter: SkillFilter;
  level?: "beginner" | "intermediate" | "advanced" | "expert" | "elite";
  minDifficulty?: number;
  maxDifficulty?: number;
  searchQuery?: string;
  muscleIds?: Id<"muscles">[];
  equipmentIds?: Id<"equipment">[];
  onSuggestEdit: (skill: Doc<"skills">) => void;
  onEditPrivateSkill: (skill: Doc<"private_skills">) => void;
}

export function SkillsList({
  filter,
  level,
  minDifficulty,
  maxDifficulty,
  searchQuery,
  muscleIds,
  equipmentIds,
  onSuggestEdit,
  onEditPrivateSkill,
}: SkillsListProps) {
  // Build query args with all filters
  const queryArgs = useMemo(
    () => ({
      type: filter as "all" | "public" | "private",
      level,
      minDifficulty,
      maxDifficulty,
      muscleIds: muscleIds && muscleIds.length > 0 ? muscleIds : undefined,
      equipmentIds:
        equipmentIds && equipmentIds.length > 0 ? equipmentIds : undefined,
      searchQuery: searchQuery?.trim() || undefined,
    }),
    [
      filter,
      level,
      minDifficulty,
      maxDifficulty,
      muscleIds,
      equipmentIds,
      searchQuery,
    ],
  );

  // Use unified getAllSkills query
  const skills = useQuery(api.functions.skills.getAllSkills, queryArgs);

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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {skills.map((skill) => (
        <SkillCard
          key={skill._id}
          skill={skill as any}
          isPrivate={skill.isPrivate}
          onSuggestEdit={onSuggestEdit}
          onEditPrivateSkill={onEditPrivateSkill}
        />
      ))}
    </div>
  );
}

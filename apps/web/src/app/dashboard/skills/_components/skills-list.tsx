"use client";

import { api } from "@packages/backend/convex/_generated/api";
import { Doc, Id } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { SkillCard } from "./skill-card";

interface SkillsListProps {
  level?: "beginner" | "intermediate" | "advanced" | "expert" | "elite";
  minDifficulty?: number;
  maxDifficulty?: number;
  searchQuery?: string;
  muscleIds?: Id<"muscles">[];
  equipmentIds?: Id<"equipment">[];
}

export function SkillsList({
  level,
  minDifficulty,
  maxDifficulty,
  searchQuery,
  muscleIds,
  equipmentIds,
}: SkillsListProps) {
  // Use search if query provided, otherwise use regular getSkills
  const searchSkillsResult = useQuery(
    api.skills.searchSkills,
    searchQuery ? { searchQuery, level, minDifficulty, maxDifficulty } : "skip",
  );
  const allSkillsResult = useQuery(
    api.skills.getSkills,
    !searchQuery ? { level, minDifficulty, maxDifficulty } : "skip",
  );
  const skills = searchQuery ? searchSkillsResult : allSkillsResult;

  const muscles = useQuery(api.skills.getMuscles, {});
  const equipment = useQuery(api.skills.getEquipment, {});

  if (!skills || !muscles || !equipment) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading skills...</p>
      </div>
    );
  }

  // Filter by muscles and equipment if provided
  let filteredSkills = skills;
  if (muscleIds && muscleIds.length > 0) {
    filteredSkills = filteredSkills.filter((skill: Doc<"skills">) =>
      skill.muscles.some((id) => muscleIds.includes(id)),
    );
  }
  if (equipmentIds && equipmentIds.length > 0) {
    filteredSkills = filteredSkills.filter((skill: Doc<"skills">) =>
      skill.equipment.some((id) => equipmentIds.includes(id)),
    );
  }

  // Enrich skills with muscle and equipment data
  const enrichedSkills = filteredSkills.map((skill: Doc<"skills">) => ({
    ...skill,
    musclesData: skill.muscles
      .map((id) => muscles.find((m: Doc<"muscles">) => m._id === id))
      .filter((m): m is Doc<"muscles"> => m !== undefined),
    equipmentData: skill.equipment
      .map((id) => equipment.find((e: Doc<"equipment">) => e._id === id))
      .filter((e): e is Doc<"equipment"> => e !== undefined),
  }));

  if (enrichedSkills.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">No skills found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {enrichedSkills.map((skill: Doc<"skills"> & {
        musclesData?: Array<Doc<"muscles">>;
        equipmentData?: Array<Doc<"equipment">>;
      }) => (
        <SkillCard key={skill._id} skill={skill} />
      ))}
    </div>
  );
}


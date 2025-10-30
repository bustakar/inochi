"use client";

import { api } from "@packages/backend/convex/_generated/api";
import { Doc, Id } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { SkillCard } from "./SkillCard";

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
  const skills = useQuery(
    searchQuery
      ? api.skills.searchSkills
      : api.skills.getSkills,
    searchQuery
      ? {
          searchQuery,
          level,
          minDifficulty,
          maxDifficulty,
        }
      : {
          level,
          minDifficulty,
          maxDifficulty,
        },
  );

  const muscles = useQuery(api.skills.getMuscles);
  const equipment = useQuery(api.skills.getEquipment);

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
    filteredSkills = filteredSkills.filter((skill) =>
      skill.muscles.some((id) => muscleIds.includes(id)),
    );
  }
  if (equipmentIds && equipmentIds.length > 0) {
    filteredSkills = filteredSkills.filter((skill) =>
      skill.equipment.some((id) => equipmentIds.includes(id)),
    );
  }

  // Enrich skills with muscle and equipment data
  const enrichedSkills = filteredSkills.map((skill) => ({
    ...skill,
    musclesData: skill.muscles
      .map((id) => muscles.find((m) => m._id === id))
      .filter((m): m is Doc<"muscles"> => m !== undefined),
    equipmentData: skill.equipment
      .map((id) => equipment.find((e) => e._id === id))
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
      {enrichedSkills.map((skill) => (
        <SkillCard key={skill._id} skill={skill} />
      ))}
    </div>
  );
}


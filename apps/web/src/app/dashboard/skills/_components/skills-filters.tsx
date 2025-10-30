"use client";

import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useState } from "react";
import { Input } from "@inochi/ui/Input";
import { Label } from "@inochi/ui/Label";

interface SkillsFiltersProps {
  level?: "beginner" | "intermediate" | "advanced" | "expert" | "elite";
  minDifficulty?: number;
  maxDifficulty?: number;
  muscleIds?: Id<"muscles">[];
  equipmentIds?: Id<"equipment">[];
  onLevelChange: (level?: string) => void;
  onDifficultyChange: (min?: number, max?: number) => void;
  onMusclesChange: (muscleIds: Id<"muscles">[]) => void;
  onEquipmentChange: (equipmentIds: Id<"equipment">[]) => void;
}

export function SkillsFilters({
  level,
  minDifficulty,
  maxDifficulty,
  muscleIds = [],
  equipmentIds = [],
  onLevelChange,
  onDifficultyChange,
  onMusclesChange,
  onEquipmentChange,
}: SkillsFiltersProps) {
  const muscles = useQuery(api.skills.getMuscles);
  const equipment = useQuery(api.skills.getEquipment);
  const [localMinDifficulty, setLocalMinDifficulty] = useState(
    minDifficulty?.toString() || "",
  );
  const [localMaxDifficulty, setLocalMaxDifficulty] = useState(
    maxDifficulty?.toString() || "",
  );

  const handleDifficultyBlur = () => {
    const min = localMinDifficulty ? parseInt(localMinDifficulty) : undefined;
    const max = localMaxDifficulty ? parseInt(localMaxDifficulty) : undefined;
    if (min !== undefined && (min < 1 || min > 10)) return;
    if (max !== undefined && (max < 1 || max > 10)) return;
    if (min !== undefined && max !== undefined && min > max) return;
    onDifficultyChange(min, max);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold">Filters</h3>

      {/* Level Filter */}
      <div>
        <Label htmlFor="level">Level</Label>
        <select
          id="level"
          value={level || ""}
          onChange={(e) => onLevelChange(e.target.value || undefined)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
          <option value="elite">Elite</option>
        </select>
      </div>

      {/* Difficulty Range */}
      <div className="space-y-2">
        <Label>Difficulty Range</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="min-difficulty" className="text-xs">
              Min
            </Label>
            <Input
              id="min-difficulty"
              type="number"
              min="1"
              max="10"
              placeholder="1"
              value={localMinDifficulty}
              onChange={(e) => setLocalMinDifficulty(e.target.value)}
              onBlur={handleDifficultyBlur}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="max-difficulty" className="text-xs">
              Max
            </Label>
            <Input
              id="max-difficulty"
              type="number"
              min="1"
              max="10"
              placeholder="10"
              value={localMaxDifficulty}
              onChange={(e) => setLocalMaxDifficulty(e.target.value)}
              onBlur={handleDifficultyBlur}
            />
          </div>
        </div>
      </div>

      {/* Muscles Filter */}
      {muscles && (
        <div>
          <Label>Muscles</Label>
          <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
            {muscles.map((muscle: { _id: Id<"muscles">; name: string }) => (
              <label
                key={muscle._id}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={muscleIds.includes(muscle._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onMusclesChange([...muscleIds, muscle._id]);
                    } else {
                      onMusclesChange(
                        muscleIds.filter((id) => id !== muscle._id),
                      );
                    }
                  }}
                  className="rounded border-input"
                />
                <span>{muscle.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Equipment Filter */}
      {equipment && (
        <div>
          <Label>Equipment</Label>
          <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
            {equipment.map((equip: { _id: Id<"equipment">; name: string }) => (
              <label
                key={equip._id}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={equipmentIds.includes(equip._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onEquipmentChange([...equipmentIds, equip._id]);
                    } else {
                      onEquipmentChange(
                        equipmentIds.filter((id) => id !== equip._id),
                      );
                    }
                  }}
                  className="rounded border-input"
                />
                <span>{equip.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

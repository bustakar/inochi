"use client";

import { Input } from "@inochi/ui/Input";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { Search } from "lucide-react";
import { useState } from "react";
import { CreateSkillDialog } from "./_components/create-skill-dialog";
import { SkillsFilters } from "./_components/skills-filters";
import { SkillsList } from "./_components/skills-list";

export default function SkillsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [level, setLevel] = useState<
    "beginner" | "intermediate" | "advanced" | "expert" | "elite" | undefined
  >(undefined);
  const [minDifficulty, setMinDifficulty] = useState<number | undefined>(
    undefined,
  );
  const [maxDifficulty, setMaxDifficulty] = useState<number | undefined>(
    undefined,
  );
  const [muscleIds, setMuscleIds] = useState<Id<"muscles">[]>([]);
  const [equipmentIds, setEquipmentIds] = useState<Id<"equipment">[]>([]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Skills</h1>
        <CreateSkillDialog />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Search skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <SkillsFilters
            level={level}
            minDifficulty={minDifficulty}
            maxDifficulty={maxDifficulty}
            muscleIds={muscleIds}
            equipmentIds={equipmentIds}
            onLevelChange={(newLevel) =>
              setLevel(
                newLevel as
                  | "beginner"
                  | "intermediate"
                  | "advanced"
                  | "expert"
                  | "elite"
                  | undefined,
              )
            }
            onDifficultyChange={(min, max) => {
              setMinDifficulty(min);
              setMaxDifficulty(max);
            }}
            onMusclesChange={setMuscleIds}
            onEquipmentChange={setEquipmentIds}
          />
        </div>

        {/* Skills List */}
        <div className="lg:col-span-3">
          <SkillsList
            level={level}
            minDifficulty={minDifficulty}
            maxDifficulty={maxDifficulty}
            searchQuery={searchQuery || undefined}
            muscleIds={muscleIds.length > 0 ? muscleIds : undefined}
            equipmentIds={equipmentIds.length > 0 ? equipmentIds : undefined}
          />
        </div>
      </div>
    </div>
  );
}

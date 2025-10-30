"use client";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/common/dropdown-menu";
import { Badge } from "@inochi/ui";
import { Button } from "@inochi/ui/Button";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { ChevronDown, Dumbbell, Gauge, Target, TrendingUp } from "lucide-react";

interface SkillsFiltersHorizontalProps {
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

export function SkillsFiltersHorizontal({
  level,
  minDifficulty,
  maxDifficulty,
  muscleIds = [],
  equipmentIds = [],
  onLevelChange,
  onDifficultyChange,
  onMusclesChange,
  onEquipmentChange,
}: SkillsFiltersHorizontalProps) {
  const muscles = useQuery(api.skills.getMuscles, {});
  const equipment = useQuery(api.skills.getEquipment, {});

  const levelLabel = level
    ? level.charAt(0).toUpperCase() + level.slice(1)
    : "All Levels";
  const difficultyLabel =
    minDifficulty || maxDifficulty
      ? `${minDifficulty || 1}-${maxDifficulty || 10}`
      : "All";
  const musclesLabel =
    muscleIds.length > 0 ? `${muscleIds.length} selected` : "All";
  const equipmentLabel =
    equipmentIds.length > 0 ? `${equipmentIds.length} selected` : "All";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Level Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <TrendingUp className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{levelLabel}</span>
            {level && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                1
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Level</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={!level}
            onCheckedChange={(checked) => {
              if (checked) onLevelChange(undefined);
            }}
          >
            All Levels
          </DropdownMenuCheckboxItem>
          {["beginner", "intermediate", "advanced", "expert", "elite"].map(
            (lvl) => (
              <DropdownMenuCheckboxItem
                key={lvl}
                checked={level === lvl}
                onCheckedChange={(checked) => {
                  onLevelChange(checked ? lvl : undefined);
                }}
              >
                {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
              </DropdownMenuCheckboxItem>
            ),
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Difficulty Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <Gauge className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{difficultyLabel}</span>
            {(minDifficulty || maxDifficulty) && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                1
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Difficulty Range</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="p-2 space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="10"
                placeholder="Min"
                value={minDifficulty || ""}
                onChange={(e) => {
                  const val = e.target.value
                    ? parseInt(e.target.value)
                    : undefined;
                  if (!val || (val >= 1 && val <= 10)) {
                    onDifficultyChange(val, maxDifficulty);
                  }
                }}
                className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
              />
              <input
                type="number"
                min="1"
                max="10"
                placeholder="Max"
                value={maxDifficulty || ""}
                onChange={(e) => {
                  const val = e.target.value
                    ? parseInt(e.target.value)
                    : undefined;
                  if (!val || (val >= 1 && val <= 10)) {
                    onDifficultyChange(minDifficulty, val);
                  }
                }}
                className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => onDifficultyChange(undefined, undefined)}
            >
              Clear
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Muscles Filter */}
      {muscles && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Target className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{musclesLabel}</span>
              {muscleIds.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {muscleIds.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-64 max-h-96 overflow-y-auto"
          >
            <DropdownMenuLabel>Muscles</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {muscles.map((muscle: { _id: Id<"muscles">; name: string }) => (
              <DropdownMenuCheckboxItem
                key={muscle._id}
                checked={muscleIds.includes(muscle._id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onMusclesChange([...muscleIds, muscle._id]);
                  } else {
                    onMusclesChange(
                      muscleIds.filter((id) => id !== muscle._id),
                    );
                  }
                }}
              >
                {muscle.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Equipment Filter */}
      {equipment && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Dumbbell className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{equipmentLabel}</span>
              {equipmentIds.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {equipmentIds.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-64 max-h-96 overflow-y-auto"
          >
            <DropdownMenuLabel>Equipment</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {equipment.map((equip: { _id: Id<"equipment">; name: string }) => (
              <DropdownMenuCheckboxItem
                key={equip._id}
                checked={equipmentIds.includes(equip._id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onEquipmentChange([...equipmentIds, equip._id]);
                  } else {
                    onEquipmentChange(
                      equipmentIds.filter((id) => id !== equip._id),
                    );
                  }
                }}
              >
                {equip.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

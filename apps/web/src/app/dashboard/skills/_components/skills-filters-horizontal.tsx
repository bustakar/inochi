"use client";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/common/dropdown-menu";
import { Button } from "@inochi/ui/Button";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { ChevronDown, Dumbbell, Gauge, Target, TrendingUp } from "lucide-react";
import { useState } from "react";

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
  const muscles = useQuery(api.functions.skills.getMuscles, {});
  const equipment = useQuery(api.functions.skills.getEquipment, {});
  const [musclesOpen, setMusclesOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);

  const levelLabel = level
    ? level.charAt(0).toUpperCase() + level.slice(1)
    : "All Levels";

  const difficultyLabel = (() => {
    if (minDifficulty !== undefined && maxDifficulty !== undefined) {
      return `${minDifficulty}-${maxDifficulty}`;
    }
    if (minDifficulty !== undefined) {
      return `${minDifficulty}+`;
    }
    if (maxDifficulty !== undefined) {
      return `≤${maxDifficulty}`;
    }
    return "All";
  })();

  const musclesLabel = "Muscles";
  const equipmentLabel = "Equipment";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Level Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={level ? "default" : "outline"}
            size="sm"
            className="h-9"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{levelLabel}</span>
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
          <Button
            variant={
              minDifficulty !== undefined || maxDifficulty !== undefined
                ? "default"
                : "outline"
            }
            size="sm"
            className="h-9"
          >
            <Gauge className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{difficultyLabel}</span>
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
                  if (!e.target.value) {
                    // Allow clearing the value
                    onDifficultyChange(undefined, maxDifficulty);
                    return;
                  }
                  const val = parseInt(e.target.value);
                  if (isNaN(val) || val < 1 || val > 10) {
                    return;
                  }
                  // Ensure min doesn't exceed max if max is set
                  const currentMax = maxDifficulty;
                  if (currentMax !== undefined && val > currentMax) {
                    // Don't update if min would be greater than max
                    return;
                  }
                  onDifficultyChange(val, currentMax);
                }}
                className="w-full rounded-md border border-input bg-background text-foreground px-2 py-1 text-sm placeholder:text-muted-foreground"
              />
              <input
                type="number"
                min="1"
                max="10"
                placeholder="Max"
                value={maxDifficulty || ""}
                onChange={(e) => {
                  if (!e.target.value) {
                    // Allow clearing the value
                    onDifficultyChange(minDifficulty, undefined);
                    return;
                  }
                  const val = parseInt(e.target.value);
                  if (isNaN(val) || val < 1 || val > 10) {
                    return;
                  }
                  // Ensure max isn't less than min if min is set
                  const currentMin = minDifficulty;
                  if (currentMin !== undefined && val < currentMin) {
                    // Don't update if max would be less than min
                    return;
                  }
                  onDifficultyChange(currentMin, val);
                }}
                className="w-full rounded-md border border-input bg-background text-foreground px-2 py-1 text-sm placeholder:text-muted-foreground"
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
        <DropdownMenu
          open={musclesOpen}
          onOpenChange={setMusclesOpen}
          modal={false}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant={muscleIds.length > 0 ? "default" : "outline"}
              size="sm"
              className="h-9"
            >
              <Target className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{musclesLabel}</span>
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-64 max-h-96 overflow-y-auto"
            onCloseAutoFocus={(e) => e.preventDefault()}
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
                onSelect={(e) => {
                  e.preventDefault();
                }}
              >
                {muscle.name}
              </DropdownMenuCheckboxItem>
            ))}
            {muscleIds.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      onMusclesChange([]);
                    }}
                  >
                    Clear Selection
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Equipment Filter */}
      {equipment && (
        <DropdownMenu
          open={equipmentOpen}
          onOpenChange={setEquipmentOpen}
          modal={false}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant={equipmentIds.length > 0 ? "default" : "outline"}
              size="sm"
              className="h-9"
            >
              <Dumbbell className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{equipmentLabel}</span>
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-64 max-h-96 overflow-y-auto"
            onCloseAutoFocus={(e) => e.preventDefault()}
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
                onSelect={(e) => {
                  e.preventDefault();
                }}
              >
                {equip.name}
              </DropdownMenuCheckboxItem>
            ))}
            {equipmentIds.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      onEquipmentChange([]);
                    }}
                  >
                    Clear Selection
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

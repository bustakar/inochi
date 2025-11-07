"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import {
  ChevronDown,
  ChevronRight,
  Dumbbell,
  Gauge,
  Target,
  TrendingUp,
} from "lucide-react";

import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Label,
} from "@inochi/ui";

interface Muscle {
  _id: Id<"muscles">;
  name: string;
  muscleGroup?: string;
}

interface MusclesFilterDropdownProps {
  muscles: Muscle[];
  muscleIds: Id<"muscles">[];
  onMusclesChange: (muscleIds: Id<"muscles">[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function MusclesFilterDropdown({
  muscles,
  muscleIds,
  onMusclesChange,
  open,
  onOpenChange,
}: MusclesFilterDropdownProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group muscles by muscleGroup
  const groupedMuscles = useMemo(() => {
    if (!muscles) return new Map<string, Muscle[]>();

    const groups = new Map<string, Muscle[]>();
    for (const muscle of muscles) {
      const group = muscle.muscleGroup || "Other";
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(muscle);
    }

    // Sort groups and muscles within groups
    const sortedGroups = new Map(
      Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b)),
    );
    for (const [group, groupMuscles] of sortedGroups.entries()) {
      sortedGroups.set(
        group,
        groupMuscles.sort((a, b) => a.name.localeCompare(b.name)),
      );
    }

    return sortedGroups;
  }, [muscles]);

  const handleToggleMuscle = (muscleId: Id<"muscles">) => {
    if (muscleIds.includes(muscleId)) {
      onMusclesChange(muscleIds.filter((id) => id !== muscleId));
    } else {
      onMusclesChange([...muscleIds, muscleId]);
    }
  };

  const handleToggleGroup = (group: string, groupMuscles: Muscle[]) => {
    const groupMuscleIds = groupMuscles.map((m) => m._id);
    const allSelected = groupMuscleIds.every((id) => muscleIds.includes(id));

    if (allSelected) {
      // Deselect all muscles in the group
      onMusclesChange(muscleIds.filter((id) => !groupMuscleIds.includes(id)));
    } else {
      // Select all muscles in the group
      const newSelection = [...muscleIds];
      for (const id of groupMuscleIds) {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      }
      onMusclesChange(newSelection);
    }
  };

  const getGroupSelectionState = (groupMuscles: Muscle[]) => {
    const groupMuscleIds = groupMuscles.map((m) => m._id);
    const selectedCount = groupMuscleIds.filter((id) =>
      muscleIds.includes(id),
    ).length;

    if (selectedCount === 0) return "none";
    if (selectedCount === groupMuscleIds.length) return "all";
    return "some";
  };

  const toggleGroupExpansion = (group: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  };

  // Expand groups that have selected muscles
  useEffect(() => {
    if (open && muscleIds.length > 0) {
      const groupsWithSelections = new Set<string>();
      for (const [group, groupMuscles] of groupedMuscles.entries()) {
        const hasSelected = groupMuscles.some((m) => muscleIds.includes(m._id));
        if (hasSelected) {
          groupsWithSelections.add(group);
        }
      }
      setExpandedGroups(groupsWithSelections);
    } else if (open) {
      // If no selections, keep all collapsed
      setExpandedGroups(new Set());
    }
  }, [open, groupedMuscles, muscleIds]);

  const musclesLabel =
    muscleIds.length > 0 ? `Muscles (${muscleIds.length})` : "Muscles";

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={muscleIds.length > 0 ? "default" : "outline"}
          size="sm"
          className="h-9"
        >
          <Target className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{musclesLabel}</span>
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-96 w-80 overflow-y-auto"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="py-0">Muscles</DropdownMenuLabel>
          {muscleIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                onMusclesChange([]);
              }}
            >
              Clear
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="space-y-1 p-1">
          {Array.from(groupedMuscles.entries()).map(([group, groupMuscles]) => {
            const isExpanded = expandedGroups.has(group);
            const selectionState = getGroupSelectionState(groupMuscles);
            const isGroupChecked = selectionState === "all";
            const isGroupIndeterminate = selectionState === "some";

            return (
              <div key={group} className="space-y-1">
                <div className="flex items-center gap-1.5 px-1 py-0.5">
                  <button
                    type="button"
                    onClick={() => toggleGroupExpansion(group)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`${isExpanded ? "Collapse" : "Expand"} ${group}`}
                  >
                    {isExpanded ? (
                      <ChevronDown className="size-3.5" />
                    ) : (
                      <ChevronRight className="size-3.5" />
                    )}
                  </button>
                  <Checkbox
                    id={`group-${group}`}
                    checked={
                      isGroupIndeterminate ? "indeterminate" : isGroupChecked
                    }
                    onCheckedChange={() =>
                      handleToggleGroup(group, groupMuscles)
                    }
                    className="h-4 w-4"
                  />
                  <Label
                    htmlFor={`group-${group}`}
                    className="flex-1 cursor-pointer text-sm font-medium"
                  >
                    {group.charAt(0).toUpperCase() + group.slice(1)}
                  </Label>
                  <span className="text-muted-foreground text-xs">
                    ({groupMuscles.length})
                  </span>
                </div>
                {isExpanded && (
                  <div className="ml-6 space-y-0.5">
                    {groupMuscles.map((muscle) => {
                      const isSelected = muscleIds.includes(muscle._id);
                      return (
                        <div
                          key={muscle._id}
                          className="flex items-center gap-2 px-1 py-0.5"
                        >
                          <Checkbox
                            id={muscle._id}
                            checked={isSelected}
                            onCheckedChange={() =>
                              handleToggleMuscle(muscle._id)
                            }
                            className="h-4 w-4"
                          />
                          <Label
                            htmlFor={muscle._id}
                            className="flex-1 cursor-pointer text-sm"
                          >
                            {muscle.name}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
            <TrendingUp className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{levelLabel}</span>
            <ChevronDown className="ml-2 h-4 w-4" />
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
            <Gauge className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{difficultyLabel}</span>
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Difficulty Range</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="space-y-2 p-2">
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
                className="border-input bg-background text-foreground placeholder:text-muted-foreground w-full rounded-md border px-2 py-1 text-sm"
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
                className="border-input bg-background text-foreground placeholder:text-muted-foreground w-full rounded-md border px-2 py-1 text-sm"
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
        <MusclesFilterDropdown
          muscles={muscles as Muscle[]}
          muscleIds={muscleIds}
          onMusclesChange={onMusclesChange}
          open={musclesOpen}
          onOpenChange={setMusclesOpen}
        />
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
              <Dumbbell className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{equipmentLabel}</span>
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="max-h-96 w-64 overflow-y-auto"
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

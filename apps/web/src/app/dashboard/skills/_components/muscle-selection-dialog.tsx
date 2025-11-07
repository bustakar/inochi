"use client";

import * as React from "react";
import { useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@inochi/ui";

interface Muscle {
  _id: string;
  name: string;
  muscleGroup?: string;
}

interface MuscleSelectionDialogProps {
  open: boolean;
  muscles: Muscle[];
  initialMuscleIds: string[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (muscleIds: string[]) => void;
}

export function MuscleSelectionDialog({
  open,
  muscles,
  initialMuscleIds,
  onOpenChange,
  onConfirm,
}: MuscleSelectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscleIds, setSelectedMuscleIds] =
    useState<string[]>(initialMuscleIds);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(),
  );

  // Group muscles by muscleGroup
  const groupedMuscles = React.useMemo(() => {
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

  // Filter muscles based on search query
  const filteredGroupedMuscles = React.useMemo(() => {
    if (!searchQuery.trim()) return groupedMuscles;

    const query = searchQuery.toLowerCase();
    const filtered = new Map<string, Muscle[]>();

    for (const [group, groupMuscles] of groupedMuscles.entries()) {
      const matchingMuscles = groupMuscles.filter(
        (muscle) =>
          muscle.name.toLowerCase().includes(query) ||
          group.toLowerCase().includes(query),
      );
      if (matchingMuscles.length > 0) {
        filtered.set(group, matchingMuscles);
      }
    }

    return filtered;
  }, [groupedMuscles, searchQuery]);

  const handleToggleMuscle = (muscleId: string) => {
    setSelectedMuscleIds((prev) => {
      const selectedMuscleIds = prev ?? [];
      if (selectedMuscleIds.includes(muscleId)) {
        return selectedMuscleIds.filter((id) => id !== muscleId);
      } else {
        return [...selectedMuscleIds, muscleId];
      }
    });
  };

  const handleToggleGroup = (group: string, groupMuscles: Muscle[]) => {
    const groupMuscleIds = groupMuscles.map((m) => m._id);
    const allSelected = groupMuscleIds.every((id) =>
      selectedMuscleIds.includes(id),
    );

    setSelectedMuscleIds((prev) => {
      const selectedMuscleIds = prev ?? [];
      if (allSelected) {
        // Deselect all muscles in the group
        return selectedMuscleIds.filter((id) => !groupMuscleIds.includes(id));
      } else {
        // Select all muscles in the group
        const newSelection = [...selectedMuscleIds];
        for (const id of groupMuscleIds) {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        }
        return newSelection;
      }
    });
  };

  const getGroupSelectionState = (groupMuscles: Muscle[]) => {
    const groupMuscleIds = groupMuscles.map((m) => m._id);
    const selectedCount = groupMuscleIds.filter((id) =>
      selectedMuscleIds.includes(id),
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

  const handleConfirm = () => {
    onConfirm(selectedMuscleIds);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedMuscleIds(initialMuscleIds);
    onOpenChange(false);
  };

  // Expand all groups when dialog opens
  React.useEffect(() => {
    if (open) {
      setExpandedGroups(new Set(groupedMuscles.keys()));
    }
  }, [open, groupedMuscles]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Muscles</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search muscles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex-1 overflow-y-auto rounded-md border p-4 space-y-4">
          {filteredGroupedMuscles.size === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              {searchQuery ? "No muscles found" : "No muscles available"}
            </p>
          ) : (
            Array.from(filteredGroupedMuscles.entries()).map(
              ([group, groupMuscles]) => {
                const isExpanded = expandedGroups.has(group);
                const selectionState = getGroupSelectionState(groupMuscles);
                const isGroupChecked = selectionState === "all";
                const isGroupIndeterminate = selectionState === "some";

                return (
                  <div key={group} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleGroupExpansion(group)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${group}`}
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
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
                      />
                      <Label
                        htmlFor={`group-${group}`}
                        className="font-medium cursor-pointer"
                      >
                        {group.charAt(0).toUpperCase() + group.slice(1)}
                      </Label>
                      <span className="text-muted-foreground text-sm">
                        ({groupMuscles.length})
                      </span>
                    </div>
                    {isExpanded && (
                      <div className="ml-6 space-y-1.5">
                        {groupMuscles.map((muscle) => {
                          const isSelected =
                            selectedMuscleIds?.includes(muscle._id) ?? false;
                          return (
                            <div
                              key={muscle._id}
                              className="flex items-center gap-2 pl-6"
                            >
                              <Checkbox
                                id={muscle._id}
                                checked={isSelected}
                                onCheckedChange={() =>
                                  handleToggleMuscle(muscle._id)
                                }
                              />
                              <Label
                                htmlFor={muscle._id}
                                className="cursor-pointer"
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
              },
            )
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

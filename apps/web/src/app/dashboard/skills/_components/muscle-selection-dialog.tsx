"use client";

import * as React from "react";
import { useState } from "react";
import { Search } from "lucide-react";

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

  const filteredMuscles = React.useMemo(() => {
    if (!muscles) return [];
    if (!searchQuery.trim()) return muscles;

    const query = searchQuery.toLowerCase();
    return muscles.filter((muscle) =>
      muscle.name.toLowerCase().includes(query),
    );
  }, [muscles, searchQuery]);

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

  const handleConfirm = () => {
    onConfirm(selectedMuscleIds);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedMuscleIds(initialMuscleIds);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
        <div className="grid grid-cols-2 gap-2 rounded-md border p-2">
          {filteredMuscles.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              {searchQuery ? "No muscles found" : "No muscles available"}
            </p>
          ) : (
            filteredMuscles.map((muscle) => {
              const isSelected =
                selectedMuscleIds?.includes(muscle._id) ?? false;
              return (
                <div key={muscle._id} className="flex items-center gap-3">
                  <Checkbox
                    id={muscle._id}
                    checked={isSelected}
                    onCheckedChange={() => handleToggleMuscle(muscle._id)}
                  />
                  <Label htmlFor={muscle._id}>{muscle.name}</Label>
                </div>
              );
            })
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

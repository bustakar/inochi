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

interface Equipment {
  _id: string;
  name: string;
}

interface EquipmentSelectionDialogProps {
  open: boolean;
  equipment: Equipment[];
  initialEquipmentIds: string[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (equipmentIds: string[]) => void;
}

export function EquipmentSelectionDialog({
  open,
  equipment,
  initialEquipmentIds,
  onOpenChange,
  onConfirm,
}: EquipmentSelectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEquipmentIds, setSelectedEquipmentIds] =
    useState<string[]>(initialEquipmentIds);

  const filteredEquipment = React.useMemo(() => {
    if (!equipment) return [];
    if (!searchQuery.trim()) return equipment;

    const query = searchQuery.toLowerCase();
    return equipment.filter((item) => item.name.toLowerCase().includes(query));
  }, [equipment, searchQuery]);

  const handleToggleEquipment = (equipmentId: string) => {
    setSelectedEquipmentIds((prev) => {
      const selectedEquipmentIds = prev ?? [];
      if (selectedEquipmentIds.includes(equipmentId)) {
        return selectedEquipmentIds.filter((id) => id !== equipmentId);
      } else {
        return [...selectedEquipmentIds, equipmentId];
      }
    });
  };

  const handleConfirm = () => {
    onConfirm(selectedEquipmentIds);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedEquipmentIds(initialEquipmentIds);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Equipment</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-md border p-2">
          {filteredEquipment.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              {searchQuery ? "No equipment found" : "No equipment available"}
            </p>
          ) : (
            filteredEquipment.map((item) => {
              const isSelected =
                selectedEquipmentIds?.includes(item._id) ?? false;
              return (
                <div key={item._id} className="flex items-center gap-3">
                  <Checkbox
                    id={item._id}
                    checked={isSelected}
                    onCheckedChange={() => handleToggleEquipment(item._id)}
                  />
                  <Label htmlFor={item._id}>{item.name}</Label>
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

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

interface Skill {
  _id: string;
  title: string;
}

interface SkillSelectionDialogProps {
  open: boolean;
  skills: Skill[];
  initialSkillIds: string[];
  title: string;
  excludeIds?: string[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (skillIds: string[]) => void;
}

export function SkillSelectionDialog({
  open,
  skills,
  initialSkillIds,
  title,
  excludeIds = [],
  onOpenChange,
  onConfirm,
}: SkillSelectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkillIds, setSelectedSkillIds] =
    useState<string[]>(initialSkillIds);

  const filteredSkills = React.useMemo(() => {
    if (!skills) return [];
    const availableSkills = skills.filter(
      (skill) => !excludeIds.includes(skill._id),
    );
    if (!searchQuery.trim()) return availableSkills;

    const query = searchQuery.toLowerCase();
    return availableSkills.filter((skill) =>
      skill.title.toLowerCase().includes(query),
    );
  }, [skills, searchQuery, excludeIds]);

  const handleToggleSkill = (skillId: string) => {
    setSelectedSkillIds((prev) => {
      const selectedSkillIds = prev ?? [];
      if (selectedSkillIds.includes(skillId)) {
        return selectedSkillIds.filter((id) => id !== skillId);
      } else {
        return [...selectedSkillIds, skillId];
      }
    });
  };

  const handleConfirm = () => {
    onConfirm(selectedSkillIds);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedSkillIds(initialSkillIds);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-md border p-2">
          {filteredSkills.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              {searchQuery ? "No skills found" : "No skills available"}
            </p>
          ) : (
            filteredSkills.map((skill) => {
              const isSelected = selectedSkillIds?.includes(skill._id) ?? false;
              return (
                <div key={skill._id} className="flex items-center gap-3">
                  <Checkbox
                    id={skill._id}
                    checked={isSelected}
                    onCheckedChange={() => handleToggleSkill(skill._id)}
                  />
                  <Label htmlFor={skill._id}>{skill.title}</Label>
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

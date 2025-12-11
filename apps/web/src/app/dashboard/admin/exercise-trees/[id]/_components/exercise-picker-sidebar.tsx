"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { ExerciseLevel } from "@packages/backend/convex/validators/validators";
import { useEffect, useMemo, useState } from "react";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Search } from "lucide-react";

import {
  BitCard,
  BitCardContent,
  BitCardHeader,
  BitCardTitle,
  HealthBar,
  Input,
  ScrollArea,
} from "@inochi/ui";

import { exerciseLevelHealthBarColors } from "../../../../../../utils/exercise-utils";

interface ExercisePickerSidebarProps {
  onExerciseSelect: (exercise: {
    _id: Id<"exercises">;
    title: string;
    description: string;
    level: ExerciseLevel;
    difficulty: number;
  }) => void;
}

export function ExercisePickerSidebar({
  onExerciseSelect: _onExerciseSelect,
}: ExercisePickerSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const exercisesData = useQuery(api.functions.exercises.list, {
    searchQuery: debouncedSearchQuery.trim() || undefined,
  });

  // Map exercises to the format needed for the sidebar
  const publicExercises = useMemo(() => {
    if (!exercisesData) return [];
    return exercisesData.map((ex) => ({
      _id: ex._id,
      title: ex.title,
      description: ex.description,
      level: ex.level,
      difficulty: ex.difficulty,
    }));
  }, [exercisesData]);

  const handleDragStart = (
    e: React.DragEvent,
    exercise: {
      _id: Id<"exercises">;
      title: string;
      description: string;
      level: ExerciseLevel;
      difficulty: number;
    },
  ) => {
    e.dataTransfer.setData("application/exercise", JSON.stringify(exercise));
    e.dataTransfer.effectAllowed = "copy";
  };

  if (exercisesData === undefined) {
    return (
      <div className="bg-muted/50 flex h-full w-64 flex-col border-r p-4">
        <p className="text-muted-foreground text-sm">Loading exercises...</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/50 flex h-full w-96 flex-col border-r">
      <div className="shrink-0 border-b p-4">
        <h3 className="retro mb-3 font-semibold">Exercises</h3>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="retro pl-8"
          />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-2">
          {publicExercises.length === 0 ? (
            <p className="text-muted-foreground p-4 text-center text-sm">
              {debouncedSearchQuery.trim()
                ? "No exercises found"
                : "No exercises available"}
            </p>
          ) : (
            <div className="space-y-2">
              {publicExercises.map((exercise) => (
                <BitCard
                  key={exercise._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, exercise)}
                  className="cursor-grab transition-transform active:translate-y-1 active:cursor-grabbing"
                >
                  <BitCardHeader className="pb-1">
                    <BitCardTitle className="retro line-clamp-1 text-sm font-semibold">
                      {exercise.title}
                    </BitCardTitle>
                  </BitCardHeader>
                  <BitCardContent className="pt-0">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex w-full justify-between gap-2">
                        <span className="text-muted-foreground retro text-xs font-medium">
                          Difficulty:
                        </span>
                        <span className="text-muted-foreground retro text-xs">
                          {exercise.difficulty}/12
                        </span>
                      </div>
                      <HealthBar
                        value={(exercise.difficulty / 12) * 100}
                        sections={12}
                        className="h-3"
                        progressBg={
                          exerciseLevelHealthBarColors[exercise.level]
                        }
                      />
                    </div>
                  </BitCardContent>
                </BitCard>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

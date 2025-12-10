"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { ExerciseLevel } from "@packages/backend/convex/validators/validators";
import { useEffect, useMemo, useState } from "react";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Search } from "lucide-react";

import { Badge, Input, ScrollArea } from "@inochi/ui";

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

  const exercisesData = useQuery(api.functions.exercises.getAllExercises, {
    searchQuery: debouncedSearchQuery.trim() || undefined,
  });

  // Flatten exercises from all levels
  const publicExercises = useMemo(() => {
    if (!exercisesData) return [];
    const allExercises: Array<{
      _id: Id<"exercises">;
      title: string;
      description: string;
      level: ExerciseLevel;
      difficulty: number;
    }> = [];
    Object.values(exercisesData).forEach((levelExercises) => {
      levelExercises.forEach((ex) => {
        allExercises.push({
          _id: ex._id,
          title: ex.title,
          description: ex.description,
          level: ex.level,
          difficulty: ex.difficulty,
        });
      });
    });
    return allExercises;
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
    <div className="bg-muted/50 flex h-full w-64 flex-col border-r">
      <div className="shrink-0 border-b p-4">
        <h3 className="mb-3 font-semibold">Exercises</h3>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
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
                <div
                  key={exercise._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, exercise)}
                  className="bg-background hover:bg-accent cursor-grab rounded-lg border p-3 transition-colors active:cursor-grabbing"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h4 className="text-sm leading-tight font-medium">
                      {exercise.title}
                    </h4>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {exercise.level}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      Diff: {exercise.difficulty}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

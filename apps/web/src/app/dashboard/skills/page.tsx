"use client";

import { useReducer, useState } from "react";
import { Doc, Id } from "@packages/backend/convex/_generated/dataModel";
import { Search, X } from "lucide-react";

import { Button, Input } from "@inochi/ui";

import { CreateSkillDialog } from "./_components/create-skill-dialog";
import { SkillsFiltersHorizontal } from "./_components/skills-filters-horizontal";
import { SkillsList } from "./_components/skills-list";
import { useDebounce } from "./_hooks/use-debounce";

type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert" | "elite";
type SkillFilter = "all" | "public" | "private";

interface SkillsFiltersState {
  searchInput: string;
  level: SkillLevel | undefined;
  minDifficulty: number | undefined;
  maxDifficulty: number | undefined;
  muscleIds: Id<"muscles">[];
  equipmentIds: Id<"equipment">[];
  filter: SkillFilter;
}

type SkillsFiltersAction =
  | { type: "SET_SEARCH_INPUT"; payload: string }
  | { type: "SET_LEVEL"; payload: SkillLevel | undefined }
  | { type: "SET_DIFFICULTY"; payload: { min?: number; max?: number } }
  | { type: "SET_MUSCLES"; payload: Id<"muscles">[] }
  | { type: "SET_EQUIPMENT"; payload: Id<"equipment">[] }
  | { type: "SET_FILTER"; payload: SkillFilter };

const initialFiltersState: SkillsFiltersState = {
  searchInput: "",
  level: undefined,
  minDifficulty: undefined,
  maxDifficulty: undefined,
  muscleIds: [],
  equipmentIds: [],
  filter: "all",
};

function filtersReducer(
  state: SkillsFiltersState,
  action: SkillsFiltersAction,
): SkillsFiltersState {
  switch (action.type) {
    case "SET_SEARCH_INPUT":
      return { ...state, searchInput: action.payload };
    case "SET_LEVEL":
      return { ...state, level: action.payload };
    case "SET_DIFFICULTY":
      return {
        ...state,
        minDifficulty: action.payload.min,
        maxDifficulty: action.payload.max,
      };
    case "SET_MUSCLES":
      return { ...state, muscleIds: action.payload };
    case "SET_EQUIPMENT":
      return { ...state, equipmentIds: action.payload };
    case "SET_FILTER":
      return { ...state, filter: action.payload };
    default:
      return state;
  }
}

const VALID_LEVELS: readonly SkillLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
  "elite",
] as const;

function isValidLevel(level: string): level is SkillLevel {
  return VALID_LEVELS.includes(level as SkillLevel);
}

export default function SkillsPage() {
  const [filters, dispatch] = useReducer(filtersReducer, initialFiltersState);
  const debouncedSearchQuery = useDebounce(filters.searchInput, 300);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleLevelChange = (newLevel: string | undefined) => {
    if (!newLevel) {
      dispatch({ type: "SET_LEVEL", payload: undefined });
      return;
    }
    if (isValidLevel(newLevel)) {
      dispatch({ type: "SET_LEVEL", payload: newLevel });
    }
  };

  const handleSuggestEdit = (
    skill: Doc<"skills"> & {
      musclesData?: Array<Doc<"muscles">>;
      equipmentData?: Array<Doc<"equipment">>;
    },
  ) => {
    // TODO: Navigate to edit page when implemented
    console.log("Suggest edit for:", skill);
  };

  const handleEditPrivateSkill = (
    skill: Doc<"private_skills"> & {
      musclesData?: Array<Doc<"muscles">>;
      equipmentData?: Array<Doc<"equipment">>;
    },
  ) => {
    // TODO: Navigate to edit page when implemented
    console.log("Edit private skill:", skill);
  };

  const hasActiveFilters =
    filters.level !== undefined ||
    filters.minDifficulty !== undefined ||
    filters.maxDifficulty !== undefined ||
    filters.muscleIds.length > 0 ||
    filters.equipmentIds.length > 0;

  const clearAllFilters = () => {
    dispatch({ type: "SET_SEARCH_INPUT", payload: "" });
    dispatch({ type: "SET_LEVEL", payload: undefined });
    dispatch({
      type: "SET_DIFFICULTY",
      payload: { min: undefined, max: undefined },
    });
    dispatch({ type: "SET_MUSCLES", payload: [] });
    dispatch({ type: "SET_EQUIPMENT", payload: [] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-3xl font-bold">Skills</h1>
        <CreateSkillDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </div>

      {/* Search and Filters Row */}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full flex-1 sm:w-auto sm:min-w-[200px]">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
          <Input
            type="text"
            placeholder="Search skills..."
            value={filters.searchInput}
            onChange={(e) =>
              dispatch({ type: "SET_SEARCH_INPUT", payload: e.target.value })
            }
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Filter:</span>
          <div className="flex gap-1 rounded-md border p-1">
            <Button
              variant={filters.filter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => dispatch({ type: "SET_FILTER", payload: "all" })}
              className="h-7"
            >
              All
            </Button>
            <Button
              variant={filters.filter === "public" ? "default" : "ghost"}
              size="sm"
              onClick={() =>
                dispatch({ type: "SET_FILTER", payload: "public" })
              }
              className="h-7"
            >
              Public
            </Button>
            <Button
              variant={filters.filter === "private" ? "default" : "ghost"}
              size="sm"
              onClick={() =>
                dispatch({ type: "SET_FILTER", payload: "private" })
              }
              className="h-7"
            >
              Private
            </Button>
          </div>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={clearAllFilters}
          >
            <X className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Clear All</span>
          </Button>
        )}
        <SkillsFiltersHorizontal
          level={filters.level}
          minDifficulty={filters.minDifficulty}
          maxDifficulty={filters.maxDifficulty}
          muscleIds={filters.muscleIds}
          equipmentIds={filters.equipmentIds}
          onLevelChange={handleLevelChange}
          onDifficultyChange={(min, max) =>
            dispatch({ type: "SET_DIFFICULTY", payload: { min, max } })
          }
          onMusclesChange={(ids) =>
            dispatch({ type: "SET_MUSCLES", payload: ids })
          }
          onEquipmentChange={(ids) =>
            dispatch({ type: "SET_EQUIPMENT", payload: ids })
          }
        />
      </div>

      {/* Skills List */}
      <SkillsList
        filter={filters.filter}
        level={filters.level}
        minDifficulty={filters.minDifficulty}
        maxDifficulty={filters.maxDifficulty}
        searchQuery={debouncedSearchQuery.trim() || undefined}
        muscleIds={filters.muscleIds.length > 0 ? filters.muscleIds : undefined}
        equipmentIds={
          filters.equipmentIds.length > 0 ? filters.equipmentIds : undefined
        }
        onSuggestEdit={handleSuggestEdit}
        onEditPrivateSkill={handleEditPrivateSkill}
      />
    </div>
  );
}

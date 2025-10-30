"use client";

import { Input } from "@inochi/ui/Input";
import { Doc, Id } from "@packages/backend/convex/_generated/dataModel";
import { Search } from "lucide-react";
import { useReducer, useState } from "react";
import { CreateSkillDialog } from "./_components/create-skill-dialog";
import { SkillsFiltersHorizontal } from "./_components/skills-filters-horizontal";
import { SkillsList } from "./_components/skills-list";
import { useDebounce } from "./_hooks/use-debounce";

type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert" | "elite";

interface SkillsFiltersState {
  searchInput: string;
  level: SkillLevel | undefined;
  minDifficulty: number | undefined;
  maxDifficulty: number | undefined;
  muscleIds: Id<"muscles">[];
  equipmentIds: Id<"equipment">[];
}

type SkillsFiltersAction =
  | { type: "SET_SEARCH_INPUT"; payload: string }
  | { type: "SET_LEVEL"; payload: SkillLevel | undefined }
  | { type: "SET_DIFFICULTY"; payload: { min?: number; max?: number } }
  | { type: "SET_MUSCLES"; payload: Id<"muscles">[] }
  | { type: "SET_EQUIPMENT"; payload: Id<"equipment">[] };

const initialFiltersState: SkillsFiltersState = {
  searchInput: "",
  level: undefined,
  minDifficulty: undefined,
  maxDifficulty: undefined,
  muscleIds: [],
  equipmentIds: [],
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [skillToEdit, setSkillToEdit] = useState<
    | (Doc<"skills"> & {
        musclesData?: Array<Doc<"muscles">>;
        equipmentData?: Array<Doc<"equipment">>;
      })
    | null
  >(null);

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
    setSkillToEdit(skill);
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Skills</h1>
        <CreateSkillDialog />
      </div>

      {/* Edit Dialog */}
      {skillToEdit && (
        <CreateSkillDialog
          key={skillToEdit._id}
          mode="edit"
          existingSkill={skillToEdit}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) {
              setSkillToEdit(null);
            }
          }}
        />
      )}

      {/* Search and Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full sm:w-auto sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
        level={filters.level}
        minDifficulty={filters.minDifficulty}
        maxDifficulty={filters.maxDifficulty}
        searchQuery={debouncedSearchQuery.trim() || undefined}
        muscleIds={filters.muscleIds.length > 0 ? filters.muscleIds : undefined}
        equipmentIds={
          filters.equipmentIds.length > 0 ? filters.equipmentIds : undefined
        }
        onSuggestEdit={handleSuggestEdit}
      />
    </div>
  );
}

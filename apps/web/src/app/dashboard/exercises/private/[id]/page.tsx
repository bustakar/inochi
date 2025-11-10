"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Edit } from "lucide-react";

import { Badge, Button } from "@inochi/ui";

import { UpdateExerciseDialog } from "../../_components/update-exercise-dialog";
import { ExerciseVariantsSection } from "./_components/exercise-variants-section";

// ============================================================================
// Constants
// ============================================================================

const levelColors: Record<
  "beginner" | "intermediate" | "advanced" | "expert" | "elite",
  string
> = {
  beginner:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  intermediate:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  advanced:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  expert:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  elite: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const categoryColors: Record<
  "calisthenics" | "gym" | "stretch" | "mobility",
  string
> = {
  calisthenics:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  gym: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  stretch:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  mobility:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
};

// ============================================================================
// Exercise Header Component
// ============================================================================

interface ExerciseHeaderProps {
  exercise: {
    title: string;
    level: "beginner" | "intermediate" | "advanced" | "expert" | "elite";
    category: "calisthenics" | "gym" | "stretch" | "mobility";
    difficulty: number;
  };
  exerciseId: Id<"private_exercises">;
}

function ExerciseHeader({
  exercise,
  onEditClick,
}: ExerciseHeaderProps & { onEditClick: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col items-start gap-4 md:flex-col md:flex-row md:items-center">
        <h1 className="text-foreground text-3xl font-bold">{exercise.title}</h1>
        <div className="flex items-center gap-1">
          <Badge className={levelColors[exercise.level]}>
            {exercise.level}
          </Badge>
          <Badge className={levelColors[exercise.level]}>
            {exercise.difficulty}/10
          </Badge>
        </div>
        {/* <Badge
              className={
                categoryColors[exercise.category] ||
                "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
              }
            >
              {exercise.category}
            </Badge>
            <Badge variant="outline">Private</Badge> */}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onEditClick}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Description Section Component
// ============================================================================

interface DescriptionSectionProps {
  description: string;
}

function DescriptionSection({ description }: DescriptionSectionProps) {
  return (
    <div>
      <p className="text-muted-foreground whitespace-pre-wrap">{description}</p>
    </div>
  );
}

// ============================================================================
// Muscles Section Component
// ============================================================================

interface MusclesSectionProps {
  muscles: Array<{
    _id: Id<"muscles">;
    name: string;
    role?: "primary" | "secondary" | "tertiary" | "stabilizer";
  }>;
}

function MusclesSection({ muscles }: MusclesSectionProps) {
  return (
    <div>
      <div>
        <h2 className="text-foreground mb-2 text-lg font-semibold">Muscles</h2>
      </div>
      <div>
        {muscles.length === 0 ? (
          <p className="text-muted-foreground text-sm">None</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {muscles.map((muscle) => (
              <Badge key={muscle._id} variant="secondary">
                {muscle.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Progression Section Component
// ============================================================================

interface ProgressionSectionProps {
  exercises: Array<{
    _id: Id<"exercises"> | Id<"private_exercises">;
    title: string;
  }>;
  title: string;
}

function ProgressionSection({ exercises, title }: ProgressionSectionProps) {
  return (
    <div>
      <h2 className="text-foreground mb-2 text-lg font-semibold">{title}</h2>
      {exercises.length === 0 ? (
        <p className="text-muted-foreground text-sm">None</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {exercises.map((exercise) => (
            <Badge key={exercise._id} variant="secondary">
              {exercise.title}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function PrivateExerciseDetailPage() {
  const params = useParams();
  const exerciseId = params.id as Id<"private_exercises">;
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);

  const exercise = useQuery(api.functions.exercises.getPrivateExerciseById, {
    exerciseId,
  });

  if (exercise === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading exercise...</p>
      </div>
    );
  }

  if (exercise === null) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <p className="text-muted-foreground">Exercise not found.</p>
        <Link href="/dashboard/exercises">
          <Button variant="outline">Back to Exercises</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <ExerciseHeader
          exercise={exercise}
          exerciseId={exerciseId}
          onEditClick={() => setEditDialogOpen(true)}
        />

        <div className="space-y-6">
          <DescriptionSection description={exercise.description} />
          <MusclesSection muscles={exercise.muscles} />
          <ProgressionSection
            exercises={exercise.prerequisites}
            title="Prerequisites"
          />
          <ProgressionSection
            exercises={exercise.progressions}
            title="Progressions"
          />
          <ExerciseVariantsSection exerciseId={exerciseId} />
        </div>
      </div>
      <UpdateExerciseDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        exerciseId={exerciseId}
      />
    </>
  );
}

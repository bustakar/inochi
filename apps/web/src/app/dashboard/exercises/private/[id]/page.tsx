"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Edit, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
} from "@inochi/ui";

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
  onSubmitClick,
}: ExerciseHeaderProps & {
  onEditClick: () => void;
  onSubmitClick: () => void;
}) {
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
        <Button variant="default" onClick={onSubmitClick}>
          <Upload className="mr-2 h-4 w-4" />
          Submit to Public
        </Button>
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
    muscleGroup?: string;
    role?: "primary" | "secondary" | "tertiary" | "stabilizer";
  }>;
}

const roleLabels: Record<
  "primary" | "secondary" | "tertiary" | "stabilizer",
  string
> = {
  primary: "Primary",
  secondary: "Secondary",
  tertiary: "Tertiary",
  stabilizer: "Stabilizer",
};

function MusclesSection({ muscles }: MusclesSectionProps) {
  // Group muscles by role, then by muscle group
  const groupedMuscles = React.useMemo(() => {
    const grouped: Record<
      "primary" | "secondary" | "tertiary" | "stabilizer",
      Map<string, Array<{ _id: Id<"muscles">; name: string }>>
    > = {
      primary: new Map(),
      secondary: new Map(),
      tertiary: new Map(),
      stabilizer: new Map(),
    };

    for (const muscle of muscles) {
      const role = muscle.role || "primary";
      const group = muscle.muscleGroup || "Other";

      if (!grouped[role].has(group)) {
        grouped[role].set(group, []);
      }
      grouped[role].get(group)!.push({
        _id: muscle._id,
        name: muscle.name,
      });
    }

    return grouped;
  }, [muscles]);

  const hasAnyMuscles = muscles.length > 0;

  if (!hasAnyMuscles) {
    return (
      <div>
        <h2 className="text-foreground mb-2 text-lg font-semibold">Muscles</h2>
        <p className="text-muted-foreground text-sm">None</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-foreground mb-4 text-lg font-semibold">Muscles</h2>
      <div className="space-y-4">
        {(
          ["primary", "secondary", "tertiary", "stabilizer"] as Array<
            "primary" | "secondary" | "tertiary" | "stabilizer"
          >
        ).map((role) => {
          const roleGroups = groupedMuscles[role];
          if (roleGroups.size === 0) return null;

          return (
            <div key={role} className="space-y-2">
              <h3 className="text-muted-foreground text-sm font-medium">
                {roleLabels[role]}
              </h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(roleGroups.entries()).map(
                  ([group, groupMuscles]) => {
                    const displayGroupName =
                      group === "Other"
                        ? "Other"
                        : group
                            .split(" ")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1),
                            )
                            .join(" ");

                    return (
                      <div
                        key={`${role}-${group}`}
                        className="bg-muted/50 inline-flex items-center gap-1 rounded-lg border px-2 py-1"
                      >
                        <Badge
                          variant="outline"
                          className="border-0 bg-transparent px-1 py-0 text-xs font-semibold"
                        >
                          {displayGroupName}
                        </Badge>
                        <span className="text-muted-foreground text-xs">•</span>
                        <div className="flex flex-wrap gap-1">
                          {groupMuscles.map((muscle) => (
                            <Badge
                              key={muscle._id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {muscle.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          );
        })}
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
  // Helper to get the route for an exercise based on its ID
  const getExerciseRoute = (
    exerciseId: Id<"exercises"> | Id<"private_exercises">,
  ): string => {
    // TODO: Handle public exercises once implemented
    return `/dashboard/exercises/private/${exerciseId}`;
  };

  return (
    <div>
      <h2 className="text-foreground mb-2 text-lg font-semibold">{title}</h2>
      {exercises.length === 0 ? (
        <p className="text-muted-foreground text-sm">None</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {exercises.map((exercise) => (
            <Link
              key={exercise._id}
              href={getExerciseRoute(exercise._id)}
              className="transition-opacity hover:opacity-80"
            >
              <Badge variant="secondary" className="cursor-pointer">
                {exercise.title}
              </Badge>
            </Link>
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
  const router = useRouter();
  const exerciseId = params.id as Id<"private_exercises">;
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = React.useState(false);

  const exercise = useQuery(api.functions.exercises.getPrivateExerciseById, {
    exerciseId,
  });
  const createSubmission = useMutation(api.functions.submissions.createSubmission);

  const handleSubmit = async () => {
    try {
      const submissionId = await createSubmission({
        privateExerciseId: exerciseId,
      });
      toast.success("Exercise submitted successfully!");
      setSubmitDialogOpen(false);
      router.push(`/dashboard/submissions/${submissionId}`);
    } catch (error) {
      console.error("Error submitting exercise:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit exercise. Please try again.",
      );
    }
  };

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
          onSubmitClick={() => setSubmitDialogOpen(true)}
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
      <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exercise to Public Database</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit this exercise to the public
              database? Once approved by moderators, this exercise will be
              moved to the public database and{" "}
              <strong>you will no longer be able to edit it</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Submit Exercise
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { AlertTriangle, Lock } from "lucide-react";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@inochi/ui";

type ExerciseLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert"
  | "elite";
type ExerciseCategory = "calisthenics" | "gym" | "stretch" | "mobility";
type MuscleRole = "primary" | "secondary" | "tertiary" | "stabilizer";

interface ExerciseData {
  title: string;
  description?: string;
  category?: ExerciseCategory;
  level?: ExerciseLevel;
  difficulty?: number;
  muscles?: {
    muscleId: Id<"muscles">;
    role: MuscleRole;
  }[];
  prerequisites?: (Id<"exercises"> | Id<"private_exercises">)[];
  progressions?: (Id<"exercises"> | Id<"private_exercises">)[];
}

interface SubmissionExercisePreviewProps {
  exercise: ExerciseData;
}

const levelColors: Record<ExerciseLevel, string> = {
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

const categoryLabels: Record<ExerciseCategory, string> = {
  calisthenics: "Calisthenics",
  gym: "Gym",
  stretch: "Stretch",
  mobility: "Mobility",
};

const roleLabels: Record<MuscleRole, string> = {
  primary: "Primary",
  secondary: "Secondary",
  tertiary: "Tertiary",
  stabilizer: "Stabilizer",
};

function MusclesList({ muscles }: { muscles: ExerciseData["muscles"] }) {
  // Fetch all muscles to get their names
  const allMuscles = useQuery(api.functions.exercises.getMuscles);

  if (!muscles || muscles.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No muscles specified</p>
    );
  }

  if (allMuscles === undefined) {
    return <p className="text-muted-foreground text-sm">Loading muscles...</p>;
  }

  // Group muscles by role
  const musclesByRole = muscles.reduce(
    (acc, muscle) => {
      const role = muscle.role;
      if (!(role in acc)) {
        acc[role] = [];
      }
      const muscleInfo = allMuscles.find((m) => m._id === muscle.muscleId);
      if (muscleInfo) {
        acc[role].push(muscleInfo.name);
      }
      return acc;
    },
    {} as Record<MuscleRole, string[]>,
  );

  return (
    <div className="space-y-2">
      {(["primary", "secondary", "tertiary", "stabilizer"] as MuscleRole[]).map(
        (role) => {
          const roleMuscles = musclesByRole[role];
          if (roleMuscles.length === 0) return null;

          return (
            <div key={role} className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-sm font-medium">
                {roleLabels[role]}:
              </span>
              {roleMuscles.map((name) => (
                <Badge key={name} variant="secondary" className="text-xs">
                  {name}
                </Badge>
              ))}
            </div>
          );
        },
      )}
    </div>
  );
}

function ExerciseReferenceList({
  exerciseIds,
  title,
}: {
  exerciseIds: (Id<"exercises"> | Id<"private_exercises">)[];
  title: string;
}) {
  const exerciseTitles = useQuery(
    api.functions.exercises.getExerciseTitlesByIds,
    { exerciseIds },
  );

  if (exerciseIds.length === 0) {
    return null;
  }

  if (exerciseTitles === undefined) {
    return (
      <div>
        <h3 className="text-foreground mb-2 text-sm font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  const hasPrivateExercises = exerciseTitles.some((e) => e.isPrivate);

  return (
    <div>
      <h3 className="text-foreground mb-2 text-sm font-semibold">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {exerciseTitles.map((exercise) => (
          <Badge
            key={exercise._id}
            variant={exercise.isPrivate ? "outline" : "secondary"}
            className={
              exercise.isPrivate
                ? "border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                : ""
            }
          >
            {exercise.isPrivate && <Lock className="mr-1 h-3 w-3" />}
            {exercise.title}
          </Badge>
        ))}
      </div>
      {hasPrivateExercises && (
        <div className="mt-2 flex items-start gap-2 rounded-md bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>
            Private exercises (marked with lock icon) cannot be copied to the
            public database and will be excluded when approved.
          </span>
        </div>
      )}
    </div>
  );
}

export function SubmissionExercisePreview({
  exercise,
}: SubmissionExercisePreviewProps) {
  const level = exercise.level ?? "beginner";
  const category = exercise.category ?? "calisthenics";
  const difficulty = exercise.difficulty ?? 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Exercise Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic info */}
        <div className="flex flex-wrap gap-2">
          <Badge className={levelColors[level]}>
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </Badge>
          <Badge variant="outline">{categoryLabels[category]}</Badge>
          <Badge variant="outline">Difficulty: {difficulty}/10</Badge>
        </div>

        {/* Description */}
        {exercise.description && (
          <div>
            <h3 className="text-foreground mb-2 text-sm font-semibold">
              Description
            </h3>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
              {exercise.description}
            </p>
          </div>
        )}

        {/* Muscles */}
        <div>
          <h3 className="text-foreground mb-2 text-sm font-semibold">
            Target Muscles
          </h3>
          <MusclesList muscles={exercise.muscles} />
        </div>

        {/* Prerequisites */}
        {exercise.prerequisites && exercise.prerequisites.length > 0 && (
          <ExerciseReferenceList
            exerciseIds={exercise.prerequisites}
            title="Prerequisites"
          />
        )}

        {/* Progressions */}
        {exercise.progressions && exercise.progressions.length > 0 && (
          <ExerciseReferenceList
            exerciseIds={exercise.progressions}
            title="Progressions"
          />
        )}
      </CardContent>
    </Card>
  );
}

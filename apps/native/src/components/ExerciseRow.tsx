import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type {
  ExerciseLevel,
  ProgressStatus,
} from "@packages/backend/convex/validators/validators";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  exerciseLevelColors,
  getProgressStatusColor,
  getProgressStatusLabel,
} from "../utils/exercise-utils";

interface ExerciseRowProps {
  exercise: {
    _id: Id<"exercises">;
    _creationTime: number;
    title: string;
    description: string;
    level: ExerciseLevel;
    difficulty: number;
    musclesData: {
      _id: Id<"muscles">;
      name: string;
      muscleGroup?: string;
      role?: "primary" | "secondary" | "stabilizer";
    }[];
    primaryMuscleGroups: string[];
    userProgress: { status: ProgressStatus } | null;
  };
  onPress?: () => void;
}

function DifficultyIndicator({ difficulty }: { difficulty: number }) {
  return (
    <View style={styles.difficultyContainer}>
      {Array.from({ length: 10 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.difficultyDot,
            i < difficulty
              ? styles.difficultyDotFilled
              : styles.difficultyDotEmpty,
          ]}
        />
      ))}
      <Text style={styles.difficultyText}>{difficulty}/10</Text>
    </View>
  );
}

function LevelBadge({ level }: { level: ExerciseLevel }) {
  const colors = exerciseLevelColors[level];
  return (
    <View style={[styles.levelBadge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.levelBadgeText, { color: colors.text }]}>
        {level}
      </Text>
    </View>
  );
}

function ProgressBadge({ status }: { status: ProgressStatus }) {
  const colors = getProgressStatusColor(status);
  return (
    <View style={[styles.progressBadge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.progressBadgeText, { color: colors.text }]}>
        {getProgressStatusLabel(status)}
      </Text>
    </View>
  );
}

export function ExerciseRow({ exercise, onPress }: ExerciseRowProps) {
  const displayDescription = React.useMemo(() => {
    const maxLength = 100;
    if (exercise.description.length <= maxLength) {
      return exercise.description;
    }
    const truncated = exercise.description.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    const cutoff = lastSpace > 0 ? lastSpace : maxLength;
    return exercise.description.substring(0, cutoff) + "...";
  }, [exercise.description]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.exerciseContainer,
        !exercise.userProgress && styles.exerciseContainerInactive,
        pressed && styles.exerciseContainerPressed,
      ]}
    >
      {/* Title */}
      <Text style={styles.title}>{exercise.title}</Text>

      {/* Description */}
      <Text style={styles.description} numberOfLines={2}>
        {displayDescription}
      </Text>

      {/* Badges row */}
      <View style={styles.badgesRow}>
        <LevelBadge level={exercise.level} />
        {exercise.userProgress && (
          <ProgressBadge status={exercise.userProgress.status} />
        )}
      </View>

      {/* Difficulty */}
      <DifficultyIndicator difficulty={exercise.difficulty} />

      {/* Muscle groups */}
      {exercise.primaryMuscleGroups.length > 0 && (
        <View style={styles.muscleGroupsRow}>
          {exercise.primaryMuscleGroups.slice(0, 3).map((groupName, index) => (
            <View key={`group-${index}`} style={styles.muscleGroupTag}>
              <Text style={styles.muscleGroupText}>{groupName}</Text>
            </View>
          ))}
          {exercise.primaryMuscleGroups.length > 3 && (
            <Text style={styles.moreMusclesText}>
              +{exercise.primaryMuscleGroups.length - 3} more
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  exerciseContainer: {
    paddingVertical: 16,
    width: "100%",
  },
  exerciseContainerInactive: {
    opacity: 0.7,
  },
  exerciseContainerPressed: {
    opacity: 0.6,
  },
  title: {
    fontSize: 17,
    fontFamily: "SemiBold",
    color: "#000000",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    fontFamily: "Regular",
    color: "#71717A",
    marginBottom: 8,
    lineHeight: 20,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  levelBadgeText: {
    fontSize: 11,
    fontFamily: "Medium",
  },
  progressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  progressBadgeText: {
    fontSize: 11,
    fontFamily: "Medium",
  },
  difficultyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  difficultyDotFilled: {
    backgroundColor: "#0D87E1",
  },
  difficultyDotEmpty: {
    backgroundColor: "#E4E4E7",
  },
  difficultyText: {
    fontSize: 11,
    fontFamily: "Regular",
    color: "#71717A",
    marginLeft: 4,
  },
  muscleGroupsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  muscleGroupTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: "#F4F4F5",
  },
  muscleGroupText: {
    fontSize: 10,
    fontFamily: "Regular",
    color: "#71717A",
  },
  moreMusclesText: {
    fontSize: 10,
    fontFamily: "Regular",
    color: "#71717A",
    fontStyle: "italic",
  },
});

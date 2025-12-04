import { Host, Text, VStack } from "@expo/ui/swift-ui";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type {
  ExerciseLevel,
  MuscleRole,
  ProgressStatus,
} from "@packages/backend/convex/validators/validators";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  exerciseLevelColors,
  getProgressStatusColor,
  getProgressStatusLabel,
} from "../utils/exercise-utils";

interface ExerciseCardProps {
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
      role?: MuscleRole;
    }[];
    primaryMuscleGroups: string[];
    userProgress: { status: ProgressStatus } | null;
  };
}

function ProgressRibbon({ status }: { status: ProgressStatus }) {
  const colors = getProgressStatusColor(status);
  return (
    <View style={[styles.progressRibbon, { backgroundColor: colors.bg }]}>
      <Text style={[styles.progressRibbonText, { color: colors.text }]}>
        {getProgressStatusLabel(status)}
      </Text>
    </View>
  );
}

function LevelBadge({ level }: { level: ExerciseLevel }) {
  const colors = exerciseLevelColors[level];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text>{level}</Text>
    </View>
  );
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const router = useRouter();

  const displayDescription = React.useMemo(() => {
    const maxLength = 150;
    if (exercise.description.length <= maxLength) {
      return exercise.description;
    }
    const truncated = exercise.description.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    const cutoff = lastSpace > 0 ? lastSpace : maxLength;
    return exercise.description.substring(0, cutoff) + "...";
  }, [exercise.description]);

  const levelColors = exerciseLevelColors[exercise.level];

  const handlePress = () => {
    // TODO: Navigate to exercise detail screen when implemented
    // router.push(`/(tabs)/exercises/${exercise._id}`);
  };

  return (
    <Host>
      <VStack>
        <Text>{exercise.title}</Text>
        <LevelBadge level={exercise.level} />
        <Text>{displayDescription}</Text>
      </VStack>
    </Host>
    // <Pressable
    //   style={[
    //     styles.card,
    //     !exercise.userProgress && styles.cardInactive,
    //   ]}
    //   onPress={handlePress}
    // >
    //   {/* Progress ribbon */}
    //   {exercise.userProgress && (
    //     <ProgressRibbon status={exercise.userProgress.status} />
    //   )}

    //   {/* Header with title */}
    //   <View style={styles.header}>
    //     <Text style={styles.title} numberOfLines={2}>
    //       {exercise.title}
    //     </Text>
    //   </View>

    //   {/* Level and visibility badges */}
    //   <View style={styles.badgesRow}>
    //     <View
    //       style={[
    //         styles.badge,
    //         { backgroundColor: levelColors.bg },
    //       ]}
    //     >
    //       <Text style={[styles.badgeText, { color: levelColors.text }]}>
    //         {exercise.level}
    //       </Text>
    //     </View>
    //     <View style={[styles.badge, styles.publicBadge]}>
    //       <MaterialCommunityIcons name="earth" size={12} color="#059669" />
    //       <Text style={styles.publicBadgeText}>Public</Text>
    //     </View>
    //   </View>

    //   {/* Description */}
    //   <Text style={styles.description} numberOfLines={2}>
    //     {displayDescription}
    //   </Text>

    //   {/* Difficulty */}
    //   <View style={styles.difficultyRow}>
    //     <Text style={styles.difficultyLabel}>Difficulty:</Text>
    //     <View style={styles.difficultyDots}>
    //       {Array.from({ length: 10 }).map((_, i) => (
    //         <View
    //           key={i}
    //           style={[
    //             styles.difficultyDot,
    //             i < exercise.difficulty ? styles.difficultyDotFilled : styles.difficultyDotEmpty,
    //           ]}
    //         />
    //       ))}
    //     </View>
    //     <Text style={styles.difficultyValue}>{exercise.difficulty}/10</Text>
    //   </View>

    //   {/* Primary muscle groups */}
    //   {exercise.primaryMuscleGroups.length > 0 && (
    //     <View style={styles.muscleGroupsRow}>
    //       {exercise.primaryMuscleGroups.map((groupName, index) => (
    //         <View key={`group-${index}`} style={styles.muscleGroupBadge}>
    //           <MaterialCommunityIcons name="target" size={12} color="#71717A" />
    //           <Text style={styles.muscleGroupText}>{groupName}</Text>
    //         </View>
    //       ))}
    //     </View>
    //   )}
    // </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardInactive: {
    opacity: 0.9,
  },
  progressRibbon: {
    position: "absolute",
    top: 0,
    right: 0,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    zIndex: 1,
  },
  progressRibbonText: {
    fontSize: 10,
    fontFamily: "Bold",
  },
  header: {
    marginBottom: 8,
    paddingRight: 60, // Space for progress ribbon
  },
  title: {
    fontSize: 18,
    fontFamily: "SemiBold",
    color: "#18181B",
    lineHeight: 24,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Medium",
  },
  publicBadge: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  publicBadgeText: {
    fontSize: 12,
    fontFamily: "Medium",
    color: "#047857",
  },
  description: {
    fontSize: 14,
    fontFamily: "Regular",
    color: "#71717A",
    marginBottom: 12,
    lineHeight: 20,
  },
  difficultyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  difficultyLabel: {
    fontSize: 12,
    fontFamily: "Medium",
    color: "#71717A",
  },
  difficultyDots: {
    flexDirection: "row",
    gap: 4,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  difficultyDotFilled: {
    backgroundColor: "#0D87E1",
  },
  difficultyDotEmpty: {
    backgroundColor: "#E4E4E7",
  },
  difficultyValue: {
    fontSize: 12,
    fontFamily: "Regular",
    color: "#71717A",
  },
  muscleGroupsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  muscleGroupBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  muscleGroupText: {
    fontSize: 12,
    fontFamily: "Regular",
    color: "#71717A",
  },
});

import {
  ContentUnavailableView,
  Host,
  HStack,
  List,
  Section,
  Text as SwiftUIText,
  VStack,
} from "@expo/ui/swift-ui";
import { background, cornerRadius, padding } from "@expo/ui/swift-ui/modifiers";
import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
  exerciseLevelColors,
  exerciseLevels,
  getProgressStatusColor,
  getProgressStatusLabel,
} from "../../../utils/exercise-utils";

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function ExercisesScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const searchQuery = params.q?.trim() ?? undefined;

  const exercises = useQuery(api.functions.exercises.listByLevel, {
    searchQuery: searchQuery,
  });

  const hasNoExercises = useMemo(() => {
    if (!exercises) return false;
    return exerciseLevels.every((level) => exercises[level].length === 0);
  }, [exercises]);

  const handleExercisePress = (_exerciseId: Id<"exercises">) => {
    // TODO: Navigate to exercise detail when implemented
    // router.push(`/(tabs)/exercises/${exerciseId}`);
  };

  if (exercises === undefined) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0D87E1" />
          <Text style={styles.emptyText}>Loading exercises...</Text>
        </View>
      </View>
    );
  }

  if (hasNoExercises) {
    return (
      <Host style={styles.container}>
        <View style={styles.centerContainer}>
          <ContentUnavailableView
            title="No exercises found"
            description={
              searchQuery
                ? "No exercises found matching your search."
                : "No exercises found."
            }
          />
        </View>
      </Host>
    );
  }

  return (
    <Host style={styles.container}>
      <List listStyle="plain">
        {exerciseLevels.map((level) => {
          const levelExercises = exercises[level];
          if (levelExercises.length === 0) {
            return null;
          }

          return (
            <Section key={level} title={capitalize(level)}>
              {levelExercises.map((exercise) => (
                <VStack
                  key={exercise._id}
                  alignment="leading"
                  spacing={8}
                  onPress={() => handleExercisePress(exercise._id)}
                >
                  {/* Progress Badge */}
                  {exercise.userProgress && (
                    <HStack
                      spacing={4}
                      modifiers={[
                        padding({ all: 4 }),
                        background(
                          getProgressStatusColor(exercise.userProgress.status)
                            .bg,
                        ),
                        cornerRadius(8),
                      ]}
                    >
                      <SwiftUIText
                        size={12}
                        color={
                          getProgressStatusColor(exercise.userProgress.status)
                            .text
                        }
                      >
                        {getProgressStatusLabel(exercise.userProgress.status)}
                      </SwiftUIText>
                    </HStack>
                  )}

                  <HStack spacing={8}>
                    {/* Title */}
                    <SwiftUIText weight="semibold" size={17}>
                      {exercise.title}
                    </SwiftUIText>
                    {/* Level and Difficulty */}
                    <HStack
                      spacing={4}
                      modifiers={[
                        padding({ all: 4 }),
                        background(exerciseLevelColors[exercise.level].bg),
                        cornerRadius(8),
                      ]}
                    >
                      <SwiftUIText
                        size={13}
                        color={exerciseLevelColors[exercise.level].text}
                      >
                        {capitalize(exercise.level)}
                      </SwiftUIText>
                      <SwiftUIText size={13} color="#71717A">
                        •
                      </SwiftUIText>
                      <SwiftUIText
                        size={13}
                        color={exerciseLevelColors[exercise.level].text}
                      >
                        {`${exercise.difficulty}/12`}
                      </SwiftUIText>
                    </HStack>
                  </HStack>

                  {/* Description */}
                  <SwiftUIText size={14} color="#71717A" lineLimit={2}>
                    {exercise.description}
                  </SwiftUIText>

                  {/* Primary Muscle Groups */}
                  {exercise.primaryMuscleGroups.length > 0 && (
                    <HStack spacing={6}>
                      {exercise.primaryMuscleGroups.map(
                        (muscleGroup, index) => (
                          <HStack
                            key={`${exercise._id}-muscle-${index}`}
                            spacing={4}
                            modifiers={[
                              padding({ all: 4 }),
                              background("#F4F4F5"),
                              cornerRadius(8),
                            ]}
                          >
                            <SwiftUIText size={12} color="#71717A">
                              {muscleGroup}
                            </SwiftUIText>
                          </HStack>
                        ),
                      )}
                    </HStack>
                  )}
                </VStack>
              ))}
            </Section>
          );
        })}
      </List>
    </Host>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Regular",
    color: "#71717A",
    textAlign: "center",
    marginTop: 16,
  },
});

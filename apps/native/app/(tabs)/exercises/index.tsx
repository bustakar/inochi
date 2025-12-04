import { ContentUnavailableView } from "@expo/ui/swift-ui";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { ExerciseLevel } from "@packages/backend/convex/validators/validators";
import { useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ExerciseRow } from "../../../src/components/ExerciseRow";
import { exerciseLevels } from "../../../src/utils/exercise-utils";

type Exercise = {
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
  userProgress: {
    status: "novice" | "apprentice" | "journeyman" | "master";
  } | null;
};

function sortExercises(exercises: Exercise[]): Exercise[] {
  return [...exercises].sort((a, b) => {
    // Sort by level (using exerciseLevels array order)
    const levelA = exerciseLevels.indexOf(a.level);
    const levelB = exerciseLevels.indexOf(b.level);
    if (levelA !== levelB) {
      return levelA - levelB;
    }

    // Then by difficulty (ascending)
    if (a.difficulty !== b.difficulty) {
      return a.difficulty - b.difficulty;
    }

    // Finally by title (alphabetically)
    return a.title.localeCompare(b.title);
  });
}

export default function ExercisesScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const searchQuery = params.q?.trim() || undefined;

  const exercises = useQuery(api.functions.exercises.getAllExercises, {
    searchQuery: searchQuery,
  });

  const sortedExercises = useMemo(() => {
    if (!exercises) return undefined;
    return sortExercises(exercises);
  }, [exercises]);

  // Flatten exercises with section headers for FlatList
  type ListItem =
    | { type: "header"; level: ExerciseLevel }
    | { type: "exercise"; exercise: Exercise };

  const listItems = useMemo(() => {
    if (!sortedExercises) return undefined;

    const items: ListItem[] = [];
    const grouped = new Map<ExerciseLevel, Exercise[]>();

    // Group exercises by level
    for (const exercise of sortedExercises) {
      const level = exercise.level;
      if (!grouped.has(level)) {
        grouped.set(level, []);
      }
      grouped.get(level)!.push(exercise);
    }

    // Create list items with headers
    for (const level of exerciseLevels) {
      const levelExercises = grouped.get(level);
      if (levelExercises && levelExercises.length > 0) {
        items.push({ type: "header", level });
        for (const exercise of levelExercises) {
          items.push({ type: "exercise", exercise });
        }
      }
    }

    return items;
  }, [sortedExercises]);

  const { bottom } = useSafeAreaInsets();

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if (item.type === "header") {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>
            {item.level.charAt(0).toUpperCase() + item.level.slice(1)}
          </Text>
        </View>
      );
    }

    return (
      <ExerciseRow
        exercise={item.exercise}
        onPress={() => {
          // TODO: Navigate to exercise detail when implemented
        }}
      />
    );
  }, []);

  const renderSeparator = useCallback(() => {
    return <View style={styles.separator} />;
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  if (sortedExercises === undefined) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0D87E1" />
          <Text style={styles.emptyText}>Loading exercises...</Text>
        </View>
      </View>
    );
  }

  if (sortedExercises.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ContentUnavailableView
            title="No exercises found"
            description="No exercises found matching your search."
          />
        </View>
      </View>
    );
  }

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      onScrollBeginDrag={dismissKeyboard}
      keyboardShouldPersistTaps="handled"
      style={styles.list}
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingBottom: Platform.select({
            android: 100 + bottom,
            default: 0,
          }),
        },
      ]}
      ItemSeparatorComponent={renderSeparator}
      renderItem={renderItem}
      data={listItems || []}
      keyExtractor={(item, index) => {
        if (item.type === "header") {
          return `header-${item.level}`;
        }
        return item.exercise._id;
      }}
      ListEmptyComponent={
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {searchQuery
              ? "No exercises found matching your search."
              : "No exercises found."}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  list: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  searchWrapper: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F4F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Regular",
    color: "#18181B",
    padding: 0,
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingTop: 16,
  },
  sectionHeaderText: {
    fontSize: 22,
    fontFamily: "Bold",
    color: "#000000",
  },
  separator: {
    height: 1,
    backgroundColor: "#E4E4E7",
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

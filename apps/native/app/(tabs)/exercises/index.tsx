import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { ExerciseLevel } from "@packages/backend/convex/validators/validators";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useQuery } from "convex/react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ExerciseCard } from "../../../src/components/ExerciseCard";
import { exerciseLevels } from "../../../src/utils/exercise-utils";

function SearchBar({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.searchContainer}>
      <MaterialCommunityIcons
        name="magnify"
        size={16}
        color="#71717A"
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || "Search..."}
        placeholderTextColor="#71717A"
      />
    </View>
  );
}

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
  userProgress: { status: "novice" | "apprentice" | "journeyman" | "master" } | null;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const exercises = useQuery(api.functions.exercises.getAllExercises, {
    searchQuery: debouncedSearchQuery.trim() || undefined,
  });

  const sortedExercises = useMemo(() => {
    if (!exercises) return undefined;
    return sortExercises(exercises);
  }, [exercises]);

  const renderHeader = useCallback(() => {
    return (
      <View style={styles.searchWrapper}>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="Search exercises by title or description..."
        />
      </View>
    );
  }, [searchQuery, handleSearchChange]);

  if (sortedExercises === undefined) {
    return (
      <View style={styles.container}>
        {renderHeader()}
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
        {renderHeader()}
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {debouncedSearchQuery.trim()
              ? "No exercises found matching your search."
              : "No exercises found."}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedExercises}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ExerciseCard exercise={item} />}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustContentInsets={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  searchWrapper: {
    paddingHorizontal: 16,
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
  listContent: {
    paddingBottom: 16,
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


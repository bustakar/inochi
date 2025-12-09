import { useAuth, useUser } from "@clerk/clerk-expo";
import {
  ContentUnavailableView,
  Host,
  HStack,
  List,
  Section,
  Spacer,
  Text as SwiftUIText,
  VStack,
} from "@expo/ui/swift-ui";
import {
  background,
  cornerRadius,
  foregroundStyle,
  padding,
} from "@expo/ui/swift-ui/modifiers";
import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { exerciseLevelColors } from "../../../utils/exercise-utils";

interface Trophy {
  _id: Id<"exercises">;
  title: string;
  level: string;
  difficulty: number;
  status: string;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function PowerLevelDisplay({ powerLevel }: { powerLevel: number }) {
  const [displayedLevel, setDisplayedLevel] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const duration = 1500;
    const steps = 60;
    const increment = powerLevel / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(increment * step, powerLevel);
      setDisplayedLevel(Math.floor(current));

      if (step >= steps) {
        setDisplayedLevel(powerLevel);
        clearInterval(timer);
        setTimeout(() => setIsAnimating(false), 300);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [powerLevel]);

  return (
    <VStack alignment="leading" spacing={8}>
      <HStack spacing={8} alignment="center">
        <SwiftUIText size={20}>⚡</SwiftUIText>
        <SwiftUIText size={13} color="#71717A" weight="medium">
          POWER LEVEL
        </SwiftUIText>
      </HStack>
      <SwiftUIText
        size={64}
        weight="bold"
        color={isAnimating ? "#EAB308" : undefined}
      >
        {displayedLevel.toLocaleString()}
      </SwiftUIText>
      <SwiftUIText size={14} color="#71717A">
        Based on your progress on exercises
      </SwiftUIText>
    </VStack>
  );
}

function ArchetypeDisplay({
  archetype,
}: {
  archetype: { slug: string; title: string; description: string };
}) {
  // Map archetype to emoji
  const archetypeEmojis: Record<string, string> = {
    "hand-balancer": "🤲",
    "bar-warrior": "💪",
    "ring-master": "🎯",
    gymnast: "🤸",
    "street-athlete": "⚡",
    "the-t-rex": "🦖",
    "push-specialist": "👊",
    "pull-specialist": "💪",
    "core-specialist": "🔥",
    "leg-specialist": "🦵",
    "skill-specialist": "⭐",
    beginner: "🌱",
  };
  const emoji = archetypeEmojis[archetype.slug] ?? "⭐";

  return (
    <HStack spacing={12} alignment="center">
      <HStack
        modifiers={[
          padding({ all: 12 }),
          background("#F4F4F5"),
          cornerRadius(16),
        ]}
        alignment="center"
      >
        <SwiftUIText size={24}>{emoji}</SwiftUIText>
      </HStack>
      <VStack alignment="leading" spacing={4}>
        <SwiftUIText size={13} color="#71717A" weight="medium">
          CLASS
        </SwiftUIText>
        <SwiftUIText size={20} weight="bold">
          {archetype.title}
        </SwiftUIText>
        <SwiftUIText size={14} color="#71717A">
          {archetype.description}
        </SwiftUIText>
      </VStack>
    </HStack>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <HStack alignment="center" spacing={8}>
      <SwiftUIText size={17}>{label}</SwiftUIText>
      <Spacer />
      <SwiftUIText size={17} weight="semibold" color="#0D87E1">
        {value.toLocaleString()}
      </SwiftUIText>
    </HStack>
  );
}

function TrophyRow({ trophy, index }: { trophy: Trophy; index: number }) {
  const trophyEmojis = ["🏆", "🥈", "⭐"];
  const emoji = trophyEmojis[index] ?? "⭐";

  const levelColors =
    exerciseLevelColors[trophy.level as keyof typeof exerciseLevelColors];

  return (
    <HStack spacing={12} alignment="center">
      <HStack
        modifiers={[
          padding({ all: 10 }),
          background("#F4F4F5"),
          cornerRadius(12),
        ]}
        alignment="center"
      >
        <SwiftUIText size={20}>{emoji}</SwiftUIText>
      </HStack>
      <VStack alignment="leading" spacing={6}>
        <SwiftUIText size={17} weight="semibold">
          {trophy.title}
        </SwiftUIText>
        <HStack spacing={6}>
          <HStack
            spacing={4}
            modifiers={[
              padding({ all: 4 }),
              background(levelColors.bg),
              cornerRadius(6),
            ]}
          >
            <SwiftUIText size={12} color={levelColors.text}>
              {capitalize(trophy.level)}
            </SwiftUIText>
          </HStack>
          <HStack
            spacing={4}
            modifiers={[
              padding({ all: 4 }),
              background("#F4F4F5"),
              cornerRadius(6),
            ]}
          >
            <SwiftUIText size={12} color="#71717A">
              {`${trophy.difficulty}/10`}
            </SwiftUIText>
          </HStack>
          <HStack
            spacing={4}
            modifiers={[
              padding({ all: 4 }),
              background(trophy.status === "master" ? "#FEF9C3" : "#E9D5FF"),
              cornerRadius(6),
            ]}
          >
            <SwiftUIText
              size={12}
              color={trophy.status === "master" ? "#854D0E" : "#6B21A8"}
            >
              {trophy.status === "master" ? "Master" : "Journeyman"}
            </SwiftUIText>
          </HStack>
        </HStack>
      </VStack>
    </HStack>
  );
}

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const stats = useQuery(api.functions.userProfile.getUserProfileStats);

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            void signOut().then(() => {
              router.replace("/");
            });
          },
        },
      ],
      { cancelable: true },
    );
  };

  if (stats === undefined) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0D87E1" />
          <Text style={styles.emptyText}>Loading profile stats...</Text>
        </View>
      </View>
    );
  }

  const hasNoData = stats.powerLevel === 0 && stats.trophyCase.length === 0;

  if (hasNoData) {
    return (
      <Host style={styles.container}>
        <View style={styles.centerContainer}>
          <ContentUnavailableView
            title="No progress yet"
            description="Start mastering exercises to see your profile stats!"
          />
        </View>
        <List listStyle="insetGrouped">
          <Section title="Account">
            {user?.emailAddresses[0]?.emailAddress && (
              <VStack spacing={4}>
                <SwiftUIText size={17}>
                  {user.emailAddresses[0].emailAddress}
                </SwiftUIText>
              </VStack>
            )}
            <VStack
              spacing={4}
              modifiers={[foregroundStyle("#EF4444")]}
              onPress={handleSignOut}
            >
              <SwiftUIText size={17} color="#EF4444">
                Sign Out
              </SwiftUIText>
            </VStack>
          </Section>
        </List>
      </Host>
    );
  }

  return (
    <Host style={styles.container}>
      <List listStyle="insetGrouped">
        {/* Power Level Section */}
        <Section title="Power Level">
          <PowerLevelDisplay powerLevel={stats.powerLevel} />
        </Section>

        {/* Archetype Section */}
        <Section title="Class">
          <ArchetypeDisplay archetype={stats.archetype} />
        </Section>

        {/* Stats Section */}
        <Section title="Stats">
          <StatRow label="Push" value={stats.spiderStats.push} />
          <StatRow label="Pull" value={stats.spiderStats.pull} />
          <StatRow label="Core" value={stats.spiderStats.core} />
          <StatRow label="Legs" value={stats.spiderStats.legs} />
        </Section>

        {/* Trophy Case Section */}
        <Section title="Trophy Case">
          {stats.trophyCase.length === 0 ? (
            <VStack
              spacing={8}
              alignment="center"
              modifiers={[padding({ all: 32 })]}
            >
              <SwiftUIText size={48}>🏆</SwiftUIText>
              <SwiftUIText size={14} color="#71717A">
                Master exercises to earn trophies!
              </SwiftUIText>
            </VStack>
          ) : (
            stats.trophyCase.map((trophy, index) => (
              <TrophyRow key={trophy._id} trophy={trophy} index={index} />
            ))
          )}
        </Section>

        {/* Account Section */}
        <Section title="Account">
          {user?.emailAddresses[0]?.emailAddress && (
            <VStack spacing={4}>
              <SwiftUIText size={17}>
                {user.emailAddresses[0].emailAddress}
              </SwiftUIText>
            </VStack>
          )}
          <VStack
            spacing={4}
            modifiers={[foregroundStyle("#EF4444")]}
            onPress={handleSignOut}
          >
            <SwiftUIText size={17} color="#EF4444">
              Sign Out
            </SwiftUIText>
          </VStack>
        </Section>
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

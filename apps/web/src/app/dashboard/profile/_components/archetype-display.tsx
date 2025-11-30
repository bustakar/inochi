"use client";

import { Activity, Award, Dumbbell, Hand, Target, Zap } from "lucide-react";

import { Card, cn } from "@inochi/ui";

interface ArchetypeDisplayProps {
  archetype: {
    slug: string;
    title: string;
    description: string;
  };
}

const archetypeVisualConfig: Record<
  string,
  { icon: typeof Award; color: string }
> = {
  "hand-balancer": {
    icon: Hand,
    color: "text-purple-500",
  },
  "bar-warrior": {
    icon: Dumbbell,
    color: "text-blue-500",
  },
  "ring-master": {
    icon: Target,
    color: "text-orange-500",
  },
  gymnast: {
    icon: Activity,
    color: "text-green-500",
  },
  "street-athlete": {
    icon: Zap,
    color: "text-yellow-500",
  },
  "the-t-rex": {
    icon: Dumbbell,
    color: "text-red-500",
  },
  "push-specialist": {
    icon: Hand,
    color: "text-blue-500",
  },
  "pull-specialist": {
    icon: Dumbbell,
    color: "text-green-500",
  },
  "core-specialist": {
    icon: Activity,
    color: "text-purple-500",
  },
  "leg-specialist": {
    icon: Zap,
    color: "text-orange-500",
  },
  "skill-specialist": {
    icon: Target,
    color: "text-yellow-500",
  },
  beginner: {
    icon: Award,
    color: "text-gray-500",
  },
};

export function ArchetypeDisplay({ archetype }: ArchetypeDisplayProps) {
  const visualConfig = archetypeVisualConfig[archetype.slug] ??
    archetypeVisualConfig["beginner"] ??
    archetypeVisualConfig["street-athlete"] ?? {
      icon: Award,
      color: "text-gray-500",
    };

  const Icon = visualConfig.icon;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "bg-muted flex h-16 w-16 items-center justify-center rounded-full",
            visualConfig.color,
          )}
        >
          <Icon className="h-8 w-8" />
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
              Class
            </span>
          </div>
          <h2 className="text-2xl font-bold">{archetype.title}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {archetype.description}
          </p>
        </div>
      </div>
    </Card>
  );
}

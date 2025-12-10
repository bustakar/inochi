"use client";

import { HealthBar } from "@inochi/ui";

interface CharacterAttributesProps {
  stats: {
    push: number;
    pull: number;
    core: number;
    legs: number;
  };
}

export function CharacterAttributes({ stats }: CharacterAttributesProps) {
  // Calculate max value from all stats to scale the health bars
  const maxValue = 5;

  const attributes = [
    { name: "Push", value: stats.push },
    { name: "Pull", value: stats.pull },
    { name: "Core", value: stats.core },
    { name: "Legs", value: stats.legs },
  ];

  return (
    <div className="space-y-6">
      {attributes.map((attr) => {
        const percentage = (attr.value / maxValue) * 100;
        return (
          <div key={attr.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="retro text-sm font-semibold">{attr.name}</span>
              <span className="retro text-muted-foreground text-sm">
                {attr.value.toFixed(1)}/{maxValue.toFixed(1)}
              </span>
            </div>
            <HealthBar
              value={percentage}
              sections={20}
              className="h-6"
              progressBg="bg-primary"
            />
          </div>
        );
      })}
    </div>
  );
}

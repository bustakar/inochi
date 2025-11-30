"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface SpiderChartProps {
  stats: {
    push: number;
    pull: number;
    core: number;
    legs: number;
    skill: number;
  };
}

export function SpiderChart({ stats }: SpiderChartProps) {
  // Calculate max value for consistent scaling
  const maxValue = Math.max(
    stats.push,
    stats.pull,
    stats.core,
    stats.legs,
    stats.skill,
    100, // Minimum scale
  );

  const data = [
    {
      category: "Push",
      value: stats.push,
      fullMark: maxValue,
    },
    {
      category: "Pull",
      value: stats.pull,
      fullMark: maxValue,
    },
    {
      category: "Core",
      value: stats.core,
      fullMark: maxValue,
    },
    {
      category: "Legs",
      value: stats.legs,
      fullMark: maxValue,
    },
    {
      category: "Skill",
      value: stats.skill,
      fullMark: maxValue,
    },
  ];

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="hsl(var(--muted-foreground))" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, maxValue]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          />
          <Radar
            name="Stats"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}


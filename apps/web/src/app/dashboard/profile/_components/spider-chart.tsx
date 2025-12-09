"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

interface SpiderChartProps {
  stats: {
    push: number;
    pull: number;
    core: number;
    legs: number;
  };
}

export function SpiderChart({ stats }: SpiderChartProps) {
  const maxValue = Math.max(stats.push, stats.pull, stats.core, stats.legs, 1);

  const viewportMax = maxValue + 1;

  const data = [
    {
      category: "Push",
      value: stats.push,
      fullMark: viewportMax,
    },
    {
      category: "Pull",
      value: stats.pull,
      fullMark: viewportMax,
    },
    {
      category: "Core",
      value: stats.core,
      fullMark: viewportMax,
    },
    {
      category: "Legs",
      value: stats.legs,
      fullMark: viewportMax,
    },
  ];

  return (
    <div className="h-[400px] min-h-[400px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="hsl(var(--muted-foreground))" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, viewportMax]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            tickFormatter={(value: number) => value.toFixed(1)}
            allowDuplicatedCategory={false}
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

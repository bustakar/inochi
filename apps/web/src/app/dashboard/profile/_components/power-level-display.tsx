"use client";

import { useEffect, useState } from "react";
import { Card } from "@inochi/ui";
import { Zap } from "lucide-react";

interface PowerLevelDisplayProps {
  powerLevel: number;
}

export function PowerLevelDisplay({ powerLevel }: PowerLevelDisplayProps) {
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
    <Card className="relative overflow-hidden p-8">
      <div className="relative z-10">
        <div className="mb-2 flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <span className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
            Power Level
          </span>
        </div>
        <div
          className={`text-6xl font-bold transition-all duration-300 md:text-8xl ${
            isAnimating
              ? "pl-8 scale-110 text-yellow-500 drop-shadow-lg"
              : "text-foreground"
          }`}
        >
          {displayedLevel.toLocaleString()}
        </div>
        <p className="text-muted-foreground mt-2 text-sm">
          Based on your mastered exercises
        </p>
      </div>
      {/* Glow effect */}
      {isAnimating && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-yellow-500/20 via-yellow-400/20 to-yellow-500/20 blur-xl" />
      )}
    </Card>
  );
}


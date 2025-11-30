"use client";

import type { ExerciseVariant } from "@packages/backend/convex/validators/validators";
import * as React from "react";
import { ChevronLeft, ChevronRight, Link as LinkIcon } from "lucide-react";

import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@inochi/ui";

// ============================================================================
// Exercise Variants Section Component (Read-only)
// ============================================================================

interface ExerciseVariantsReadonlyProps {
  variants: ExerciseVariant[];
}

export function ExerciseVariantsReadonly({
  variants,
}: ExerciseVariantsReadonlyProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  if (variants.length === 0) {
    return (
      <div>
        <h2 className="text-foreground mb-4 text-lg font-semibold">Variants</h2>
        <Card>
          <CardContent className="py-6">
            <p className="text-muted-foreground text-center text-sm">
              No variants available for this exercise.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentVariant = variants[currentIndex];

  if (currentVariant === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">No variant found.</p>
      </div>
    );
  }

  const hasMultipleVariants = variants.length > 1;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? variants.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === variants.length - 1 ? 0 : prev + 1));
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-foreground text-lg font-semibold">Variants</h2>
        {hasMultipleVariants && (
          <ButtonGroup>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </ButtonGroup>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {currentVariant.overriddenTitle ?? "Default Variant"}
            </CardTitle>
            {hasMultipleVariants && (
              <span className="text-muted-foreground text-sm">
                {currentIndex + 1} / {variants.length}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentVariant.overriddenDescription && (
            <div>
              <h3 className="text-foreground mb-2 text-sm font-medium">
                Description
              </h3>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {currentVariant.overriddenDescription}
              </p>
            </div>
          )}

          {currentVariant.overriddenDifficulty !== undefined && (
            <div>
              <h3 className="text-foreground mb-2 text-sm font-medium">
                Difficulty
              </h3>
              <Badge variant="secondary">
                {currentVariant.overriddenDifficulty}/10
              </Badge>
            </div>
          )}

          {/* {currentVariant.equipment.length > 0 && (
            <div>
              <h3 className="text-foreground mb-2 text-sm font-medium">
                Equipment
              </h3>
              <div className="flex flex-wrap gap-2">
                {currentVariant.equipment.map((eq) => (
                  <Badge key={eq._id} variant="secondary">
                    {eq.name}
                  </Badge>
                ))}
              </div>
            </div>
          )} */}

          {currentVariant.tips.length > 0 && (
            <div>
              <h3 className="text-foreground mb-3 text-sm font-medium">Tips</h3>
              <div className="space-y-3">
                {currentVariant.tips.map((tip, index) => (
                  <div
                    key={index}
                    className="bg-muted/30 flex flex-row items-start justify-between gap-2 rounded-lg border p-2"
                  >
                    {tip.text && (
                      <p className="text-foreground text-sm">{tip.text}</p>
                    )}
                    <div className="flex flex-row items-center gap-2">
                      {tip.videoUrl && (
                        <a
                          href={tip.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
                        >
                          <LinkIcon className="h-4 w-4" />
                          Watch video
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

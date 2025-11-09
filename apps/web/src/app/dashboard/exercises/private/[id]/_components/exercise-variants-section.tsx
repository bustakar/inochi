"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { ChevronLeft, ChevronRight, Edit, Plus } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@inochi/ui";

// ============================================================================
// Exercise Variants Section Component
// ============================================================================

interface ExerciseVariantsSectionProps {
  exerciseId: Id<"private_exercises">;
}

export function ExerciseVariantsSection({
  exerciseId,
}: ExerciseVariantsSectionProps) {
  const variants = useQuery(api.functions.exercises.getExerciseVariants, {
    exerciseId,
  });

  const [currentIndex, setCurrentIndex] = React.useState(0);

  if (variants === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading variants...</p>
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-foreground text-lg font-semibold">Variants</h2>
          <Button variant="outline" size="sm" onClick={() => {}}>
            <Plus className="mr-2 h-4 w-4" />
            Create Variant
          </Button>
        </div>
        <Card>
          <CardContent className="py-6">
            <p className="text-muted-foreground text-center text-sm">
              No variants yet. Create your first variant to get started.
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
        <div className="flex items-center gap-2">
          {hasMultipleVariants && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={variants.length === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-muted-foreground text-sm">
                {currentIndex + 1} / {variants.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={variants.length === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => {}}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => {}}>
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {currentVariant.overriddenTitle || "Default Variant"}
          </CardTitle>
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

          {currentVariant.equipment.length > 0 && (
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
          )}

          {currentVariant.tips.length > 0 && (
            <div>
              <h3 className="text-foreground mb-2 text-sm font-medium">Tips</h3>
              <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
                {currentVariant.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {currentVariant.embedded_videos.length > 0 && (
            <div>
              <h3 className="text-foreground mb-2 text-sm font-medium">
                Videos
              </h3>
              <div className="space-y-2">
                {currentVariant.embedded_videos.map((videoUrl, index) => (
                  <div key={index} className="aspect-video w-full">
                    <iframe
                      src={videoUrl}
                      className="h-full w-full rounded-md"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
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

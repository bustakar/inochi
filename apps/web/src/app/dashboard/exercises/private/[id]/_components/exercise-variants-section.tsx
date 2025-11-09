"use client";

import * as React from "react";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { ChevronLeft, ChevronRight, Edit, Plus } from "lucide-react";

import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@inochi/ui";

import { CreateVariantDialog } from "./create-variant-dialog";

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
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingVariantId, setEditingVariantId] = React.useState<
    Id<"exercise_variants"> | undefined
  >(undefined);

  if (variants === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading variants...</p>
      </div>
    );
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingVariantId(undefined);
    }
  };

  if (variants.length === 0) {
    const handleCreate = () => {
      setEditingVariantId(undefined);
      setDialogOpen(true);
    };
    return (
      <>
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-foreground text-lg font-semibold">Variants</h2>
            <Button variant="outline" size="sm" onClick={handleCreate}>
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
        <CreateVariantDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          exerciseId={exerciseId}
        />
      </>
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

  const handleCreate = () => {
    setEditingVariantId(undefined);
    setDialogOpen(true);
  };

  const handleEdit = () => {
    setEditingVariantId(currentVariant._id);
    setDialogOpen(true);
  };

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
            </>
          )}
          <ButtonGroup>
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create
            </Button>
          </ButtonGroup>
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
      <CreateVariantDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        exerciseId={exerciseId}
        variantId={editingVariantId}
      />
    </div>
  );
}

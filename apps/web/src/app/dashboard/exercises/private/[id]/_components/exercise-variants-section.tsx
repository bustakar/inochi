"use client";

import * as React from "react";
import Link from "next/link";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { GetExerciseVariantResponse } from "@packages/backend/convex/functions/exerciseVariants";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Link as LinkIcon,
  Plus,
} from "lucide-react";

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
  variants: Array<GetExerciseVariantResponse>;
}

export function ExerciseVariantsSection({
  exerciseId,
  variants,
}: ExerciseVariantsSectionProps) {
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

          {currentVariant.tipsV2?.length > 0 && (
            <div>
              <h3 className="text-foreground mb-3 text-sm font-medium">Tips</h3>
              <div className="space-y-3">
                {currentVariant.tipsV2?.map((tip, index) => {
                  return (
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
                        {tip.exerciseReference && (
                          <div>
                            <Link
                              href={`/dashboard/exercises/private/${tip.exerciseReference._id}`}
                              className="transition-opacity hover:opacity-80"
                            >
                              <Badge
                                variant="secondary"
                                className="cursor-pointer"
                              >
                                {tip.exerciseReference.title}
                              </Badge>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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

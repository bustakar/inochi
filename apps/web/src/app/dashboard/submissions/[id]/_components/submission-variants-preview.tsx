"use client";

import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Dumbbell, Video } from "lucide-react";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@inochi/ui";

interface TipV2 {
  text: string;
  videoUrl?: string;
  exerciseReference?: Id<"exercises"> | Id<"private_exercises">;
}

interface VariantData {
  exercise: Id<"exercises"> | Id<"private_exercises">;
  equipment: Array<Id<"equipment">>;
  tipsV2?: TipV2[];
  overriddenTitle?: string;
  overriddenDescription?: string;
  overriddenDifficulty?: number;
}

interface SubmissionVariantsPreviewProps {
  variants: VariantData[];
}

function EquipmentList({
  equipmentIds,
}: {
  equipmentIds: Array<Id<"equipment">>;
}) {
  const allEquipment = useQuery(api.functions.exercises.getEquipment);

  if (equipmentIds.length === 0) {
    return (
      <span className="text-muted-foreground text-sm">
        No equipment (bodyweight)
      </span>
    );
  }

  if (allEquipment === undefined) {
    return <span className="text-muted-foreground text-sm">Loading...</span>;
  }

  const equipmentNames = equipmentIds
    .map((id) => allEquipment.find((e) => e._id === id)?.name)
    .filter(Boolean);

  return (
    <div className="flex flex-wrap gap-1">
      {equipmentNames.map((name) => (
        <Badge key={name} variant="outline" className="text-xs">
          <Dumbbell className="mr-1 h-3 w-3" />
          {name}
        </Badge>
      ))}
    </div>
  );
}

function VariantCard({
  variant,
  index,
}: {
  variant: VariantData;
  index: number;
}) {
  const hasOverrides =
    variant.overriddenTitle ||
    variant.overriddenDescription ||
    variant.overriddenDifficulty;

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-start justify-between">
        <h4 className="font-medium">
          {variant.overriddenTitle ?? `Variant ${index + 1}`}
        </h4>
        {variant.overriddenDifficulty && (
          <Badge variant="secondary" className="text-xs">
            Difficulty: {variant.overriddenDifficulty}/10
          </Badge>
        )}
      </div>

      {/* Equipment */}
      <div className="mb-3">
        <span className="text-muted-foreground mb-1 block text-xs font-medium">
          Equipment
        </span>
        <EquipmentList equipmentIds={variant.equipment} />
      </div>

      {/* Overridden description */}
      {variant.overriddenDescription && (
        <div className="mb-3">
          <span className="text-muted-foreground mb-1 block text-xs font-medium">
            Description Override
          </span>
          <p className="text-sm">{variant.overriddenDescription}</p>
        </div>
      )}

      {/* Tips */}
      {variant.tipsV2 && variant.tipsV2.length > 0 && (
        <div>
          <span className="text-muted-foreground mb-2 block text-xs font-medium">
            Tips ({variant.tipsV2.length})
          </span>
          <ul className="space-y-2">
            {variant.tipsV2.map((tip, tipIndex) => (
              <li key={tipIndex} className="bg-muted/50 rounded-md p-2 text-sm">
                <p>{tip.text}</p>
                {tip.videoUrl && (
                  <a
                    href={tip.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary mt-1 inline-flex items-center text-xs hover:underline"
                  >
                    <Video className="mr-1 h-3 w-3" />
                    Watch video
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function SubmissionVariantsPreview({
  variants,
}: SubmissionVariantsPreviewProps) {
  if (variants.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Variants ({variants.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {variants.map((variant, index) => (
          <VariantCard key={index} variant={variant} index={index} />
        ))}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { api } from "@packages/backend/convex/_generated/api";
import { Doc, Id } from "@packages/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
} from "@inochi/ui";

const levelColors: Record<
  "beginner" | "intermediate" | "advanced" | "expert" | "elite",
  string
> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  intermediate: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  advanced:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  expert:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  elite: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

function SkillHeader({
  skill,
  skillId,
  onDeleteClick,
}: {
  skill: Doc<"private_skills">;
  skillId: Id<"private_skills">;
  onDeleteClick: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/skills">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-3xl font-bold">{skill.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge
              className={
                levelColors[skill.level] ||
                "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
              }
            >
              {skill.level}
            </Badge>
            <Badge variant="outline">Private</Badge>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/dashboard/skills/private/${skillId}/edit`)
          }
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button variant="destructive" onClick={onDeleteClick}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

function DescriptionSection({ description }: { description: string }) {
  return (
    <div>
      <h2 className="text-foreground mb-2 text-lg font-semibold">
        Description
      </h2>
      <p className="text-muted-foreground whitespace-pre-wrap">{description}</p>
    </div>
  );
}

function DifficultySection({ difficulty }: { difficulty: number }) {
  return (
    <div>
      <h2 className="text-foreground mb-2 text-lg font-semibold">Difficulty</h2>
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`h-3 w-3 rounded-full ${
                i < difficulty ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className="text-muted-foreground text-sm">{difficulty}/10</span>
      </div>
    </div>
  );
}

function MusclesSection({
  muscleIds,
  muscles,
}: {
  muscleIds: Id<"muscles">[];
  muscles: Doc<"muscles">[] | undefined;
}) {
  const muscleData = muscles?.filter((m) => muscleIds.includes(m._id)) || [];

  return (
    <div>
      <h2 className="text-foreground mb-2 text-lg font-semibold">Muscles</h2>
      {muscleData.length === 0 ? (
        <p className="text-muted-foreground text-sm">No muscles selected</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {muscleData.map((muscle) => (
            <Badge key={muscle._id} variant="outline">
              {muscle.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function EquipmentSection({
  equipmentIds,
  equipment,
}: {
  equipmentIds: Id<"equipment">[];
  equipment: Doc<"equipment">[] | undefined;
}) {
  const equipmentData =
    equipment?.filter((e) => equipmentIds.includes(e._id)) || [];

  return (
    <div>
      <h2 className="text-foreground mb-2 text-lg font-semibold">Equipment</h2>
      {equipmentData.length === 0 ? (
        <p className="text-muted-foreground text-sm">No equipment selected</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {equipmentData.map((item) => (
            <Badge key={item._id} variant="outline">
              {item.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function PrerequisitesSection({
  prerequisiteIds,
  allSkills,
}: {
  prerequisiteIds: Array<Id<"skills"> | Id<"private_skills">>;
  allSkills:
    | Array<
        | (Doc<"skills"> & { isPrivate: false })
        | (Doc<"private_skills"> & { isPrivate: true })
      >
    | undefined;
}) {
  const prerequisiteSkills =
    allSkills?.filter((s) => prerequisiteIds.includes(s._id)) || [];

  return (
    <div>
      <h2 className="text-foreground mb-2 text-lg font-semibold">
        Prerequisites
      </h2>
      {prerequisiteSkills.length === 0 ? (
        <p className="text-muted-foreground text-sm">No prerequisites</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {prerequisiteSkills.map((prereq) => (
            <Badge key={prereq._id} variant="secondary">
              {prereq.title}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function VariantsSection({
  variantIds,
  allSkills,
}: {
  variantIds: Array<Id<"skills"> | Id<"private_skills">>;
  allSkills:
    | Array<
        | (Doc<"skills"> & { isPrivate: false })
        | (Doc<"private_skills"> & { isPrivate: true })
      >
    | undefined;
}) {
  const variantSkills =
    allSkills?.filter((s) => variantIds.includes(s._id)) || [];

  return (
    <div>
      <h2 className="text-foreground mb-2 text-lg font-semibold">Variants</h2>
      {variantSkills.length === 0 ? (
        <p className="text-muted-foreground text-sm">No variants</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {variantSkills.map((variant) => (
            <Badge key={variant._id} variant="secondary">
              {variant.title}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function VideosSection({ videos }: { videos: string[] }) {
  return (
    <div>
      <h2 className="text-foreground mb-2 text-lg font-semibold">Videos</h2>
      {videos.length === 0 ? (
        <p className="text-muted-foreground text-sm">No videos added</p>
      ) : (
        <div className="space-y-2">
          {videos.map((url, index) => (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary block hover:underline"
            >
              {url}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function TipsSection({ tips }: { tips: string[] }) {
  return (
    <div>
      <h2 className="text-foreground mb-2 text-lg font-semibold">Tips</h2>
      {tips.length === 0 ? (
        <p className="text-muted-foreground text-sm">No tips added</p>
      ) : (
        <ul className="list-inside list-disc space-y-1">
          {tips.map((tip, index) => (
            <li key={index} className="text-muted-foreground">
              {tip}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DeleteDialog({
  open,
  onOpenChange,
  skillTitle,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skillTitle: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Skill</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{skillTitle}"? This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function PrivateSkillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const skillId = params.id as Id<"private_skills">;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { isLoaded: isUserLoaded } = useUser();

  const skill = useQuery(
    api.functions.skills.getPrivateSkillById,
    isUserLoaded ? { private_skill_id: skillId } : "skip",
  );
  const muscles = useQuery(api.functions.skills.getMuscles, {});
  const equipment = useQuery(api.functions.skills.getEquipment, {});
  const allSkills = useQuery(api.functions.skills.getAllSkills, {
    type: "all",
  });
  const deletePrivateSkill = useMutation(
    api.functions.skills.deletePrivateSkill,
  );

  const handleDelete = async () => {
    try {
      await deletePrivateSkill({ id: skillId });
      toast.success("Skill deleted successfully");
      router.push("/dashboard/skills");
    } catch (error) {
      console.error("Error deleting skill:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete skill. Please try again.",
      );
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  if (!isUserLoaded || skill === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading skill...</p>
      </div>
    );
  }

  if (skill === null) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <p className="text-muted-foreground">Skill not found.</p>
        <Link href="/dashboard/skills">
          <Button variant="outline">Back to Skills</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SkillHeader
        skill={skill}
        skillId={skillId}
        onDeleteClick={() => setDeleteDialogOpen(true)}
      />

      <div className="space-y-6">
        <DescriptionSection description={skill.description} />
        <DifficultySection difficulty={skill.difficulty} />
        <div className="grid gap-6 md:grid-cols-2">
          <MusclesSection muscleIds={skill.muscles} muscles={muscles} />
          <EquipmentSection
            equipmentIds={skill.equipment}
            equipment={equipment}
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <VideosSection videos={skill.embedded_videos} />
          <TipsSection tips={skill.tips} />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <PrerequisitesSection
            prerequisiteIds={skill.prerequisites}
            allSkills={allSkills}
          />
          <VariantsSection variantIds={skill.variants} allSkills={allSkills} />
        </div>
      </div>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        skillTitle={skill.title}
        onConfirm={handleDelete}
      />
    </div>
  );
}

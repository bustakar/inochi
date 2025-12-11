"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/clerk-react";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  Edit,
  Eye,
  EyeOff,
  Folder,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Spinner,
} from "@inochi/ui";

// ============================================================================
// Loading States
// ============================================================================

function LoadingState() {
  return (
    <div className="flex items-center justify-center p-8">
      <Spinner />
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

interface EmptyStateProps {
  isAdmin: boolean;
  onCreateClick: () => void;
}

function EmptyState({ isAdmin, onCreateClick }: EmptyStateProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Folder className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>No exercise trees available</EmptyTitle>
            <EmptyDescription>
              Hopefully someone will add some trees soon.
            </EmptyDescription>
          </EmptyHeader>
          {isAdmin && (
            <EmptyContent>
              <Button onClick={onCreateClick}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Raid
              </Button>
            </EmptyContent>
          )}
        </Empty>
      </div>
    </div>
  );
}

// ============================================================================
// Tree Card Component
// ============================================================================

interface TreeCardProps {
  tree: {
    _id: Id<"exercise_trees">;
    title: string;
    status: "draft" | "published";
    muscleGroups: string[];
  };
  isAdmin: boolean;
  onCardClick: (e: React.MouseEvent, treeId: Id<"exercise_trees">) => void;
  onEdit: (id: Id<"exercise_trees">) => void;
  onDelete: (id: Id<"exercise_trees">) => void;
  onTogglePublish: (
    id: Id<"exercise_trees">,
    status: "draft" | "published",
  ) => void;
}

function TreeCard({
  tree,
  isAdmin,
  onCardClick,
  onEdit,
  onDelete,
  onTogglePublish,
}: TreeCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-col",
        "cursor-pointer transition-transform active:translate-y-1",
      )}
      onClick={(e) => onCardClick(e, tree._id)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1 flex-1">{tree.title}</CardTitle>
          {isAdmin && (
            <TreeCardMenu
              treeId={tree._id}
              status={tree.status}
              onEdit={onEdit}
              onDelete={onDelete}
              onTogglePublish={onTogglePublish}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {isAdmin && (
          <div>
            <Badge
              variant={tree.status === "published" ? "default" : "secondary"}
            >
              {tree.status}
            </Badge>
          </div>
        )}
        {tree.muscleGroups.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tree.muscleGroups.map((group) => (
              <Badge key={group} variant="outline">
                {group}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No muscle groups</p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Tree Card Menu
// ============================================================================

interface TreeCardMenuProps {
  treeId: Id<"exercise_trees">;
  status: "draft" | "published";
  onEdit: (id: Id<"exercise_trees">) => void;
  onDelete: (id: Id<"exercise_trees">) => void;
  onTogglePublish: (
    id: Id<"exercise_trees">,
    status: "draft" | "published",
  ) => void;
}

function TreeCardMenu({
  treeId,
  status,
  onEdit,
  onDelete,
  onTogglePublish,
}: TreeCardMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">More options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(treeId)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onTogglePublish(treeId, status)}>
          {status === "published" ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Unpublish
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Publish
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(treeId)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Trees List
// ============================================================================

interface TreesListProps {
  trees: {
    _id: Id<"exercise_trees">;
    title: string;
    status: "draft" | "published";
    muscleGroups: string[];
  }[];
  isAdmin: boolean;
  onCardClick: (e: React.MouseEvent, treeId: Id<"exercise_trees">) => void;
  onEdit: (id: Id<"exercise_trees">) => void;
  onDelete: (id: Id<"exercise_trees">) => void;
  onTogglePublish: (
    id: Id<"exercise_trees">,
    status: "draft" | "published",
  ) => void;
}

function TreesList({
  trees,
  isAdmin,
  onCardClick,
  onEdit,
  onDelete,
  onTogglePublish,
}: TreesListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {trees.map((tree) => (
        <TreeCard
          key={tree._id}
          tree={tree}
          isAdmin={isAdmin}
          onCardClick={onCardClick}
          onEdit={onEdit}
          onDelete={onDelete}
          onTogglePublish={onTogglePublish}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Create Button
// ============================================================================

interface CreateButtonProps {
  onClick: () => void;
}

function CreateButton({ onClick }: CreateButtonProps) {
  return (
    <div className="flex justify-end">
      <Button onClick={onClick}>
        <Plus className="mr-2 h-4 w-4" />
        Create New Raid
      </Button>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function ExerciseTreesPage() {
  const router = useRouter();
  const { isLoaded } = useAuth();

  const query = useQuery(api.functions.exerciseTrees.list);
  const deleteTree = useMutation(api.functions.exerciseTrees.delete_);
  const publishTree = useMutation(api.functions.exerciseTrees.publish);
  const unpublishTree = useMutation(api.functions.exerciseTrees.unpublish);

  if (!isLoaded || query === undefined) {
    return <LoadingState />;
  }

  const { trees, isAdmin } = query;

  const handleCreateNew = () => {
    router.push("/dashboard/admin/exercise-trees/new");
  };

  const handleEdit = (id: Id<"exercise_trees">) => {
    router.push(`/dashboard/admin/exercise-trees/${id}`);
  };

  const handleDelete = async (id: Id<"exercise_trees">) => {
    if (confirm("Are you sure you want to delete this tree?")) {
      await deleteTree({ id });
    }
  };

  const handleTogglePublish = async (
    id: Id<"exercise_trees">,
    currentStatus: "draft" | "published",
  ) => {
    if (currentStatus === "draft") {
      await publishTree({ id });
    } else {
      await unpublishTree({ id });
    }
  };

  const handleCardClick = (
    e: React.MouseEvent,
    treeId: Id<"exercise_trees">,
  ) => {
    // Don't navigate if clicking on dropdown menu or its trigger
    const target = e.target as HTMLElement;
    if (
      target.closest('[role="menu"]') ||
      target.closest('[role="menuitem"]') ||
      target.closest('button[aria-haspopup="true"]')
    ) {
      return;
    }
    router.push(`/dashboard/exercise-trees/${treeId}`);
  };

  if (trees.length === 0) {
    return <EmptyState isAdmin={isAdmin} onCreateClick={handleCreateNew} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
        {isAdmin && <CreateButton onClick={handleCreateNew} />}
        <TreesList
          trees={trees}
          isAdmin={isAdmin}
          onCardClick={handleCardClick}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onTogglePublish={handleTogglePublish}
        />
      </div>
    </div>
  );
}

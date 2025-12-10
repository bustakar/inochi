"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/clerk-react";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Edit, Eye, EyeOff, MoreVertical, Plus, Trash2 } from "lucide-react";

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
} from "@inochi/ui";

export default function ExerciseTreesPage() {
  const router = useRouter();
  const { isLoaded } = useAuth();

  // Single query that handles role-based filtering on the server
  const result = useQuery(api.functions.exerciseTrees.listForUser, {});
  const deleteTree = useMutation(api.functions.exerciseTrees.delete_);
  const publishTree = useMutation(api.functions.exerciseTrees.publish);
  const unpublishTree = useMutation(api.functions.exerciseTrees.unpublish);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Handle loading state
  if (result === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading trees...</p>
      </div>
    );
  }

  // Handle error state (result is null or has error)
  if (!result || !result.trees) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-muted-foreground mb-2">
          Failed to load exercise trees.
        </p>
        <p className="text-muted-foreground text-sm">
          Please try refreshing the page.
        </p>
      </div>
    );
  }

  const { trees, isAdmin: isAdminOrMod } = result;

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

  if (trees.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
          {isAdminOrMod && (
            <div className="flex justify-end">
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Raid
              </Button>
            </div>
          )}
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">
              No exercise trees available.
            </p>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
        {/* Create New Button for Admins */}
        {isAdminOrMod && (
          <div className="flex justify-end">
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Raid
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {trees.map((tree) => (
            <Card
              key={tree._id}
              className={cn(
                "flex flex-col",
                "cursor-pointer transition-transform active:translate-y-1",
              )}
              onClick={(e) => handleCardClick(e, tree._id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-1 flex-1">
                    {tree.title}
                  </CardTitle>
                  {isAdminOrMod && (
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
                        <DropdownMenuItem onClick={() => handleEdit(tree._id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleTogglePublish(tree._id, tree.status)
                          }
                        >
                          {tree.status === "published" ? (
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
                          onClick={() => handleDelete(tree._id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                {isAdminOrMod && (
                  <div>
                    <Badge
                      variant={
                        tree.status === "published" ? "default" : "secondary"
                      }
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
                  <p className="text-muted-foreground text-sm">
                    No muscle groups
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

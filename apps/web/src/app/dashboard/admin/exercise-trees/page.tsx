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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@inochi/ui";

import { isClientAdminOrModerator } from "../../../../utils/roles";

export default function ExerciseTreesPage() {
  const router = useRouter();
  const { sessionClaims, isLoaded } = useAuth();
  const trees = useQuery(api.functions.exerciseTrees.listAll, {});
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

  const isAdminOrMod = isClientAdminOrModerator(sessionClaims);

  if (!isAdminOrMod) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <p className="text-muted-foreground">
          You don&apos;t have permission to access this page.
        </p>
      </div>
    );
  }

  if (trees === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading trees...</p>
      </div>
    );
  }

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

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      {trees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No exercise trees yet. Create your first one!
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Tree
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {trees.map((tree) => (
            <Card key={tree._id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-1 flex-1">
                    {tree.title}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
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
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div>
                  <Badge
                    variant={
                      tree.status === "published" ? "default" : "secondary"
                    }
                  >
                    {tree.status}
                  </Badge>
                </div>
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
      )}
    </div>
  );
}

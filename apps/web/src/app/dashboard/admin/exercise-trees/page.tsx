"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/clerk-react";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Edit, Eye, EyeOff, Plus, Trash2 } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exercise Trees</h1>
          <p className="text-muted-foreground mt-1">
            Manage exercise trees for the platform
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Tree
        </Button>
      </div>

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trees.map((tree) => (
            <Card key={tree._id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{tree.title}</CardTitle>
                    {tree.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {tree.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge
                    variant={
                      tree.status === "published" ? "default" : "secondary"
                    }
                  >
                    {tree.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <span>{tree.nodes.length} nodes</span>
                  <span>•</span>
                  <span>{tree.connections.length} connections</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(tree._id)}
                    className="flex-1"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePublish(tree._id, tree.status)}
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
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(tree._id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { Save, Eye, EyeOff, Settings, ArrowLeft, Trash2 } from "lucide-react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from "@inochi/ui";

interface TreeToolbarProps {
  treeId: Id<"exercise_trees">;
  title: string;
  description?: string;
  status: "draft" | "published";
  onSave: () => void;
  isSaving?: boolean;
}

export function TreeToolbar({
  treeId,
  title: initialTitle,
  description: initialDescription,
  status,
  onSave,
  isSaving = false,
}: TreeToolbarProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription || "");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const updateTree = useMutation(api.functions.exerciseTrees.update);
  const publishTree = useMutation(api.functions.exerciseTrees.publish);
  const unpublishTree = useMutation(api.functions.exerciseTrees.unpublish);
  const deleteTree = useMutation(api.functions.exerciseTrees.delete_);

  const handleSaveSettings = async () => {
    await updateTree({
      id: treeId,
      title,
      description: description || undefined,
    });
    setSettingsOpen(false);
  };

  const handleTogglePublish = async () => {
    if (status === "draft") {
      await publishTree({ id: treeId });
    } else {
      await unpublishTree({ id: treeId });
    }
  };

  const handleDelete = async () => {
    await deleteTree({ id: treeId });
    router.push("/dashboard/admin/exercise-trees");
  };

  return (
    <div className="bg-background border-b flex items-center gap-2 p-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/dashboard/admin/exercise-trees")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="flex-1" />

      <Button
        variant="outline"
        size="sm"
        onClick={() => setSettingsOpen(true)}
      >
        <Settings className="mr-2 h-4 w-4" />
        Settings
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleTogglePublish}
      >
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
      </Button>

      <Button
        variant="default"
        size="sm"
        onClick={onSave}
        disabled={isSaving}
      >
        <Save className="mr-2 h-4 w-4" />
        {isSaving ? "Saving..." : "Save"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setDeleteDialogOpen(true)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tree Settings</DialogTitle>
            <DialogDescription>
              Update the title and description of this exercise tree.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Exercise Tree Title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tree</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this exercise tree? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


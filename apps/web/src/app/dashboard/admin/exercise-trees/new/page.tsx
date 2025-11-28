"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/clerk-react";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";

import { isClientAdminOrModerator } from "../../../../../utils/roles";

export default function NewExerciseTreePage() {
  const router = useRouter();
  const { sessionClaims, isLoaded } = useAuth();
  const createTree = useMutation(api.functions.exerciseTrees.create);

  useEffect(() => {
    if (!isLoaded) return;

    const isAdminOrMod = isClientAdminOrModerator(sessionClaims);
    if (!isAdminOrMod) {
      router.push("/dashboard/exercises");
      return;
    }

    // Create a new tree and redirect to editor
    const createAndRedirect = async () => {
      try {
        const treeId = await createTree({
          title: "New Exercise Tree",
          description: "",
        });
        router.push(`/dashboard/admin/exercise-trees/${treeId}`);
      } catch (error) {
        console.error("Failed to create tree:", error);
        router.push("/dashboard/admin/exercise-trees");
      }
    };

    void createAndRedirect();
  }, [isLoaded, sessionClaims, createTree, router]);

  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-muted-foreground">Creating new tree...</p>
    </div>
  );
}

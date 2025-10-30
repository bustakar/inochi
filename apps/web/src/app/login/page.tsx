"use client";

import { SignIn, useUser } from "@clerk/clerk-react";
import { Spinner } from "@inochi/ui/Spinner";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Spinner />
        </div>
      </div>
    );
  }

  if (isSignedIn) {
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignIn />
      </div>
    </div>
  );
}

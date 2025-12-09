import Link from "next/link";

import { Button } from "@inochi/ui";

export default function CallToAction() {
  return (
    <section className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="retro text-4xl font-semibold text-balance lg:text-5xl">
            Your Adventure Awaits
          </h2>
          <p className="retro mt-4">
            Many exercises to unlock. Zero gold required to start.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/login">
                <span>Begin Your Quest</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

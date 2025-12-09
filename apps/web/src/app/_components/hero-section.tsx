import Link from "next/link";

import { Button, Card } from "@inochi/ui";

import { HeroHeader } from "./header";

export default function HeroSection() {
  return (
    <>
      <HeroHeader />
      <main className="overflow-hidden">
        <section>
          <div className="relative py-24 md:pt-36">
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mt-0 lg:mr-auto">
                <Card>
                  <h1 className="retro mx-auto my-8 max-w-4xl text-5xl text-balance max-md:font-semibold md:text-7xl lg:mt-16 xl:text-[5.25rem]">
                    Your Quest for Strength Begins
                  </h1>
                </Card>
                <p className="retro mx-auto mt-8 max-w-2xl text-lg text-balance">
                  Embark on an epic journey to master skills, track your
                  progress, and become the hero of your own adventure.
                </p>

                <div className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row">
                  <Button asChild size="lg" className="px-5 text-base">
                    <Link href="/login">
                      <span className="text-nowrap">Create Character</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

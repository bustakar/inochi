import type { ReactNode } from "react";

import { Card, CardContent, CardHeader } from "@inochi/ui";

const BookOpenIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
  >
    <path
      d="M3 3h8v2H3v12h8V5h2v12h8V5h-8V3h10v16H13v2h-2v-2H1V3h2zm16 7h-4v2h4v-2zm-4-3h4v2h-4V7zm2 6h-2v2h2v-2z"
      fill="currentColor"
    />
  </svg>
);

const MoonStarsIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M20 0h2v2h2v2h-2v2h-2V4h-2V2h2V0ZM8 4h8v2h-2v2h-2V6H8V4ZM6 8V6h2v2H6Zm0 8H4V8h2v8Zm2 2H6v-2h2v2Zm8 0v2H8v-2h8Zm2-2v2h-2v-2h2Zm-2-4v-2h2V8h2v8h-2v-4h-2Zm-4 0h4v2h-4v-2Zm0 0V8h-2v4h2Zm-8 6H2v2H0v2h2v2h2v-2h2v-2H4v-2Z" />
  </svg>
);

const DevicePhoneIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
  >
    <path
      d="M6 3h12v18H6V3zm10 16V5H8v14h8zm-5-4h2v2h-2v-2z"
      fill="currentColor"
    />
  </svg>
);

export default function Features() {
  return (
    <section className="bg-zinc-50 py-16 md:py-32 dark:bg-transparent">
      <div className="@container mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="retro text-4xl font-semibold text-balance lg:text-5xl">
            Your
            <br />
            Adventure Toolkit
          </h2>
          <p className="retro mt-4">
            Powerful tools to guide your journey from novice to master.
          </p>
        </div>
        <div className="mx-auto mt-8 grid max-w-sm gap-6 *:text-center md:mt-16 @min-4xl:max-w-full @min-4xl:grid-cols-3">
          <Card className="group">
            <CardHeader className="pb-3">
              <CardDecorator>
                <BookOpenIcon className="size-6" aria-hidden />
              </CardDecorator>

              <h3 className="retro mt-6 font-medium">The Codex</h3>
            </CardHeader>

            <CardContent>
              <p className="retro text-sm">
                Detailed guides for every exercise. Learn the secrets, master
                the technique, become unstoppable.
              </p>
            </CardContent>
          </Card>

          <Card className="group">
            <CardHeader className="pb-3">
              <CardDecorator>
                <MoonStarsIcon className="size-6" aria-hidden />
              </CardDecorator>

              <h3 className="retro mt-6 font-medium">
                Sage Advisor (coming soon)
              </h3>
            </CardHeader>

            <CardContent>
              <p className="retro mt-3 text-sm">
                Seek counsel from the oracle. Personalized advice for your
                unique path to greatness.
              </p>
            </CardContent>
          </Card>

          <Card className="group">
            <CardHeader className="pb-3">
              <CardDecorator>
                <DevicePhoneIcon className="size-6" aria-hidden />
              </CardDecorator>

              <h3 className="retro mt-6 font-medium">
                Play Anywhere (coming soon)
              </h3>
            </CardHeader>

            <CardContent>
              <p className="retro mt-3 text-sm">
                Your adventure continues wherever you go. Desktop or mobile.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
  <div className="border-foreground dark:border-ring relative mx-auto flex size-12 items-center justify-center border-2">
    {children}
  </div>
);

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { cn, Toaster } from "@inochi/ui";

import ConvexClientProvider from "./_components/ConvexClientProvider";
import { ThemeProvider } from "./_components/theme-provider";

import "~/app/styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_ENV === "production"
      ? "https://inochi.app"
      : "http://localhost:3000",
  ),
  title: "Inochi App",
  description: "This is an app to help you with your daily life.",
  openGraph: {
    title: "Inochi App",
    description: "This is an app to help you with your daily life.",
    url: "https://inochi.app",
    siteName: "Inochi App",
  },
  twitter: {
    card: "summary_large_image",
    site: "@karelbusta",
    creator: "@karelbusta",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          geistSans.variable,
          geistMono.variable,
        )}
      >
        <ThemeProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, Lato, Montserrat } from "next/font/google";

import { cn } from "@inochi/ui";

import ConvexClientProvider from "./_components/ConvexClientProvider";
import { ThemeProvider } from "./_components/theme-provider";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });
const lato = Lato({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inochi App",
  description: "This is an app to help you with your daily life.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(inter.className, montserrat.className, lato.className)}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

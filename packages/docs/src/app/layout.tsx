import "./global.css";
import { RootProvider } from "fumadocs-ui/provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
});

export function generateMetadata(): Metadata {
  const title = {
    template: "%s | Spotlight UI",
    default: "Spotlight UI - Observability Components",
  };
  const description = "Beautiful UI components for observability and distributed tracing. Built on shadcn/ui.";

  return {
    title,
    description,
    keywords: ["observability", "tracing", "components", "react", "typescript", "shadcn", "spotlight"],
    metadataBase: new URL("https://spotlightjs.com"),
    category: "development",
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    openGraph: {
      title,
      description,
      siteName: "Spotlight UI",
      url: "/",
      locale: "en_US",
      type: "website",
    },
  };
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}

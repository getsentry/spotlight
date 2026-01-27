"use client";

import { cn } from "@/lib/utils";
import { ArrowRight, Check, Copy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-2 hover:bg-muted rounded-md transition-colors"
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
    </button>
  );
}

const installCommand = "pnpm dlx shadcn@latest add span-tree -r https://spotlightjs.com/registry.json";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Spotlight UI</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Beautiful, customizable components for building observability and distributed tracing experiences. Built on
          shadcn/ui.
        </p>

        {/* Install Command */}
        <div className="mt-8 flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-3 font-mono text-sm">
          <span className="text-muted-foreground">$</span>
          <code className="flex-1 truncate">{installCommand}</code>
          <CopyButton text={installCommand} />
        </div>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/docs"
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground",
              "hover:bg-primary/90 transition-colors",
            )}
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/docs/components"
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-medium",
              "hover:bg-muted transition-colors",
            )}
          >
            View Components
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t px-6 py-8">
        <div className="mx-auto max-w-4xl text-center text-sm text-muted-foreground">
          <p>
            Built by{" "}
            <a href="https://sentry.io" className="underline hover:text-foreground" target="_blank" rel="noreferrer">
              Sentry
            </a>
            . The source code is available on{" "}
            <a
              href="https://github.com/getsentry/spotlight"
              className="underline hover:text-foreground"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </footer>
    </main>
  );
}

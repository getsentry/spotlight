"use client";

import { cn } from "@/lib/utils";
import { Activity, ArrowRight, Check, Copy, GitBranch, Paintbrush } from "lucide-react";
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

const components = [
  {
    name: "SpanTree",
    description: "Hierarchical waterfall visualization for distributed trace spans",
    href: "/docs/components/span-tree",
  },
  {
    name: "TraceItem",
    description: "Summary row component for displaying trace information",
    href: "/docs/components/trace-item",
  },
];

const features = [
  {
    icon: Activity,
    title: "Trace Visualization",
    description: "Display distributed traces with hierarchical span trees and timing waterfalls",
  },
  {
    icon: GitBranch,
    title: "shadcn/ui Compatible",
    description: "Built on the same patterns - install via CLI and customize to your needs",
  },
  {
    icon: Paintbrush,
    title: "Fully Customizable",
    description: "Components are added to your codebase - modify styles and behavior freely",
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
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

      {/* Components Section */}
      <section className="border-t px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-semibold">Components</h2>
          <p className="mt-2 text-center text-muted-foreground">
            Production-ready components for your observability UI
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {components.map(component => (
              <Link
                key={component.name}
                href={component.href}
                className={cn(
                  "group rounded-lg border p-6 transition-colors",
                  "hover:border-primary/50 hover:bg-muted/50",
                )}
              >
                <h3 className="font-semibold group-hover:text-primary transition-colors">{component.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{component.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 sm:grid-cols-3">
            {features.map(feature => (
              <div key={feature.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <feature.icon className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
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

"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

// Registry component metadata
const COMPONENT_METADATA: Record<
  string,
  {
    title: string;
    description: string;
    files: { path: string; type: string }[];
    dependencies: string[];
  }
> = {
  "span-tree": {
    title: "SpanTree",
    description: "Hierarchical waterfall visualization for distributed trace spans",
    files: [
      { path: "components/ui/span-tree/span-tree.tsx", type: "component" },
      { path: "components/ui/span-tree/span-item.tsx", type: "component" },
      { path: "components/ui/span-tree/span-resizer.tsx", type: "component" },
      { path: "components/ui/span-tree/types.ts", type: "lib" },
      { path: "components/ui/span-tree/duration.ts", type: "lib" },
    ],
    dependencies: ["lucide-react"],
  },
  "trace-item": {
    title: "TraceItem",
    description: "Summary row component for displaying distributed trace information",
    files: [
      { path: "components/ui/trace-item/trace-item.tsx", type: "component" },
      { path: "components/ui/trace-item/trace-badge.tsx", type: "component" },
      { path: "components/ui/trace-item/time-since.tsx", type: "component" },
      { path: "components/ui/trace-item/types.ts", type: "lib" },
      { path: "components/ui/trace-item/duration.ts", type: "lib" },
    ],
    dependencies: ["lucide-react", "dayjs"],
  },
};

interface InstallationTabsProps {
  component: keyof typeof COMPONENT_METADATA;
  registryUrl?: string;
}

function CodeBlock({ code }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-4 text-sm font-mono">{code}</pre>
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "absolute right-2 top-2 p-2 rounded-md",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "bg-background/80 hover:bg-background border",
          "text-muted-foreground hover:text-foreground",
        )}
        aria-label="Copy code"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

function PackageManagerTabs({ component, registryUrl }: { component: string; registryUrl: string }) {
  const commands = {
    pnpm: `pnpm dlx shadcn@latest add ${component} -r ${registryUrl}`,
    npm: `npx shadcn@latest add ${component} -r ${registryUrl}`,
    yarn: `npx shadcn@latest add ${component} -r ${registryUrl}`,
    bun: `bunx shadcn@latest add ${component} -r ${registryUrl}`,
  };

  return (
    <Tabs defaultValue="pnpm" className="w-full">
      <TabsList className="h-8 bg-transparent border-b rounded-none w-full justify-start gap-4 px-0">
        {Object.keys(commands).map(pm => (
          <TabsTrigger
            key={pm}
            value={pm}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-8 px-0"
          >
            {pm}
          </TabsTrigger>
        ))}
      </TabsList>
      {Object.entries(commands).map(([pm, cmd]) => (
        <TabsContent key={pm} value={pm} className="mt-4">
          <CodeBlock code={cmd} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function ManualInstallation({ component }: { component: string }) {
  const metadata = COMPONENT_METADATA[component];
  if (!metadata) return null;

  const dependencyCommand = metadata.dependencies.length > 0 ? `pnpm add ${metadata.dependencies.join(" ")}` : null;

  return (
    <div className="space-y-6">
      {dependencyCommand && (
        <div>
          <h4 className="text-sm font-medium mb-2">1. Install dependencies</h4>
          <CodeBlock code={dependencyCommand} />
        </div>
      )}

      <div>
        <h4 className="text-sm font-medium mb-2">
          {dependencyCommand ? "2. Copy the component files" : "1. Copy the component files"}
        </h4>
        <p className="text-sm text-muted-foreground mb-3">Copy the following files to your project:</p>
        <div className="rounded-lg border bg-muted/50 p-4">
          <ul className="space-y-1 text-sm font-mono">
            {metadata.files.map(file => (
              <li key={file.path} className="flex items-center gap-2">
                <span className="text-muted-foreground">→</span>
                <span>{file.path}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">{dependencyCommand ? "3. Update imports" : "2. Update imports"}</h4>
        <p className="text-sm text-muted-foreground">
          Update the import paths in the copied files to match your project structure. Make sure you have a{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">cn</code> utility function at{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">@/lib/utils</code>.
        </p>
      </div>
    </div>
  );
}

export function InstallationTabs({
  component,
  registryUrl = "https://spotlightjs.com/registry.json",
}: InstallationTabsProps) {
  return (
    <Tabs defaultValue="cli" className="w-full">
      <TabsList className="grid w-full grid-cols-2 max-w-[200px]">
        <TabsTrigger value="cli">CLI</TabsTrigger>
        <TabsTrigger value="manual">Manual</TabsTrigger>
      </TabsList>

      <TabsContent value="cli" className="mt-4">
        <PackageManagerTabs component={component} registryUrl={registryUrl} />
      </TabsContent>

      <TabsContent value="manual" className="mt-4">
        <ManualInstallation component={component} />
      </TabsContent>
    </Tabs>
  );
}

export default InstallationTabs;

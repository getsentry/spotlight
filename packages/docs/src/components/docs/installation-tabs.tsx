"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { useMemo } from "react";
import registryData from "../../../registry.json";

// Transform registry.json into component metadata lookup
type ComponentMetadata = {
  title: string;
  description: string;
  files: { path: string; type: string }[];
  dependencies: string[];
};

function getComponentMetadata(componentName: string): ComponentMetadata | null {
  const item = registryData.items.find(item => item.name === componentName);
  if (!item) return null;

  return {
    title: item.title,
    description: item.description,
    files: item.files.map(f => ({
      // Convert registry paths to user-facing paths
      path: f.path.replace("registry/new-york/", "components/ui/"),
      type: f.type.replace("registry:", ""),
    })),
    dependencies: item.dependencies || [],
  };
}

interface InstallationTabsProps {
  component: string;
  registryUrl?: string;
}

function PackageManagerTabs({ component, registryUrl }: { component: string; registryUrl: string }) {
  const commands = useMemo(
    () => ({
      pnpm: `pnpm dlx shadcn@latest add ${component} -r ${registryUrl}`,
      npm: `npx shadcn@latest add ${component} -r ${registryUrl}`,
      yarn: `npx shadcn@latest add ${component} -r ${registryUrl}`,
      bun: `bunx shadcn@latest add ${component} -r ${registryUrl}`,
    }),
    [component, registryUrl],
  );

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
          <DynamicCodeBlock lang="bash" code={cmd} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function ManualInstallation({ component }: { component: string }) {
  const metadata = getComponentMetadata(component);
  if (!metadata) {
    return <p className="text-sm text-muted-foreground">Component &quot;{component}&quot; not found in registry.</p>;
  }

  const dependencyCommand = metadata.dependencies.length > 0 ? `pnpm add ${metadata.dependencies.join(" ")}` : null;

  return (
    <div className="space-y-6">
      {dependencyCommand && (
        <div>
          <h4 className="text-sm font-medium mb-2">1. Install dependencies</h4>
          <DynamicCodeBlock lang="bash" code={dependencyCommand} />
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

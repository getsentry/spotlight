"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";

interface ComponentPreviewProps {
  children: React.ReactNode;
  code?: string;
  className?: string;
}

export function ComponentPreview({ children, code, className }: ComponentPreviewProps) {
  if (!code) {
    // If no code provided, just render the preview
    return (
      <div
        className={cn(
          "rounded-lg border bg-background p-6",
          "flex items-center justify-center min-h-[200px]",
          className,
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <Tabs defaultValue="preview" className="w-full">
      <TabsList className="h-9 bg-transparent border-b rounded-none w-full justify-start gap-4 px-0">
        <TabsTrigger
          value="preview"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-9 px-0"
        >
          Preview
        </TabsTrigger>
        <TabsTrigger
          value="code"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-9 px-0"
        >
          Code
        </TabsTrigger>
      </TabsList>

      <TabsContent value="preview" className="mt-4">
        <div
          className={cn(
            "rounded-lg border bg-background p-6 overflow-hidden",
            "flex items-center justify-center min-h-[200px]",
            className,
          )}
        >
          {children}
        </div>
      </TabsContent>

      <TabsContent value="code" className="mt-4 max-h-[400px] overflow-auto rounded-lg">
        <DynamicCodeBlock lang="tsx" code={code} />
      </TabsContent>
    </Tabs>
  );
}

export default ComponentPreview;

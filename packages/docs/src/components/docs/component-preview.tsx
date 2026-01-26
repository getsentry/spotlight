"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface ComponentPreviewProps {
  children: React.ReactNode;
  code?: string;
  className?: string;
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className={cn("overflow-x-auto rounded-lg border bg-muted/50 p-4 text-sm", "font-mono max-h-[400px]")}>
        <code>{code}</code>
      </pre>
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

      <TabsContent value="code" className="mt-4">
        <CodeBlock code={code} />
      </TabsContent>
    </Tabs>
  );
}

export default ComponentPreview;

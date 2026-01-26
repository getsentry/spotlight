// import { createGenerator } from "fumadocs-typescript";
// import { AutoTypeTable } from "fumadocs-typescript/ui";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import * as icons from "lucide-react";
import type { MDXComponents } from "mdx/types";

import { APITable } from "@/components/docs/api-table";
import { ComponentPreview } from "@/components/docs/component-preview";
// Documentation components
import { InstallationTabs } from "@/components/docs/installation-tabs";

// Demo components
import { SpanTreeDemo, spanTreeDemoCode } from "@/components/demos/span-tree-demo";
import { TraceItemDemo, traceItemDemoCode } from "@/components/demos/trace-item-demo";

// const generator = createGenerator();

// use this function to get MDX components, you will need it for rendering MDX
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...(icons as unknown as MDXComponents),
    ...defaultMdxComponents,
    ...TabsComponents,
    img: props => <ImageZoom {...(props as any)} />,
    // AutoTypeTable: props => <AutoTypeTable {...props} generator={generator} />,
    // Documentation components
    InstallationTabs,
    ComponentPreview,
    APITable,
    // Demo components
    SpanTreeDemo,
    TraceItemDemo,
    // Demo code exports (for ComponentPreview)
    spanTreeDemoCode,
    traceItemDemoCode,
    ...components,
  };
}

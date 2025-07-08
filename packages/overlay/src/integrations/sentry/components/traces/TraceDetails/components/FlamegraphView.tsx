import { useEffect, useRef, useState } from "react";
import type { SentryProfileWithTraceMeta } from "../../../../store/types";
import { type NanovisTreeNode, convertSentryProfileToNormalizedTree } from "../flamegraphutils";

// Type definitions for nanovis (in case the library is not installed)
interface NanovisVisualization {
  el: HTMLElement;
  events: {
    on(event: "select" | "hover", callback: (node: NanovisTreeNode) => void): void;
  };
}

type VisualizationType = "flame" | "treemap" | "sunburst";

interface FlamegraphViewProps {
  profile: SentryProfileWithTraceMeta;
}

export default function FlamegraphView({ profile }: FlamegraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualizationRef = useRef<NanovisVisualization | null>(null);
  const [visualizationType, setVisualizationType] = useState<VisualizationType>("flame");

  useEffect(() => {
    (async () => {
      if (!containerRef.current || !profile) return;

      // Convert Sentry profile to nanovis tree format
      const tree = await convertSentryProfileToNormalizedTree(profile);

      // Try to import nanovis dynamically
      const initVisualization = async () => {
        try {
          // Dynamic import with proper error handling
          const nanovisModule = await import("nanovis");
          const { Flamegraph, Treemap, Sunburst } = nanovisModule;

          // Clean up previous visualization
          if (visualizationRef.current) {
            visualizationRef.current.el.remove();
            visualizationRef.current = null;
          }

          // Create visualization instance based on selected type
          let visualization: NanovisVisualization;
          switch (visualizationType) {
            case "treemap":
              visualization = new Treemap(tree) as NanovisVisualization;
              break;
            case "sunburst":
              visualization = new Sunburst(tree) as NanovisVisualization;
              break;
            default:
              visualization = new Flamegraph(tree) as NanovisVisualization;
              break;
          }

          visualizationRef.current = visualization;

          // Register events
          visualization.events.on("select", (node: NanovisTreeNode) => {
            console.log("Selected node:", node);
          });

          visualization.events.on("hover", (node: NanovisTreeNode) => {
            console.log("Hovered node:", node);
          });

          // Mount to DOM
          if (containerRef.current) {
            containerRef.current.appendChild(visualization.el);
          }
        } catch (error) {
          console.error("Failed to load nanovis library:", error);
          // Fallback: show a message that the library is not available
          if (containerRef.current) {
            containerRef.current.innerHTML = `
            <div class="flex items-center justify-center h-full text-primary-300">
              <div class="text-center">
                <p class="mb-2">Visualization requires nanovis library</p>
                <p class="text-sm text-primary-400">Install with: npm install nanovis</p>
              </div>
            </div>
          `;
          }
        }
      };

      initVisualization();
    })();

    // Cleanup
    return () => {
      if (visualizationRef.current) {
        visualizationRef.current.el.remove();
        visualizationRef.current = null;
      }
    };
  }, [profile, visualizationType]);

  if (!profile) {
    return <div className="flex items-center justify-center h-64 text-primary-300">No profile data available</div>;
  }

  const getVisualizationName = (type: VisualizationType): string => {
    switch (type) {
      case "flame":
        return "Flamegraph";
      case "treemap":
        return "Treemap";
      case "sunburst":
        return "Sunburst";
      default:
        return "Flamegraph";
    }
  };

  return (
    <div className="w-full h-full">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-primary-200">Performance Visualization</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-primary-400">View:</span>
            <div className="flex bg-primary-800 rounded-md p-1">
              {(["flame", "treemap", "sunburst"] as VisualizationType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVisualizationType(type)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    visualizationType === type
                      ? "bg-primary-600 text-white"
                      : "text-primary-300 hover:text-primary-200 hover:bg-primary-700"
                  }`}
                >
                  {getVisualizationName(type)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-sm text-primary-400">
          Visual representation of function call stack and execution time using{" "}
          {getVisualizationName(visualizationType).toLowerCase()}
        </p>
      </div>
      <div ref={containerRef} className="w-full border border-primary-700 rounded-md overflow-hidden" />
    </div>
  );
}

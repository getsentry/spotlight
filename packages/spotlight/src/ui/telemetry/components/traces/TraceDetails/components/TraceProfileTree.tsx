import { cn } from "@spotlight/ui/lib/cn";
import { FRAME_TYPES } from "@spotlight/ui/telemetry/constants/profile";
import useMouseTracking from "@spotlight/ui/telemetry/hooks/useMouseTracking";
import type { NanovisTreeNode } from "@spotlight/ui/telemetry/types";
import type { TreeNode } from "nanovis";
import { useEffect, useRef, useState } from "react";
import type { SentryProfileWithTraceMeta } from "../../../../store/types";
import { convertSentryProfileToNormalizedTree } from "../../../../utils/profileTree";

interface NanovisVisualization {
  el: HTMLElement;
  events: {
    on(event: "select" | "hover", callback: (node: NanovisTreeNode) => void): void;
  };
}

type VisualizationType = "flame" | "treemap" | "sunburst";

interface TraceProfileTreeProps {
  profile: SentryProfileWithTraceMeta;
}

const FlamegraphLegend = () => {
  return (
    <div className="flex items-center gap-4">
      {FRAME_TYPES.map(({ label, color }) => (
        <span key={label} className="flex items-center gap-1 text-sm">
          <span className={cn("inline-block size-4 rounded-xs", color)} />
          {label}
        </span>
      ))}
    </div>
  );
};

/**
 * Formats a sample count for display.
 * Uses "k" suffix for thousands to keep the display compact.
 */
function formatSampleCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k samples`;
  }
  return `${count} samples`;
}

export default function TraceProfileTree({ profile }: TraceProfileTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualizationRef = useRef<NanovisVisualization | null>(null);
  const [visualizationType, setVisualizationType] = useState<VisualizationType>("flame");
  const [hoveredNode, setHoveredNode] = useState<NanovisTreeNode | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [treeData, setTreeData] = useState<NanovisTreeNode | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    (async () => {
      if (!containerRef.current || !profile) return;

      const tree = await convertSentryProfileToNormalizedTree(profile);
      setTreeData(tree);

      const nanovisModule = await import("nanovis");
      const { Flamegraph, Treemap, Sunburst } = nanovisModule;

      if (visualizationRef.current) {
        visualizationRef.current.el.remove();
        visualizationRef.current = null;
      }

      // Custom palette for Spotlight's dark theme
      const options = {
        getColor: (node: TreeNode<unknown>) => node.color,
        palette: {
          text: "#e0e7ff", // primary-100 for better visibility
          fg: "#fff",
          bg: "#1e1b4b", // primary-950
          stroke: "#4338ca", // primary-700
          fallback: "#9ca3af", // Gray-400 fallback
          hover: "#ffffff33", // Semi-transparent white for hover
          shadow: "#00000066", // Semi-transparent black for shadows
        },
      };

      let visualization: NanovisVisualization;
      switch (visualizationType) {
        case "treemap":
          visualization = new Treemap(tree, options) as NanovisVisualization;
          break;
        case "sunburst":
          visualization = new Sunburst(tree, options) as NanovisVisualization;
          break;
        default:
          visualization = new Flamegraph(tree, options) as NanovisVisualization;
          break;
      }

      visualizationRef.current = visualization;

      visualization.events.on("select", (node: NanovisTreeNode) => {
        console.log("Selected node:", node);
      });

      visualization.events.on("hover", (node: NanovisTreeNode | null) => {
        setHoveredNode(node);
      });

      if (containerRef.current) {
        containerRef.current.appendChild(visualization.el);
      }
      window.addEventListener("mousemove", handleMouseMove);
    })();

    return () => {
      if (visualizationRef.current) {
        visualizationRef.current.el.remove();
        visualizationRef.current = null;
      }
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [profile, visualizationType]);

  if (!profile) {
    return <div className="text-primary-300 px-6 py-4">No profile data available</div>;
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

  const mouseTrackingProps = useMouseTracking({
    elem: containerRef,
    onPositionChange: args => {
      if (args) {
        const { left, top } = args;
        setMousePosition({ x: left, y: top });
      }
    },
  });

  return (
    <div className="w-full h-full relative p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-primary-200">Profile</h3>
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
          Visual representation of profile using {getVisualizationName(visualizationType).toLowerCase()}
        </p>
      </div>
      <FlamegraphLegend />
      <div onMouseLeave={() => setHoveredNode(null)}>
        <div
          ref={containerRef}
          className="w-full border border-primary-700 rounded-md overflow-auto p-2 my-4 relative"
          {...mouseTrackingProps}
        >
          {/* Sunburst center overlay - covers nanovis bytes display with sample count */}
          {visualizationType === "sunburst" && treeData && (
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary-950 px-3 py-1 rounded-md pointer-events-none z-10"
              style={{ minWidth: "80px", textAlign: "center" }}
            >
              <span className="text-primary-100 font-bold text-sm">{formatSampleCount(treeData.sampleCount)}</span>
            </div>
          )}
          {hoveredNode && (
            <div
              className="bg-primary-900 border-primary-400 absolute flex flex-col min-w-[200px] rounded-lg border p-3 shadow-lg z-50"
              style={{
                left: mousePosition.x + 12,
                top: mousePosition.y + 12,
                pointerEvents: "none",
              }}
            >
              <span className="text-primary-200 font-semibold">{hoveredNode.text}</span>
              <span className="text-primary-400 text-xs">{hoveredNode.subtext}</span>
              <span className="text-primary-400 text-xs">Samples: {hoveredNode.sampleCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import type { EventFrame } from "@spotlightjs/core/sentry";
import type { ColorValue } from "nanovis";

/**
 * A generic tree node used to represent hierarchical performance data
 * for visualizations like flamegraphs, sunbursts, and treemaps.
 *
 * Each node corresponds to a stack frame in a profiling trace and includes
 * metrics like self time, total time, and sample count to support rendering
 * and interactive analysis.
 */
export type NanovisTreeNode = {
  /**
   * Unique identifier for the node, typically derived from frame ID and depth.
   */
  id: string;

  /**
   * Display text (label) for this node — usually the function name.
   */
  text: string;

  /**
   * Additional text shown under the label — e.g., file path, line number.
   */
  subtext: string;

  /**
   * Number of samples where this frame was the leaf (exclusive time).
   * Represents how much time this function spent doing its own work.
   */
  sizeSelf: number;

  /**
   * Total number of samples passing through this frame, including children.
   * This is the inclusive time (self + all descendants).
   */
  size: number;

  /**
   * Child nodes (functions called by this frame).
   */
  children: NanovisTreeNode[];

  /**
   * Color used for rendering this node in the flamegraph.
   */
  color: ColorValue;

  /**
   * Metadata about the frame (function name, file, etc.).
   * Optional: may be undefined forPr root or placeholder nodes.
   */
  frame?: EventFrame;

  /**
   * ID of the frame this node represents. Useful for lookups and deduplication.
   */
  frameId: number;

  /**
   * Total number of samples that included this frame.
   */
  sampleCount: number;
};

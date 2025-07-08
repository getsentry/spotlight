/**
 * Converts Sentry profile data from envelope to nanovis tree format
 * Perfect for flamegraph, treemap, and sunburst visualization of JavaScript performance profiles
 *
 * Sentry profile format includes:
 * - samples: Array of stack samples with timestamps
 * - frames: Array of function frames with location info
 * - stacks: Array of frame ID arrays representing call stacks
 */

import type { SentryProfileWithTraceMeta } from "../../../store/types";
import type { EventFrame } from "../../../types";

// Nanovis Tree Node Type - matches nanovis library interface
export interface NanovisTreeNode {
  id: string;
  text: string;
  subtext: string;
  sizeSelf: number;
  size: number;
  children: NanovisTreeNode[];
  color: string;
  frame?: EventFrame;
  frameId: number;
  sampleCount: number;
  [key: string]: any; // Allow dynamic properties like custom colorProp
}

/**
 * Options for customizing flamegraph tree generation and normalization.
 *
 * @public
 */
export interface FlamegraphUtilOptions {
  /**
   * Function to determine color for a frame. Receives (frame, depth, parent) and returns a color string.
   */
  getColor?: (frame: EventFrame, depth: number, parent?: NanovisTreeNode) => string;
  /**
   * Function to determine label for a frame. Receives (frame, depth, parent) and returns a string.
   */
  getLabel?: (frame: EventFrame, depth: number, parent?: NanovisTreeNode) => string;
  /**
   * Property name to use for color in the output tree (default: 'color').
   */
  colorProp?: string;
}

/**
 * Parses a Sentry profile and returns a normalized structure for further processing.
 *
 * @param profile - The Sentry profile data.
 * @returns Parsed profile or null if invalid.
 * @public
 */
export function parseSentryProfile(profile: SentryProfileWithTraceMeta) {
  if (!profile || !Array.isArray(profile.samples) || !Array.isArray(profile.frames) || !Array.isArray(profile.stacks)) {
    return null;
  }
  return {
    samples: profile.samples,
    frames: profile.frames,
    stacks: profile.stacks,
    platform: profile.platform,
  };
}

/**
 * Builds a flamegraph tree from parsed profile data, supporting custom color/label logic.
 *
 * @param parsed - Parsed profile data.
 * @param options - Customization options.
 * @returns Root node of the constructed tree.
 * @public
 */
export function buildFlamegraphTree(
  parsed: ReturnType<typeof parseSentryProfile>,
  options: FlamegraphUtilOptions = {},
): NanovisTreeNode {
  if (!parsed) {
    return {
      id: "empty",
      text: "No profile data",
      subtext: "",
      sizeSelf: 0,
      size: 0,
      children: [],
      color: "#6b7280",
      frameId: -1,
      sampleCount: 0,
    };
  }
  const { samples, frames, stacks, platform } = parsed;
  const getColor = typeof options.getColor === "function" ? options.getColor : getSentryFrameColor;
  const getLabel =
    typeof options.getLabel === "function" ? options.getLabel : (frame: EventFrame) => frame.function || "anonymous";
  const colorProp = typeof options.colorProp === "string" ? options.colorProp : "color";
  const totalDuration =
    samples.length > 0 ? samples[samples.length - 1].start_timestamp - samples[0].start_timestamp : 0;
  const root: NanovisTreeNode = {
    id: "root",
    text: `${platform || "unknown"} Profile`,
    subtext: `${totalDuration.toFixed(2)}ms total`,
    sizeSelf: 0,
    size: 0,
    children: [],
    [colorProp]: "#1f2937",
    color: "#1f2937",
    frameId: -1,
    sampleCount: 0,
  };
  for (const sample of samples) {
    const stackId = sample.stack_id;
    const stack = stacks[stackId];
    if (!Array.isArray(stack) || stack.length === 0) continue;
    let currentNode: NanovisTreeNode = root;
    root.sampleCount++;
    const reversedStack = [...stack].reverse();
    for (let depth = 0; depth < reversedStack.length; depth++) {
      const frameId = reversedStack[depth];
      const frame = frames[frameId];
      if (!frame) continue;
      let childIndex = currentNode.children.findIndex(child => child.frameId === frameId);
      if (childIndex === -1) {
        const childNode: NanovisTreeNode = {
          id: `frame-${frameId}-${depth}`,
          text: getLabel(frame, depth, currentNode),
          subtext: createSentryFrameSubtext(frame),
          sizeSelf: 0,
          size: 0,
          children: [],
          frame: frame,
          frameId: frameId,
          sampleCount: 1,
          [colorProp]: getColor(frame, depth, currentNode),
          color: getColor(frame, depth, currentNode),
        };
        currentNode.children.push(childNode);
        childIndex = currentNode.children.length - 1;
      } else {
        currentNode.children[childIndex].sampleCount++;
      }
      currentNode = currentNode.children[childIndex];
    }
    if (currentNode !== root) {
      currentNode.sizeSelf++;
    }
  }
  const totalSamples = samples.length;
  convertSampleCountsToSizes(root, totalSamples);
  sortChildrenBySize(root);
  return root;
}

/**
 * Recursively copies color properties from the source tree to the target tree after normalization.
 *
 * @param source - The original tree with color properties.
 * @param target - The normalized tree to patch.
 * @param colorProp - The color property name to patch (default: 'color').
 * @public
 */
export function patchTreeColors(source: NanovisTreeNode, target: NanovisTreeNode, colorProp = "color"): void {
  if (!source || !target) return;
  if (source[colorProp]) target[colorProp] = source[colorProp];
  if (source.color) target.color = source.color;
  if (Array.isArray(source.children) && Array.isArray(target.children)) {
    for (let i = 0; i < source.children.length; i++) {
      patchTreeColors(source.children[i], target.children[i], colorProp);
    }
  }
}

/**
 * Converts a Sentry profile to a normalized nanovis tree node for visualization.
 * Handles malformed data gracefully. Allows custom color/label logic and color property name.
 * Always normalizes the tree for correct sunburst rendering.
 *
 * @param profile - SentryProfileWithTraceMeta
 * @param options - FlamegraphUtilOptions
 * @returns Promise<NanovisTreeNode>
 * @public
 */
export async function convertSentryProfileToNormalizedTree(
  profile: SentryProfileWithTraceMeta,
  options: FlamegraphUtilOptions = {},
): Promise<NanovisTreeNode> {
  const parsed = parseSentryProfile(profile);
  if (!parsed) {
    return {
      id: "empty",
      text: "No profile data",
      subtext: "",
      sizeSelf: 0,
      size: 0,
      children: [],
      color: "#6b7280",
      frameId: -1,
      sampleCount: 0,
    };
  }
  const colorProp = typeof options.colorProp === "string" ? options.colorProp : "color";
  const tree = buildFlamegraphTree(parsed, options);
  const { normalizeTreeNode } = await import("nanovis");
  const normalized = normalizeTreeNode(tree) as NanovisTreeNode;
  patchTreeColors(tree, normalized, colorProp);
  return {
    ...normalized,
    frameId: tree.frameId,
    sampleCount: tree.sampleCount,
  };
}

/**
 * Returns a display name for a Sentry profile (thread name or fallback).
 *
 * @param profile - SentryProfileWithTraceMeta
 * @param idx - Optional index for fallback naming.
 * @returns Display name string.
 * @public
 */
export function getProfileDisplayName(profile: SentryProfileWithTraceMeta, idx = 0): string {
  return profile.thread_metadata?.[profile.active_thread_id]?.name || profile.platform || `Profile ${idx + 1}`;
}

function sortChildrenBySize(node: NanovisTreeNode): void {
  if (Array.isArray(node.children)) {
    node.children.sort((a, b) => b.size - a.size);
    for (const child of node.children) {
      sortChildrenBySize(child);
    }
  }
}

function createSentryFrameSubtext(frame: EventFrame): string {
  const parts: string[] = [];
  if (frame.abs_path) {
    const filename = frame.abs_path.split("/").pop() || frame.abs_path;
    const cleanFilename = filename.replace(/\?v=[a-f0-9]+$/, "");
    parts.push(cleanFilename);
  }
  if (typeof frame.lineno === "number") {
    parts.push(`L${frame.lineno}`);
  }
  if (typeof frame.colno === "number") {
    parts.push(`C${frame.colno}`);
  }
  return parts.length > 0 ? parts.join(" ") : "unknown location";
}

function getSentryFrameColor(frame: EventFrame, depth: number): string {
  if (!frame.abs_path) return "#6b7280";
  const path = frame.abs_path.toLowerCase();
  if (path.includes("node_modules")) {
    if (path.includes("react")) return "#61dafb";
    if (path.includes("sentry")) return "#362d59";
    if (path.includes("vite")) return "#646cff";
    return "#f59e0b";
  }
  if (path.includes("localhost") || path.includes("src/")) {
    return "#10b981";
  }
  const colors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6"];
  return colors[depth % colors.length];
}

function convertSampleCountsToSizes(node: NanovisTreeNode, totalSamples: number): void {
  const samplePercentage = (node.sampleCount / totalSamples) * 100;
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      convertSampleCountsToSizes(child, totalSamples);
    }
  }
  const childrenSize = node.children.reduce((sum, child) => sum + child.size, 0);
  node.size = node.sampleCount + childrenSize;
  if (node.frameId !== -1) {
    const originalSubtext = node.subtext;
    node.subtext = `${samplePercentage.toFixed(1)}% | ${originalSubtext}`;
  }
}

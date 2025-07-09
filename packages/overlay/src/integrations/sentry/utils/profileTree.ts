import type { ColorValue } from "nanovis";
import type { SentryProfileWithTraceMeta } from "../store/types";
import type { EventFrame } from "../types";

export interface NanovisTreeNode {
  id: string;
  text: string;
  subtext: string;
  sizeSelf: number;
  size: number;
  children: NanovisTreeNode[];
  color: ColorValue;
  frame?: EventFrame;
  frameId: number;
  sampleCount: number;
}
export interface FlamegraphUtilOptions {
  getColor?: (frame: EventFrame, depth: number, parent?: NanovisTreeNode) => ColorValue;
  getLabel?: (frame: EventFrame, depth: number, parent?: NanovisTreeNode) => string;
}

/**
 * Parses a Sentry profile and returns a normalized structure for further processing.
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

// Sentry color scheme
// ref: https://docs.sentry.io/product/explore/profiling/flame-charts-graphs/
function getSentryFrameColors(frame: EventFrame): ColorValue {
  if (!frame.abs_path) return "#f3f4f6";
  const path = frame.abs_path.toLowerCase();
  if (path.includes("src/") || path.includes("localhost")) {
    return "#d0d1f5";
  }
  return "#ffe0e4";
}

/**
 * Builds a flamegraph tree from parsed profile data, supporting custom color/label logic.
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
  const getColor = typeof options.getColor === "function" ? options.getColor : getSentryFrameColors;
  const getLabel =
    typeof options.getLabel === "function" ? options.getLabel : (frame: EventFrame) => frame.function || "anonymous";
  const totalDuration =
    samples.length > 0 ? samples[samples.length - 1].start_timestamp - samples[0].start_timestamp : 0;

  type TreeNodeWithMap = NanovisTreeNode & { childrenMap?: Map<number, TreeNodeWithMap> };

  const root: TreeNodeWithMap = {
    id: "root",
    text: `${platform || "unknown"} Profile`,
    subtext: `${totalDuration.toFixed(2)}ms total`,
    sizeSelf: 0,
    size: 0,
    children: [],
    color: "#fff",
    frameId: -1,
    sampleCount: 0,
    childrenMap: new Map<number, TreeNodeWithMap>(),
  };

  for (const sample of samples) {
    const stackId = sample.stack_id;
    const stack = stacks[stackId];
    if (!Array.isArray(stack) || stack.length === 0) continue;
    let currentNode: TreeNodeWithMap = root;
    root.sampleCount++;
    const reversedStack = [...stack].reverse();
    for (let depth = 0; depth < reversedStack.length; depth++) {
      const frameId = reversedStack[depth];
      const frame = frames[frameId];
      if (!frame) continue;
      if (!currentNode.childrenMap) {
        currentNode.childrenMap = new Map<number, TreeNodeWithMap>();
      }
      let childNode = currentNode.childrenMap.get(frameId);
      if (!childNode) {
        childNode = {
          id: `frame-${frameId}-${depth}`,
          text: getLabel(frame, depth, currentNode),
          subtext: createSentryFrameSubtext(frame),
          sizeSelf: 0,
          size: 0,
          children: [],
          frame: frame,
          frameId: frameId,
          sampleCount: 1,
          color: getColor(frame, depth, currentNode),
          childrenMap: new Map<number, TreeNodeWithMap>(),
        };
        currentNode.children.push(childNode);
        currentNode.childrenMap.set(frameId, childNode);
      } else {
        childNode.sampleCount++;
      }
      currentNode = childNode;
    }
    if (currentNode !== root) {
      currentNode.sizeSelf++;
    }
  }

  function removeChildrenMap(node: TreeNodeWithMap): void {
    if (node.childrenMap) {
      node.childrenMap.clear();
      node.childrenMap = undefined;
    }
    for (const child of node.children) {
      removeChildrenMap(child as TreeNodeWithMap);
    }
  }
  removeChildrenMap(root);

  const totalSamples = samples.length;
  convertSampleCountsToSizes(root, totalSamples);
  sortChildrenBySize(root);
  return root;
}

/**
 * Returns a display name for a Sentry profile (thread name or fallback).
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

/**
 * Converts a Sentry profile to a normalized nanovis tree node for visualization.
 * Always normalizes the tree for correct sunburst rendering.
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
  const tree = buildFlamegraphTree(parsed, options);
  const { normalizeTreeNode } = await import("nanovis");
  const normalized = normalizeTreeNode(tree) as NanovisTreeNode;
  return {
    ...normalized,
    frameId: tree.frameId,
    sampleCount: tree.sampleCount,
  };
}

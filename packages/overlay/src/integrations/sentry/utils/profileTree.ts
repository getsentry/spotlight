import { getFormattedDuration, getFormattedNumber } from "@spotlightjs/core";
import type { EventFrame } from "@spotlightjs/core/sentry";
import type { ColorValue } from "nanovis";
import { SAMPLE_EMPTY_PROFILE_FRAME } from "../constants";
import type { SentryProfileWithTraceMeta } from "../store/types";
import type { NanovisTreeNode } from "../types";
import { getFrameColors } from "./frame";

interface FlamegraphUtilOptions {
  getColor?: (frame: EventFrame, depth: number, platform?: string, parent?: NanovisTreeNode) => ColorValue;
  getLabel?: (frame: EventFrame, depth: number, parent?: NanovisTreeNode) => string;
}

const compareNodeBySize = (a: NanovisTreeNode, b: NanovisTreeNode) => b.size - a.size;

/**
 * Recursively sorts the children of a tree node by size in descending order.
 * @param node The tree node whose children to sort.
 */
function sortChildrenBySize(node: NanovisTreeNode): void {
  node.children.sort(compareNodeBySize);
  for (const child of node.children) {
    sortChildrenBySize(child);
  }
}

/**
 * Creates a subtext for a frame, typically including file path, line number, and column number.
 * @param frame The event frame.
 * @returns A string representing the frame's location.
 */
function createSentryFrameSubtext(frame: EventFrame): string {
  const parts: string[] = [];
  if (frame.abs_path) {
    const lastDelimIdx = frame.abs_path.lastIndexOf("/");
    const filename = lastDelimIdx !== -1 ? frame.abs_path.slice(lastDelimIdx) : frame.abs_path;
    const cleanFilename = filename.replace(/\?v=[a-f0-9]+$/, "");
    parts.push(cleanFilename);
  }
  if (typeof frame.lineno === "number") {
    parts.push(`${frame.lineno}`);
  }
  if (typeof frame.colno === "number") {
    parts.push(`${frame.colno}`);
  }
  return parts.length > 0 ? parts.join(":") : "unknown location";
}

/**
 * Recursively converts sample counts to sizes for each node in the tree.
 * The size is a combination of its own sample count and the size of its children.
 * It also prepends the sample percentage to the node's subtext.
 * @param node The root node of the tree.
 * @param totalSamples The total number of samples in the profile.
 */
function convertSampleCountsToSizes(node: NanovisTreeNode, totalSamples: number): void {
  const samplePercentage = (node.sampleCount / totalSamples) * 100;
  for (const child of node.children) {
    convertSampleCountsToSizes(child, totalSamples);
  }

  const childrenSize = node.children.reduce((sum, child) => sum + child.size, 0);
  node.size = node.sampleCount + childrenSize;
  if (node.frameId !== -1) {
    const originalSubtext = node.subtext;
    node.subtext = `${getFormattedNumber(samplePercentage, 1)}% | ${originalSubtext}`;
  }
}

/**
 * Builds a tree from parsed profile data, supporting custom color/label logic.
 * @param parsed The parsed Sentry profile data.
 * @param options Optional configuration for customizing the tree.
 * @param options.getColor A function to determine the color of a frame.
 * @param options.getLabel A function to determine the label of a frame.
 * @returns The root node of the constructed flame graph tree.
 */
function buildTree(profile: SentryProfileWithTraceMeta, options: FlamegraphUtilOptions = {}): NanovisTreeNode {
  if (!profile) {
    return SAMPLE_EMPTY_PROFILE_FRAME;
  }
  const { samples, frames, stacks, platform } = profile;
  const getColor =
    typeof options.getColor === "function" ? options.getColor : (frame: EventFrame) => getFrameColors(frame, platform);
  const getLabel =
    typeof options.getLabel === "function" ? options.getLabel : (frame: EventFrame) => frame.function || "anonymous";
  const totalDuration =
    samples.length > 0 ? samples[samples.length - 1].start_timestamp - samples[0].start_timestamp : 0;

  type TreeNodeWithMap = NanovisTreeNode & { childrenMap?: Map<number, TreeNodeWithMap> };

  const root: TreeNodeWithMap = {
    id: "root",
    text: `${platform || "unknown"} Profile`,
    subtext: `${getFormattedDuration(totalDuration)} total`,
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
    if (stack.length === 0) continue;
    let currentNode: TreeNodeWithMap = root;
    root.sampleCount++;
    for (let depth = 0; depth < stack.length; depth++) {
      const frameId = stack[stack.length - 1 - depth];
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
          color: getColor(frame, depth, platform, currentNode),
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

  /**
   * Recursively removes the childrenMap from a node and all its descendants.
   * This is a cleanup step after the tree is built, as childrenMap is a temporary
   * structure for efficient node lookup during construction.
   * @param node The node to start from.
   */
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
 * Converts a Sentry profile to a normalized nanovis tree node for visualization.
 * This function parses the profile, builds a tree, and then normalizes it for sunburst/flamegraph rendering.
 * @param profile The Sentry profile with trace metadata.
 * @param options Optional configuration for customizing the tree.
 * @returns A promise that resolves to the normalized root node of the tree.
 */
export async function convertSentryProfileToNormalizedTree(
  profile: SentryProfileWithTraceMeta,
  options: FlamegraphUtilOptions = {},
): Promise<NanovisTreeNode> {
  const tree = buildTree(profile, options);
  const { normalizeTreeNode } = await import("nanovis");
  const normalized = normalizeTreeNode(tree) as NanovisTreeNode;
  return {
    ...normalized,
    frameId: tree.frameId,
    sampleCount: tree.sampleCount,
  };
}

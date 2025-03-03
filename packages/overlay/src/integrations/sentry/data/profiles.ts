import { log } from '~/lib/logger';
import { generateUuidv4 } from '../../../lib/uuid';
import type { Span, Trace } from '../types';
import { compareSpans } from '../utils/traces';
import type { SentryProfileWithTraceMeta } from './sentryDataCache';
import sentryDataCache from './sentryDataCache';

/**
 * Groups consequent spans with the same description and op into a single span per each level.
 * Essentially a BFS traversal of the spans tree.
 * @param spans Span[] A list of spans to consolidate, sorted by their start_timestamp
 * @returns Span[] A list of spans with the same description and op consolidated into a single span
 */
function consolidateSpans(trace: Trace, spans: Span[]): Span[] {
  const consolidatedSpans: Span[] = [];
  let lastSpan = spans[0];
  let spanIdx = 1;
  while (spanIdx < spans.length + 1) {
    const span = spans[spanIdx];
    spanIdx += 1;
    if (span && span.description === lastSpan.description && span.op === lastSpan.op) {
      // Require the spans are sorted by start_timestamp
      lastSpan.timestamp = span.timestamp;
      if (span.children) {
        if (lastSpan.children) {
          for (const child of span.children) {
            lastSpan.children.push(child);
          }
          lastSpan.children.sort(compareSpans);
        } else {
          lastSpan.children = span.children;
        }
      }
    } else {
      // Discard very short spans
      if (lastSpan.timestamp - lastSpan.start_timestamp > 0) {
        if (lastSpan.children) {
          lastSpan.children = consolidateSpans(trace, lastSpan.children);
        }
        consolidatedSpans.push(lastSpan);
        trace.spans.set(lastSpan.span_id, lastSpan);
      }
      lastSpan = span;
    }
  }

  return consolidatedSpans;
}

// This is done per platform right now but we may want to make it use
// SDK or something more specific, especially for JS as `javascript` may
// mean browser, node, etc.
const SENTRY_FRAME_FILTER_PER_PLATFORM: Record<
  string,
  (this: SentryProfileWithTraceMeta['frames'], frameIdx: number) => boolean | undefined
> = {
  python: function (frameIdx) {
    return this[frameIdx].module?.startsWith('sentry_sdk.');
  },
  javascript: function (frameIdx) {
    const frame = this[frameIdx];
    const module = frame.module;
    if (module) {
      return module.startsWith('@sentry') || module.startsWith('@opentelemetry.instrumentation');
    }
    // This one below is to match things like `http://localhost:3000/node_modules/.vite/deps/@sentry_react.js?v=6942e78f` etc.
    return frame.abs_path ? /\/node_modules\/.*\/@(sentry|opentelemetry)[^a-z0-9]/.test(frame.abs_path) : false;
  },
};

export function getSpansFromProfile(
  trace: Trace,
  profile: SentryProfileWithTraceMeta,
  parent_span_id: string | undefined,
  startTs: number,
  endTs: number,
  threadIds: Set<string>,
): Span[] {
  threadIds.add(profile.active_thread_id);

  const sentryFrameFilter = profile.platform && SENTRY_FRAME_FILTER_PER_PLATFORM[profile.platform];
  // Try to fill in the gaps from profile data
  const fillerSpans: Span[] = [];
  for (let sampleIdx = 0; sampleIdx < profile.samples.length; sampleIdx++) {
    const sample = profile.samples[sampleIdx];
    if (sample.thread_id && !threadIds.has(sample.thread_id)) {
      continue;
    }
    const sampleTs = sample.start_timestamp;
    if (sampleTs < startTs || sampleTs > endTs) {
      continue;
    }
    const nextSample = profile.samples[sampleIdx + 1];
    const timestamp = nextSample ? nextSample.start_timestamp : endTs;

    if (timestamp > endTs) {
      continue;
    }
    const commonAttributes = {
      start_timestamp: sampleTs,
      timestamp,
      trace_id: trace.trace_id,
      status: 'ok',
      tags: { source: 'profile' },
      data: {
        'thread.id': sample.thread_id,
        'thread.name': profile.thread_metadata?.[sample.thread_id as keyof typeof profile.thread_metadata]?.name,
      },
    };
    const sampleSpan: Span = {
      span_id: generateUuidv4(),
      parent_span_id,
      ...commonAttributes,
      op: 'Thread',
      description:
        profile.thread_metadata?.[sample.thread_id as keyof typeof profile.thread_metadata]?.name ||
        `Thread ${sample.thread_id}`,
      data: {
        thread_id: sample.thread_id,
      },
    };
    let currentSpan = sampleSpan;
    const currentStack = profile.stacks[sample.stack_id];
    const lastSentryFrameIdx = sentryFrameFilter ? currentStack.findLastIndex(sentryFrameFilter, profile.frames) : 0;
    for (let frameIdxIdx = lastSentryFrameIdx + 1; frameIdxIdx < currentStack.length; frameIdxIdx++) {
      const frame = profile.frames[currentStack[frameIdxIdx]];
      // XXX: We may wanna skip frames that doesn't have `in_app` set to true
      //      that said it's better to have this as a dynamic filter
      const spanFromFrame = {
        span_id: generateUuidv4(),
        parent_span_id: currentSpan.span_id,
        ...commonAttributes,
        op: frame.module,
        description: frame.function || `<anonymous>@${frame.lineno}:${frame.colno}`,
        data: {
          ...frame,
        },
      };
      currentSpan.children = [spanFromFrame];
      currentSpan = spanFromFrame;
    }
    fillerSpans.push(sampleSpan);
  }

  if (!fillerSpans.length) {
    return [];
  }
  const consolidated = consolidateSpans(trace, fillerSpans);
  // Remove the extra layer of nesting if there is only one span which should be the "Thread" span
  return (consolidated.length === 1 ? consolidated[0].children || [] : consolidated).filter(
    span => span.timestamp - span.start_timestamp > 0 && span.timestamp <= endTs,
  );
}

/**
 * Modifies the spanTree in place recursively by adding spans from the
 * profile data where there are gaps in the trace data.
 * @param spanTree Span[] The tree of spans to graft profile spans into
 */
export function graftProfileSpans(
  trace: Trace,
  spanTree: Span[] = trace.spanTree,
  parent: Span | Trace = trace,
  profile?: SentryProfileWithTraceMeta,
) {
  if (trace.profileGrafted) {
    log(`Trace already has profile grafted ${trace.trace_id}`);
    return;
  }
  if (!profile) {
    profile = sentryDataCache.getProfileByTraceId(trace.trace_id);
    if (!profile) {
      log(`Profile not found for trace ${trace.trace_id}`);
      return;
    }
  }

  let idx = -1;
  while (idx < spanTree.length) {
    const span = spanTree[idx] as Span | undefined;
    if (span?.tags?.source === 'profile') {
      idx += 1;
      continue;
    }
    const nextSpan = spanTree[idx + 1];
    if (nextSpan?.tags?.source === 'profile') {
      idx += 1;
      continue;
    }

    const startTs = span ? span.timestamp : parent.start_timestamp;
    const endTs = nextSpan ? nextSpan.start_timestamp : parent.timestamp;
    const threadIds = new Set([span?.data?.threadId, nextSpan?.data?.threadId, parent?.data?.threadId]);
    threadIds.delete(undefined);
    if (endTs - startTs > 0) {
      const fillers = getSpansFromProfile(trace, profile, parent.span_id, startTs, endTs, threadIds as Set<string>);
      if (fillers.length) {
        spanTree.splice(idx + 1, 0, ...fillers);
        idx += fillers.length;
      }
    }
    if (span) {
      span.children ??= [];
      graftProfileSpans(trace, span.children, span, profile);
    }
    idx += 1;
  }
  // Only mark as grafted at the top level to avoid early quitting during
  // recursive calls above for child spans
  trace.profileGrafted = trace.spanTree === spanTree;
}

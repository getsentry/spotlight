import type { StateCreator } from "zustand";
import { getFunctionNameFromFrame } from "../../utils/profileUtils";
import type { AggregateCallData, TraceId } from "../../types";
import type { ProfilesSliceActions, ProfilesSliceState, SentryStore } from "../types";

const initialProfilesState: ProfilesSliceState = {
  profilesByTraceId: new Map(),
};

export const createProfilesSlice: StateCreator<SentryStore, [], [], ProfilesSliceState & ProfilesSliceActions> = (
  _set,
  get,
) => ({
  ...initialProfilesState,
  getProfileByTraceId: (id: string) => get().profilesByTraceId.get(id),
  getAggregateCallData: () => {
    const aggregateCalls = new Map<string, AggregateCallData>();
    for (const [traceId, profile] of get().profilesByTraceId) {
      for (let sampleIdx = 0; sampleIdx < profile.samples.length - 1; sampleIdx++) {
        const sample = profile.samples[sampleIdx];
        const nextSample = profile.samples[sampleIdx + 1];
        // TODO: Handle the case where nextSample is undefined -- use the end of the profile or associated trace
        const duration = nextSample.start_timestamp - sample.start_timestamp;
        // TODO: Keep a running average based on continuous samples
        //       as in where we keep seeing the same function name / frame back to back

        const stackId = sample.stack_id;
        const frameIndices = profile.stacks[stackId];

        for (const frameIdx of frameIndices) {
          const frame = profile.frames[frameIdx];
          const name = getFunctionNameFromFrame(frame);
          const callData = aggregateCalls.get(name);
          if (callData) {
            callData.totalTime += duration;
            callData.samples += 1;
            callData.traceIds.add(traceId);
          } else {
            aggregateCalls.set(name, {
              name,
              totalTime: duration,
              samples: 1,
              traceIds: new Set<TraceId>([traceId]),
            });
          }
        }
      }
    }

    return Array.from(aggregateCalls.values());
  },
});

import { afterEach, expect, test, vi } from "vitest";

const { fetchContext } = vi.hoisted(() => ({ fetchContext: vi.fn() }));
vi.mock("../utils/fetch", () => ({ getNativeFetchImplementation: () => fetchContext }));

import useSentryStore from "./store";

let releaseRequest: (() => void) | undefined;
afterEach(() => {
  releaseRequest?.();
  releaseRequest = undefined;
  useSentryStore.getState().resetData();
  fetchContext.mockReset();
  vi.useRealTimers();
});

test("a stalled context-lines request times out and releases later telemetry", async () => {
  vi.useFakeTimers();
  useSentryStore.getState().resetData();
  let requestSignal: AbortSignal | undefined;
  fetchContext.mockImplementation((_url: string, options: RequestInit) => {
    requestSignal = options.signal ?? undefined;
    return new Promise((_resolve, reject) => {
      releaseRequest = () => reject(new Error("request released"));
      requestSignal?.addEventListener("abort", () => reject(requestSignal?.reason), { once: true });
    });
  });
  const captured = useSentryStore.getState().ingestEnvelope([
    {},
    [
      [
        { type: "event" },
        {
          event_id: "stalled-error",
          timestamp: 1,
          exception: { values: [{ type: "Error", value: "oops", stacktrace: { frames: [{ filename: "app.ts" }] } }] },
        },
      ],
    ],
  ]);
  const later = useSentryStore
    .getState()
    .ingestEnvelope([
      {},
      [[{ type: "log" }, { items: [{ id: "later-log", body: "next", timestamp: 2, attributes: {} }] }]],
    ]);
  await vi.advanceTimersByTimeAsync(0);
  expect(fetchContext).toHaveBeenCalledTimes(1);
  expect(useSentryStore.getState().getLogs()).toEqual([]);
  await vi.advanceTimersByTimeAsync(5000);
  expect(requestSignal?.aborted).toBe(true);
  await expect(captured).resolves.toMatchObject({ status: "processed" });
  await expect(later).resolves.toMatchObject({ status: "processed" });
  expect(useSentryStore.getState().getEventById("stalled-error")).toBeDefined();
  expect(
    useSentryStore
      .getState()
      .getLogs()
      .map(log => log.body),
  ).toEqual(["next"]);
});

test("a failed exception context request still waits for successful sibling context", async () => {
  useSentryStore.getState().resetData();
  let finishContext!: (response: unknown) => void;
  fetchContext.mockRejectedValueOnce(new Error("context unavailable")).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finishContext = resolve;
        releaseRequest = () => resolve({ status: 503 });
      }),
  );
  const captured = useSentryStore.getState().ingestEnvelope([
    {},
    [
      [
        { type: "event" },
        {
          event_id: "multiple-errors",
          timestamp: 1,
          exception: {
            values: [
              { type: "Error", value: "first", stacktrace: { frames: [{ filename: "first.ts" }] } },
              { type: "Error", value: "second", stacktrace: { frames: [{ filename: "second.ts" }] } },
            ],
          },
        },
      ],
    ],
  ]);
  await vi.waitFor(() => expect(fetchContext).toHaveBeenCalledTimes(2));
  // The optional failure must not make the sibling's successful enrichment arrive after commit.
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(useSentryStore.getState().getEventById("multiple-errors")).toBeUndefined();
  finishContext({
    status: 200,
    json: async () => ({ frames: [{ filename: "second.ts", context_line: "throw error;" }] }),
  });
  await expect(captured).resolves.toMatchObject({ status: "processed" });
  expect(useSentryStore.getState().getEventById("multiple-errors")).toMatchObject({
    exception: { values: [{ value: "first" }, { stacktrace: { frames: [{ context_line: "throw error;" }] } }] },
  });
});

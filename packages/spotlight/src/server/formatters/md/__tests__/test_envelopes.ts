import type { ErrorEvent } from "@sentry/core";

export const envelopeReactClientSideError: ErrorEvent = {
  exception: {
    values: [
      {
        type: "ModuleBuildError",
        value:
          'Module build failed (from ./node_modules/.pnpm/next@15.4.4_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):\nError:   × You\'re importing a component that needs `useState`. This React Hook only works in a Client Component. To fix, mark the file (or its parent) with the `"use client"` directive.\n  │\n  │  Learn more: https://nextjs.org/docs/app/api-reference/directives/use-client\n  │\n\n   ╭─[/Users/am/dev/tests/spotlight-mcp-error/app/page.tsx:1:1]\n 1 │ import { useState } from "react";\n   ·          ────────\n 2 │ \n 3 │ export default function Home() {\n 4 │   const [count, setCount] = useState(0);\n   ╰────\n',
        stacktrace: {
          frames: [
            {
              filename:
                "app:///Users/am/dev/tests/spotlight-mcp-error/node_modules/.pnpm/next@15.4.4_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/loader-runner/LoaderRunner.js",
              function: "r.callback",
              in_app: false,
              lineno: 1,
              colno: 4039,
            },
            {
              filename:
                "app:///Users/am/dev/tests/spotlight-mcp-error/node_modules/.pnpm/next@15.4.4_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/loader-runner/LoaderRunner.js",
              function: "<unknown>",
              in_app: false,
              lineno: 1,
              colno: 5019,
            },
            {
              filename:
                "app:///Users/am/dev/tests/spotlight-mcp-error/node_modules/.pnpm/next@15.4.4_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/loader-runner/LoaderRunner.js",
              function: "<unknown>",
              in_app: false,
              lineno: 1,
              colno: 8645,
            },
            {
              filename:
                "app:///Users/am/dev/tests/spotlight-mcp-error/node_modules/.pnpm/next@15.4.4_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/webpack/bundle5.js",
              function: "<unknown>",
              in_app: false,
              lineno: 29,
              colno: 408881,
            },
            {
              filename:
                "app:///Users/am/dev/tests/spotlight-mcp-error/node_modules/.pnpm/next@15.4.4_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/webpack/bundle5.js",
              function: "processResult",
              in_app: false,
              lineno: 29,
              colno: 407086,
            },
            {
              filename: "app:///docs/app/api-reference/directives/use-client",
              function: "│  Learn more: ",
              in_app: false,
            },
          ],
        },
        mechanism: {
          type: "instrument",
          handled: false,
          data: {
            function: "setTimeout",
          },
        },
      },
    ],
  },
  level: "error",
  event_id: "32f267ffaeda4b3ba95c4080c1faa3e2",
  platform: "javascript",
  request: {
    url: "http://localhost:3000/",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    },
  },
  timestamp: 1754524378.869,
  environment: "development",
  release: "d7352bbc003e30c051f39dbd03b8b4d9e0b034ea",
  sdk: {
    integrations: [
      "InboundFilters",
      "FunctionToString",
      "BrowserApiErrors",
      "Breadcrumbs",
      "GlobalHandlers",
      "LinkedErrors",
      "Dedupe",
      "HttpContext",
      "BrowserSession",
      "BrowserTracing",
      "NextjsClientStackFrameNormalization",
      "SpotlightBrowserDirect",
      "SpotlightBrowser",
    ],
    name: "sentry.javascript.nextjs",
    version: "9.42.1",
    packages: [
      {
        name: "npm:@sentry/nextjs",
        version: "9.42.1",
      },
      {
        name: "npm:@sentry/react",
        version: "9.42.1",
      },
    ],
  },
  contexts: {
    trace: {
      parent_span_id: "ce75b8fe4d8e2b1d",
      span_id: "99b1b00fd587005d",
      trace_id: "71a8c5e41ae1044dee67f50a07538fe7",
    },
    react: {
      version: "19.1.0",
    },
  },
  transaction: "/_error",
  extra: {
    arguments: [],
  },
  type: undefined,
};

export const envelopeFetchRequestError: ErrorEvent = {
  exception: {
    values: [
      {
        type: "TypeError",
        value: "data.map is not a function",
        stacktrace: {
          frames: [
            {
              filename:
                "webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.4.4_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/scheduler/cjs/scheduler.development.js",
              function: "MessagePort.performWorkUntilDeadline",
              in_app: false,
              lineno: 45,
              colno: 48,
            },
            {
              filename:
                "webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.4.4_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js",
              function: "performWorkOnRootViaSchedulerTask",
              in_app: false,
              lineno: 16767,
              colno: 7,
            },
            {
              filename:
                "webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.4.4_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js",
              function: "performWorkOnRoot",
              in_app: false,
              lineno: 14985,
              colno: 44,
            },
            {
              filename:
                "webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.4.4_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js",
              function: "renderRootSync",
              in_app: false,
              lineno: 15478,
              colno: 11,
            },
            {
              filename:
                "webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.4.4_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js",
              function: "workLoopSync",
              in_app: false,
              lineno: 15498,
              colno: 41,
            },
            {
              filename:
                "webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.4.4_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js",
              function: "performUnitOfWork",
              in_app: false,
              lineno: 15678,
              colno: 22,
            },
            {
              filename:
                "webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.4.4_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js",
              function: "runWithFiberInDEV",
              in_app: false,
              lineno: 873,
              colno: 30,
            },
            {
              filename:
                "webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.4.4_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js",
              function: "beginWork",
              in_app: false,
              lineno: 10680,
              colno: 18,
            },
            {
              filename:
                "webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.4.4_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js",
              function: "updateFunctionComponent",
              in_app: false,
              lineno: 9070,
              colno: 19,
            },
            {
              filename:
                "webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.4.4_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js",
              function: "renderWithHooks",
              in_app: false,
              lineno: 6764,
              colno: 22,
            },
            {
              filename:
                "webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@15.4.4_@babel+core@7.28.0_@opentelemetry+api@1.9.0_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js",
              function: "Object.react_stack_bottom_frame",
              in_app: false,
              lineno: 23553,
              colno: 20,
            },
            {
              filename: "app/todos/page.tsx",
              function: "Home",
              in_app: true,
              lineno: 22,
              colno: 13,
              pre_context: ["   return (", "     <div>"],
              context_line: "       {data.map((item, index) => (",
              post_context: [
                '         <div key={item.id} className="flex flex-row gap-2">{index + 1}.',
                '           <h1 className={item.completed ? "line-through text-gray-500" : "text-white"}>{item.title} by {item.userId}</h1>',
                "         </div>",
              ],
            },
          ],
        },
        mechanism: {
          type: "onerror",
          handled: false,
        },
      },
    ],
  },
  level: "error",
  platform: "javascript",
  request: {
    url: "http://localhost:3000/todos",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    },
  },
  event_id: "416cb017d16c434b8f63e5a297921492",
  timestamp: 1754525223.737,
  environment: "development",
  release: "d7352bbc003e30c051f39dbd03b8b4d9e0b034ea",
  sdk: {
    integrations: [
      "InboundFilters",
      "FunctionToString",
      "BrowserApiErrors",
      "Breadcrumbs",
      "GlobalHandlers",
      "LinkedErrors",
      "Dedupe",
      "HttpContext",
      "BrowserSession",
      "BrowserTracing",
      "NextjsClientStackFrameNormalization",
      "SpotlightBrowserDirect",
      "SpotlightBrowser",
    ],
    name: "sentry.javascript.nextjs",
    version: "9.42.1",
    packages: [
      {
        name: "npm:@sentry/nextjs",
        version: "9.42.1",
      },
      {
        name: "npm:@sentry/react",
        version: "9.42.1",
      },
    ],
  },
  contexts: {
    trace: {
      parent_span_id: "249a7141b441981d",
      span_id: "9f41eed03c40cd63",
      trace_id: "739b847cef89fe6f5b7cbf8e099a3b7a",
    },
    react: {
      version: "19.2.0-canary-97cdd5d3-20250710",
    },
  },
  transaction: "/todos",
  breadcrumbs: [
    {
      timestamp: 1754525223.676,
      category: "console",
      data: {
        arguments: [
          "[Client Instrumentation Hook] Slow execution detected: 58ms (Note: Code download overhead is not included in this measurement)",
        ],
        logger: "console",
      },
      level: "log",
      message:
        "[Client Instrumentation Hook] Slow execution detected: 58ms (Note: Code download overhead is not included in this measurement)",
    },
    {
      timestamp: 1754525223.685,
      category: "console",
      data: {
        arguments: [
          "%cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools",
          "font-weight:bold",
        ],
        logger: "console",
      },
      level: "info",
      message:
        "%cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold",
    },
    {
      timestamp: 1754525223.705,
      category: "navigation",
      data: {
        from: "/todos",
        to: "/todos",
      },
    },
    {
      timestamp: 1754525223.713,
      category: "console",
      data: {
        arguments: ["Spotlight debugger container not found"],
        logger: "console",
      },
      level: "warning",
      message: "Spotlight debugger container not found",
    },
    {
      timestamp: 1754525223.724,
      category: "fetch",
      data: {
        method: "GET",
        url: "https://jsonplaceholder.typicode.com/todo",
        __span: "b236aef4c4db2b24",
        status_code: 404,
      },
      type: "http",
      level: "warning",
    },
  ],
  type: undefined,
};

export const envelopeTransactionEvent = {
  event_id: "abc123def456789a",
  type: "transaction",
  transaction: "/api/users",
  timestamp: 1754524400.123,
  start_timestamp: 1754524400.1,
  platform: "javascript",
  contexts: {
    trace: {
      trace_id: "71a8c5e41ae1044dee67f50a07538fe7",
      span_id: "99b1b00fd587005d",
      parent_span_id: "ce75b8fe4d8e2b1d",
    },
  },
  spans: [
    {
      span_id: "abc123456789def0",
      parent_span_id: "99b1b00fd587005d",
      trace_id: "71a8c5e41ae1044dee67f50a07538fe7",
      op: "db.query",
      description: "SELECT * FROM users WHERE id = ?",
      start_timestamp: 1754524400.105,
      timestamp: 1754524400.115,
      duration: 10,
      status: "ok",
      data: {
        "db.statement": "SELECT * FROM users WHERE id = ?",
        "db.system": "postgresql",
      },
    },
    {
      span_id: "def0123456789abc",
      parent_span_id: "99b1b00fd587005d",
      trace_id: "71a8c5e41ae1044dee67f50a07538fe7",
      op: "http.client",
      description: "GET /external-api/profile",
      start_timestamp: 1754524400.12,
      timestamp: 1754524400.14,
      duration: 20,
      status: "ok",
      data: {
        "http.method": "GET",
        "http.url": "/external-api/profile",
        "http.status_code": 200,
      },
    },
  ],
  sdk: {
    name: "sentry.javascript.nextjs",
    version: "9.42.1",
  },
};

export const envelopeSecondTransactionEvent = {
  event_id: "xyz789abc123def4",
  type: "transaction",
  transaction: "/api/orders",
  timestamp: 1754524401.2,
  start_timestamp: 1754524401.15,
  platform: "javascript",
  contexts: {
    trace: {
      trace_id: "a1b2c3d4e5f6789012345678901234567890abcd",
      span_id: "1234567890abcdef",
      parent_span_id: undefined,
    },
  },
  spans: [
    {
      span_id: "fedcba0987654321",
      parent_span_id: "1234567890abcdef",
      trace_id: "a1b2c3d4e5f6789012345678901234567890abcd",
      op: "db.query",
      description: "INSERT INTO orders (user_id, total) VALUES (?, ?)",
      start_timestamp: 1754524401.155,
      timestamp: 1754524401.165,
      duration: 10,
      status: "ok",
    },
    {
      span_id: "9876543210fedcba",
      parent_span_id: "fedcba0987654321",
      trace_id: "a1b2c3d4e5f6789012345678901234567890abcd",
      op: "cache.get",
      description: "redis.get user_preferences:123",
      start_timestamp: 1754524401.17,
      timestamp: 1754524401.175,
      duration: 5,
      status: "ok",
    },
  ],
  sdk: {
    name: "sentry.javascript.nextjs",
    version: "9.42.1",
  },
};

// V1 Profile Event (transaction-based profiling)
export const envelopeProfileV1Event = {
  type: "profile" as const,
  version: "1" as const,
  event_id: "profile1234567890abcdef1234567890ab",
  timestamp: 1754524400.5,
  platform: "python",
  device: {
    architecture: "x86_64",
    is_emulator: false,
    locale: "en-US",
    manufacturer: "Apple",
    model: "MacBookPro18,3",
  },
  os: {
    name: "macOS",
    version: "14.0",
    build_number: "23A344",
  },
  transactions: [
    {
      name: "/api/users",
      id: "txn123456789abcdef",
      trace_id: "71a8c5e41ae1044dee67f50a07538fe7",
      active_thread_id: "1",
      relative_start_ns: "0",
      relative_end_ns: "100000000",
    },
  ],
  profile: {
    samples: [
      { elapsed_since_start_ns: "0", stack_id: 0, thread_id: "1" },
      { elapsed_since_start_ns: "10000000", stack_id: 1, thread_id: "1" },
      { elapsed_since_start_ns: "20000000", stack_id: 2, thread_id: "1" },
      { elapsed_since_start_ns: "30000000", stack_id: 1, thread_id: "1" },
      { elapsed_since_start_ns: "40000000", stack_id: 0, thread_id: "1" },
    ],
    stacks: [
      [0], // main
      [1, 0], // handle_request -> main
      [2, 1, 0], // query_database -> handle_request -> main
    ],
    frames: [
      { function: "main", filename: "app.py", lineno: 10, in_app: true },
      { function: "handle_request", filename: "views.py", lineno: 25, in_app: true },
      { function: "query_database", filename: "db.py", lineno: 50, in_app: true },
    ],
    thread_metadata: {
      "1": { name: "MainThread", priority: 5 },
    },
  },
};

// V2 Profile Chunk Event (continuous profiling)
export const envelopeProfileV2ChunkEvent = {
  type: "profile_chunk" as const,
  version: "2" as const,
  profiler_id: "71bba98d90b545c39f2ae73f702d7ef4",
  chunk_id: "3e11a5c9831f4e49939c0a81944ea2cb",
  platform: "cocoa",
  release: "io.sentry.sample.iOS-Swift@8.36.0+1",
  environment: "simulator",
  client_sdk: {
    name: "sentry.cocoa",
    version: "8.36.0",
  },
  debug_meta: {
    images: [
      {
        debug_id: "5819FF25-01CB-3D32-B84F-0634B37D3BBC",
        image_addr: "0x00000001023a8000",
        type: "macho",
        image_size: 16384,
        code_file:
          "/Library/Developer/CoreSimulator/Volumes/iOS_21C62/Library/Developer/CoreSimulator/Profiles/Runtimes/iOS 17.2.simruntime/Contents/Resources/RuntimeRoot/usr/lib/libLogRedirect.dylib",
      },
    ],
  },
  measurements: {
    frozen_frame_renders: {
      unit: "nanosecond",
      values: [{ timestamp: 1724777211.6403089, value: 16000000 }],
    },
  },
  profile: {
    samples: [
      { timestamp: 1724777211.5037799, stack_id: 0, thread_id: "259" },
      { timestamp: 1724777211.5137799, stack_id: 1, thread_id: "259" },
      { timestamp: 1724777211.5237799, stack_id: 2, thread_id: "259" },
      { timestamp: 1724777211.5337799, stack_id: 1, thread_id: "259" },
      { timestamp: 1724777211.5437799, stack_id: 0, thread_id: "259" },
    ],
    stacks: [
      [0], // _main
      [1, 0], // UIApplicationMain -> _main
      [2, 1, 0], // -[AppDelegate application:didFinishLaunchingWithOptions:] -> UIApplicationMain -> _main
    ],
    frames: [
      {
        instruction_addr: "0x000000010232d144",
        function: "_main",
        filename: "main.m",
        in_app: true,
      },
      {
        instruction_addr: "0x000000010232d200",
        function: "UIApplicationMain",
        module: "UIKit",
        in_app: false,
      },
      {
        instruction_addr: "0x000000010232d300",
        function: "-[AppDelegate application:didFinishLaunchingWithOptions:]",
        filename: "AppDelegate.swift",
        lineno: 15,
        in_app: true,
      },
    ],
    thread_metadata: {
      "259": { name: "main", priority: 31 },
    },
  },
};

// Second V2 chunk for the same profiler session (for testing chunk merging)
export const envelopeProfileV2ChunkEvent2 = {
  type: "profile_chunk" as const,
  version: "2" as const,
  profiler_id: "71bba98d90b545c39f2ae73f702d7ef4", // Same profiler_id
  chunk_id: "abc123def456789012345678901234cd", // Different chunk_id
  platform: "cocoa",
  release: "io.sentry.sample.iOS-Swift@8.36.0+1",
  environment: "simulator",
  client_sdk: {
    name: "sentry.cocoa",
    version: "8.36.0",
  },
  profile: {
    samples: [
      { timestamp: 1724777211.553, stack_id: 0, thread_id: "259" },
      { timestamp: 1724777211.563, stack_id: 1, thread_id: "259" },
      { timestamp: 1724777211.573, stack_id: 0, thread_id: "259" },
    ],
    stacks: [
      [0], // viewDidLoad
      [1, 0], // loadData -> viewDidLoad
    ],
    frames: [
      {
        instruction_addr: "0x000000010232e100",
        function: "-[ViewController viewDidLoad]",
        filename: "ViewController.swift",
        lineno: 20,
        in_app: true,
      },
      {
        instruction_addr: "0x000000010232e200",
        function: "-[ViewController loadData]",
        filename: "ViewController.swift",
        lineno: 45,
        in_app: true,
      },
    ],
    thread_metadata: {
      "259": { name: "main", priority: 31 },
    },
  },
};

// Transaction with profiler_id context (for V2 profile linking)
export const envelopeTransactionWithProfilerContext = {
  event_id: "txn_with_profiler_123",
  type: "transaction",
  transaction: "/ios/app/launch",
  timestamp: 1724777211.6,
  start_timestamp: 1724777211.5,
  platform: "cocoa",
  contexts: {
    trace: {
      trace_id: "f1e2d3c4b5a6978012345678901234ab",
      span_id: "abc123def4567890",
      parent_span_id: undefined,
      data: {
        "thread.id": "259",
        "thread.name": "main",
      },
    },
    profile: {
      profiler_id: "71bba98d90b545c39f2ae73f702d7ef4", // Links to V2 profile chunks
    },
  },
  spans: [
    {
      span_id: "span1234567890ab",
      parent_span_id: "abc123def4567890",
      trace_id: "f1e2d3c4b5a6978012345678901234ab",
      op: "app.start",
      description: "Application Launch",
      start_timestamp: 1724777211.51,
      timestamp: 1724777211.55,
      duration: 40,
      status: "ok",
      data: {
        "thread.id": "259",
      },
    },
  ],
  sdk: {
    name: "sentry.cocoa",
    version: "8.36.0",
  },
};

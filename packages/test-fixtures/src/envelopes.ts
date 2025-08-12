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
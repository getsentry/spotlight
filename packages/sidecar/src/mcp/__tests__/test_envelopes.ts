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

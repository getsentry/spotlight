import { sentryVitePlugin } from "@sentry/vite-plugin";
import type { AstroIntegration } from "astro";
import { loadEnv } from "vite";

const DSN =
  "https://1d8b45cffaf0d833276a6ad1ae7d726d@o447951.ingest.sentry.io/4505912155701248";
const PKG_NAME = "@sentry/astro";
interface SentryOptions {
  dsn?: string;
  project?: string;
  org?: string;
  authToken?: string;
  debug?: boolean;
}
function buildClientSnippet(options: SentryOptions) {
  return `import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: ${
    options.dsn
      ? JSON.stringify(options.dsn)
      : "import.meta.env.PUBLIC_SENTRY_DSN"
  },
  debug: ${options.debug ? true : false},
  environment: import.meta.env.PUBLIC_VERCEL_ENV,
  release: import.meta.env.PUBLIC_VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 1.0,
  integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
});`;
}
function buildServerSnippet(options: SentryOptions) {
  return `import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: ${
    options.dsn
      ? JSON.stringify(options.dsn)
      : "import.meta.env.PUBLIC_SENTRY_DSN"
  },
  debug: ${options.debug ? true : false},
  environment: import.meta.env.PUBLIC_VERCEL_ENV,
  release: import.meta.env.PUBLIC_VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 1.0,
});
//Sentry.getCurrentHub().getClient().setupIntegrations(true);
Sentry.getCurrentHub().getClient().on("beforeEnvelope", (envelope) => {
    console.log('I AM HERE');

function serializeEnvelope(envelope) {
    const [envHeaders, items] = envelope;
  
    // Initially we construct our envelope as a string and only convert to binary chunks if we encounter binary data
    const parts = [];
    parts.push(JSON.stringify(envHeaders));
  
    for (const item of items) {
      const [itemHeaders, payload] = item;
  
      parts.push('\\n' + JSON.stringify(itemHeaders)+ '\\n');
  
      parts.push(JSON.stringify(payload));
    }
  
    return parts.join("");
  }
    fetch('http://localhost:8969/stream', {
      method: 'POST',
      body: serializeEnvelope(envelope),
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
      mode: 'cors',
    })
      .catch(err => {
        console.error(err);
      });
  });
  console.log('xxx',Sentry.getCurrentHub().getClient());
  Sentry.captureMessage('test');
`;
}
const createPlugin = (options: SentryOptions = {}): AstroIntegration => {
  return {
    name: PKG_NAME,
    hooks: {
      "astro:config:setup": async ({ updateConfig, injectScript }) => {
        console.log('@sentry/astro astro:config:setup ------------');
        const env = loadEnv("production", process.cwd());
        if (options.authToken ?? env.SENTRY_AUTH_TOKEN) {
          updateConfig({
            vite: {
              build: {
                sourcemap: true,
              },
              plugins: [
                sentryVitePlugin({
                  org: options.org,
                  project: options.project,
                  // include: "./dist",
                  // Auth tokens can be obtained from https://sentry.io/settings/account/api/auth-tokens/
                  // and needs the `project:releases` and `org:read` scopes
                  authToken: options.authToken ?? env.SENTRY_AUTH_TOKEN,
                }),
              ],
            },
          });
        }
        injectScript("page", buildClientSnippet(options || {}));
        injectScript("page-ssr", buildServerSnippet(options || {}));
      },
    },
  };
};

export default createPlugin;
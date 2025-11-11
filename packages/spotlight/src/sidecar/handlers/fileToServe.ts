import { extname } from "node:path";
import type { Handler } from "hono";

const extensionsToContentType: Record<string, string | undefined> = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
};

export function serveFilesHandler(filesToServe: Record<string, Buffer>): Handler {
  return ctx => {
    let filePath = `${ctx.req.path || ctx.req.url}`;

    // The `/telemetry` route is handled by the React app with the location
    // router. This is kind of a hack to avoid a 404 when the user refreshes
    // the page or directly navigates to `/telemetry`. Should probably find
    // a better way to share routes from the UI to the sidecar later on.
    if (filePath === "/" || filePath.startsWith("/telemetry")) {
      filePath = "/index.html";
    }

    filePath = filePath.slice(1);

    const extName = extname(filePath);
    const contentType = extensionsToContentType[extName] ?? "text/html";

    if (!Object.hasOwn(filesToServe, filePath) || !filesToServe[filePath]) {
      return ctx.notFound();
    }

    // Enable profiling in browser
    ctx.header("Document-Policy", "js-profiling");
    ctx.header("Content-Type", contentType);

    return ctx.body(new Uint8Array(filesToServe[filePath]));
  };
}

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

    if (filePath === "/") {
      filePath = "/src/index.html";
    }
    filePath = filePath.slice(1);

    const extName = extname(filePath);
    const contentType = extensionsToContentType[extName] ?? "text/html";

    if (!Object.hasOwn(filesToServe, filePath)) {
      return ctx.notFound();
    }

    // Enable profiling in browser
    ctx.header("Document-Policy", "js-profiling");
    ctx.header("Content-Type", contentType);

    return ctx.body(filesToServe[filePath]);
  };
}

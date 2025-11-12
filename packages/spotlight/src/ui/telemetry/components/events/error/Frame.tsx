import { useState } from "react";
import { cn } from "@spotlight/ui/lib/cn";
import { renderValue } from "@spotlight/ui/lib/values";
import CopyToClipboard from "@spotlight/ui/telemetry/components/shared/CopyToClipboard";
import OpenInEditor from "@spotlight/ui/telemetry/components/shared/OpenInEditor";
import type { EventFrame, FrameVars } from "@spotlight/ui/telemetry/types";
import Table from "@spotlight/ui/ui/table";
import { CodeViewer } from "../../insights/envelopes/CodeViewer";

function resolveFilename(filename: string) {
  try {
    const url = new URL(filename);
    return url.pathname.slice(1);
  } catch {
    // ignore
  }

  return filename;
}

function formatFilename(filename: string) {
  if (filename.startsWith("node:")) return filename;
  const resolvedFilename = resolveFilename(filename);
  if (resolvedFilename.indexOf("/node_modules/") === -1) return resolvedFilename;
  return `npm:${resolvedFilename
    .replace(/\/node_modules\//gi, "npm:")
    .split("npm:")
    .pop()}`;
}

function ContextLocals({ vars }: { vars: FrameVars }) {
  return (
    <Table className="table-values w-full">
      <Table.Body>
        {Object.entries(vars).map(([key, value]) => {
          return (
            <tr key={key}>
              <th>
                <div className="w-full truncate">{key}</div>
              </th>
              <td>
                <pre className="whitespace-nowrap font-mono">{renderValue(value)}</pre>
              </td>
            </tr>
          );
        })}
      </Table.Body>
    </Table>
  );
}

function FileActions({ frame }: { frame: EventFrame }) {
  if (!frame.filename) {
    return null;
  }
  const resolvedFilename = resolveFilename(frame.filename);
  return (
    <div className="flex items-center gap-2">
      <OpenInEditor file={`${resolvedFilename}:${frame.lineno}:${frame.colno}`} />
      <CopyToClipboard data={resolvedFilename} />
    </div>
  );
}

export default function Frame({
  frame,
  defaultExpand = false,
  platform,
}: {
  frame: EventFrame;
  defaultExpand: boolean;
  platform?: string;
}) {
  const [isOpen, setOpen] = useState(defaultExpand);

  const hasSource = Boolean(frame.context_line);
  const fileName = platform === "java" ? frame.module : frame.filename || frame.module;
  return (
    <li
      className={cn(
        hasSource ? "cursor-pointer" : "",
        !isOpen && hasSource ? "hover:bg-primary-900" : "",
        "bg-primary-950 border-primary-900 my-1 overflow-hidden rounded-md border",
      )}
      role={hasSource ? "button" : undefined}
      tabIndex={0}
      onClick={hasSource ? () => setOpen(!isOpen) : undefined}
      onKeyDown={e => e.key === "Enter" && hasSource && setOpen(!isOpen)}
    >
      <div
        className={cn("text-primary-400 flex items-center justify-between px-2 py-1", isOpen ? "bg-primary-900" : "")}
        onClick={hasSource ? () => setOpen(!isOpen) : undefined}
      >
        <div>
          {fileName ? (
            <span className="text-primary-100">
              {formatFilename(fileName)}
              {" in "}
            </span>
          ) : null}

          <span className="text-primary-100">{frame.function}</span>
          {frame.lineno !== undefined && (
            <>
              {" "}
              at line{" "}
              <span className="text-primary-100">
                {frame.lineno}
                {frame.colno !== undefined && `:${frame.colno}`}
              </span>
            </>
          )}
        </div>
        <FileActions frame={frame} />
      </div>
      {isOpen && (
        <div className="bg-primary-950">
          <CodeViewer code={generateCodeFromFrame(frame)} lang={platform ?? "text"} />
          {frame.vars && <ContextLocals vars={frame.vars} />}
        </div>
      )}
    </li>
  );
}

function generateCodeFromFrame(frame: EventFrame) {
  let code = "";

  frame.pre_context?.forEach((line, relativeLineNo) => {
    const lineNo =
      frame.lineno != null ? frame.lineno - (frame.pre_context as string[]).length + relativeLineNo : relativeLineNo;
    code += `${lineNo}\t${line}\n`;
  });

  if (frame.context_line) {
    code += `${frame.lineno}\t${frame.context_line} // [!code highlight]\n`;
  }

  frame.post_context?.forEach((line, relativeLineNo) => {
    const lineNo = frame.lineno != null ? frame.lineno + 1 + relativeLineNo : relativeLineNo;
    code += `${lineNo}\t${line}\n`;
  });

  return code;
}

import classNames from "~/lib/classNames";
import type { Trace } from "../../../../types";
import TraceIcon from "../../TraceIcon";
import { TraceRootTxnName } from "./TraceRootTxnName";

type TraceDetailHeaderProps = {
  trace: Trace;
  onClose: () => void;
  hasAI: boolean;
  aiMode: boolean;
  onToggleAI: () => void;
};

export default function TraceDetailHeader({ trace, onClose, hasAI, aiMode, onToggleAI }: TraceDetailHeaderProps) {
  return (
    <div className="border-b-primary-700 bg-primary-950 flex items-center gap-x-2 border-b px-6 py-4">
      <TraceIcon trace={trace} />
      <h1 className="flex w-full flex-1 items-center truncate text-2xl">
        Trace:&nbsp;&nbsp;
        <TraceRootTxnName trace={trace} flowing />
      </h1>

      {/* AI Mode Toggle */}
      {hasAI && (
        <div className="flex items-center">
          <span id="ai-mode-label" className="text-primary-200 mr-3 text-sm font-medium" onClick={onToggleAI}>
            AI Mode
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={aiMode}
            aria-labelledby="ai-mode-label"
            onClick={onToggleAI}
            className={classNames(
              "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2",
              aiMode ? "bg-blue-500 focus:ring-blue-400" : "bg-primary-700 focus:ring-primary-600",
            )}
          >
            <span
              aria-hidden="true"
              className={classNames(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                aiMode ? "translate-x-5" : "translate-x-0",
              )}
            />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        className="text-primary-400 hover:text-primary-100 flex h-6 w-6 items-center justify-center text-lg font-bold"
        title="Close trace details"
      >
        ×
      </button>
    </div>
  );
}

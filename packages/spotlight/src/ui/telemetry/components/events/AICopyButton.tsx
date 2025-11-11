import { captureException } from "@sentry/core";
import { processErrorEvent } from "@spotlight/sidecar/formatters/md/errors.js";
import { formatEventOutput } from "@spotlight/sidecar/formatters/md/event.js";
import { type MouseEvent, useCallback, useEffect, useState } from "react";
import { ReactComponent as CheckIcon } from "@spotlight/ui/assets/check.svg";
import { ReactComponent as CopyIcon } from "@spotlight/ui/assets/copy.svg";
import { Button } from "@spotlight/ui/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@spotlight/ui/ui/tooltip";
import type { SentryErrorEvent } from "../../types";

interface AICopyButtonProps {
  event: SentryErrorEvent;
}

export default function AICopyButton({ event }: AICopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isCopied) {
      timeout = setTimeout(() => {
        setIsCopied(false);
      }, 1000);
    }

    return () => clearTimeout(timeout);
  }, [isCopied]);

  const handleClick = useCallback(
    async (evt: MouseEvent) => {
      evt.stopPropagation();

      setIsCopied(true);
      try {
        await navigator.clipboard.writeText(formatEventOutput(processErrorEvent(event as any)));
      } catch (err) {
        console.error(err);
        captureException(err);
      }
    },
    [event],
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            onClick={handleClick}
            disabled={isCopied || !window.isSecureContext}
            className="border-primary-700 hover:bg-primary-900 bg-primary-950 h-10 mix-blend-screen hover:text-white cursor-pointer flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCopied ? (
              <CheckIcon width={18} height={18} title="Copied!" className="stroke-primary-50 transition-all" />
            ) : (
              <CopyIcon width={18} height={18} title="Copy" className="stroke-primary-50 transition-all" />
            )}
            <span className="text-xs">✨ Copy for AI</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {!window.isSecureContext
              ? "This feature is only available in secure contexts"
              : "Markdown formatted error details for LLMs"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

import { formatEventOutput, processErrorEvent } from "@spotlightjs/sidecar/format";
import { type MouseEvent, useCallback, useState } from "react";
import { ReactComponent as CheckIcon } from "~/assets/check.svg";
import { ReactComponent as CopyIcon } from "~/assets/copy.svg";
import { Button } from "~/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/ui/tooltip";
import type { SentryErrorEvent } from "../../types";

interface AICopyButtonProps {
  event: SentryErrorEvent;
}

async function copyErrorToClipboard(prompt: string, setIsCopied: (copied: boolean) => void): Promise<void> {
  await navigator.clipboard.writeText(prompt);

  setIsCopied(true);
  setTimeout(() => {
    setIsCopied(false);
  }, 1000);
}

export default function AICopyButton({ event }: AICopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(
    async (evt: MouseEvent) => {
      evt.stopPropagation();
      if (isLoading) return;

      setIsLoading(true);
      await copyErrorToClipboard(formatEventOutput(processErrorEvent(event as any)), setIsCopied);
      setIsLoading(false);
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
            disabled={isLoading}
            className="border-primary-700 hover:bg-primary-900 bg-primary-950 h-10 mix-blend-screen hover:text-white cursor-pointer flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-[18px] h-[18px] border-2 border-primary-50 border-t-transparent rounded-full animate-spin" />
            ) : isCopied ? (
              <CheckIcon width={18} height={18} title="Copied!" className="stroke-primary-50 transition-all" />
            ) : (
              <CopyIcon width={18} height={18} title="Copy" className="stroke-primary-50 transition-all" />
            )}
            <span className="text-xs">✨ AI</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copy error details to use with any AI service</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

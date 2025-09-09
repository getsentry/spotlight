import { type MouseEvent, useCallback, useState } from "react";
import { ReactComponent as CheckIcon } from "~/assets/check.svg";
import { ReactComponent as CopyIcon } from "~/assets/copy.svg";
import { DEFAULT_SIDECAR_URL } from "~/constants";
import { log } from "~/lib/logger";
import { Button } from "~/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/ui/tooltip";
import type { SentryErrorEvent } from "../../types";

interface AICopyButtonProps {
  event: SentryErrorEvent;
}

/**
 * Fallback prompt if the sidecar is unavailable
 */
function generateFallbackPrompt(event: SentryErrorEvent): string {
  const errorType = event.exception?.value?.type || event.exception?.values?.[0]?.type || "Unknown";
  const errorMessage =
    event.exception?.value?.value || event.exception?.values?.[0]?.value || event.message || "No message available";

  return `Please help me fix this error:

**Error Details:**
- Error ID: ${event.event_id}
- Error Type: ${errorType}
- Error Message: ${errorMessage}
- Platform: ${event.platform || "Unknown"}
- Timestamp: ${new Date(event.timestamp * 1000).toISOString()}

Please provide:
1. Root cause analysis
2. Specific fix recommendations
3. Code examples if applicable`;
}

/**
 * Fetches formatted error data from the sidecar
 */
async function fetchFormattedError(eventId: string): Promise<string> {
  const getErrorUrl: string = new URL(`${DEFAULT_SIDECAR_URL}/error?eventId=${eventId}`, DEFAULT_SIDECAR_URL).href;
  const response = await fetch(getErrorUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch formatted error: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data.formattedError;
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
  const [cachedFormattedError, setCachedFormattedError] = useState<string | null>(null);

  const handleClick = useCallback(
    async (evt: MouseEvent) => {
      evt.stopPropagation();
      if (isLoading) return;

      // If we have cached data for this event, use it immediately
      if (cachedFormattedError) {
        try {
          const prompt = `Please help me fix this error:\n\n${cachedFormattedError}\n\nPlease provide:\n1. Root cause analysis\n2. Specific fix recommendations\n3. Code examples if applicable`;
          await copyErrorToClipboard(prompt, setIsCopied);
          return;
        } catch (error) {
          log(`Failed to copy cached error details: ${error}`);
        }
      }

      setIsLoading(true);
      try {
        const formattedError = await fetchFormattedError(event.event_id);
        const prompt = `Please help me fix this error:\n\n${formattedError}\n\nPlease provide:\n1. Root cause analysis\n2. Specific fix recommendations\n3. Code examples if applicable`;
        setCachedFormattedError(formattedError);
        await copyErrorToClipboard(prompt, setIsCopied);
      } catch (error) {
        log(`Failed to fetch from sidecar, using fallback: ${error}`);
        const fallbackPrompt = generateFallbackPrompt(event);
        await copyErrorToClipboard(fallbackPrompt, setIsCopied);
      } finally {
        setIsLoading(false);
      }
    },
    [event, isLoading, cachedFormattedError],
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

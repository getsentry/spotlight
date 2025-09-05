import type React from "react";
import { useCallback, useState } from "react";
import { ReactComponent as CheckIcon } from "~/assets/check.svg";
import { ReactComponent as CopyIcon } from "~/assets/copy.svg";
import { Button } from "~/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/ui/tooltip";
import type { SentryErrorEvent } from "../../types";
import { formatErrorForAI } from "../../utils/aiFormatting";

interface AICopyButtonProps {
  event: SentryErrorEvent;
}

export default function AICopyButton({ event }: AICopyButtonProps) {
  const errorContext = formatErrorForAI(event);

  const [isCopied, setIsCopied] = useState(false);

  const prompt = `Please help me fix this error:\n\n${errorContext}\n\nPlease provide:\n1. Root cause analysis\n2. Specific fix recommendations\n3. Code examples if applicable`;

  const handleClick = useCallback(
    (evt: React.MouseEvent) => {
      evt.stopPropagation();
      navigator.clipboard.writeText(prompt);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 1000);
    },
    [prompt],
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            onClick={handleClick}
            className="border-primary-700 hover:bg-primary-900 bg-primary-950 h-10 mix-blend-screen hover:text-white cursor-pointer flex items-center gap-1"
          >
            {isCopied ? (
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

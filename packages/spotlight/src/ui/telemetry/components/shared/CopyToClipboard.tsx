import type React from "react";
import { useCallback, useState } from "react";
import { ReactComponent as CheckIcon } from "~/assets/check.svg";
import { ReactComponent as CopyIcon } from "~/assets/copy.svg";

export default function CopyToClipboard({ data }: { data: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(
    (evt: React.MouseEvent) => {
      evt.stopPropagation();
      navigator.clipboard.writeText(data);
      setTimeout(() => {
        setIsCopied(false);
      }, 1000);
      setIsCopied(true);
    },
    [data],
  );

  if (isCopied) {
    return <CheckIcon width={18} height={18} title="Copy filename" className="stroke-primary-50 transition-all" />;
  }

  return (
    <CopyIcon
      width={18}
      height={18}
      title="Copy filename"
      className="stroke-primary-50 cursor-pointer transition-all"
      onClick={handleCopy}
    />
  );
}

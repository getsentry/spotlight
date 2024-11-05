import { useState } from 'react';
import { ReactComponent as CheckIcon } from '~/assets/check.svg';
import { ReactComponent as CopyIcon } from '~/assets/copy.svg';

export default function CopyToClipboard({ data }: { data: string }) {
  const [isCopied, setIsCopied] = useState(false);
  return isCopied ? (
    <CheckIcon width={18} height={18} title="Copy filename" className="stroke-primary-50 transition-all" />
  ) : (
    <CopyIcon
      width={18}
      height={18}
      title="Copy filename"
      className="stroke-primary-50 transition-all"
      onClick={evt => {
        evt.stopPropagation();
        navigator.clipboard.writeText(data);
        setTimeout(() => {
          setIsCopied(false);
        }, 1000);
        setIsCopied(true);
      }}
    />
  );
}

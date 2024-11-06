import type React from 'react';
import { useCallback } from 'react';
import { ReactComponent as PenIcon } from '../../assets/pen.svg';

export default function OpenInEditor({ file }: { file: string }) {
  const openInEditor = useCallback(
    (evt: React.MouseEvent) => {
      // TODO: Make this URL dynamic based on sidecarUrl!
      fetch('http://localhost:8969/open', {
        method: 'POST',
        body: file,
        credentials: 'omit',
      });
      evt.stopPropagation();
    },
    [file],
  );
  return (
    <PenIcon width={18} height={18} title="Open in editor" className="stroke-primary-100" onClick={openInEditor} />
  );
}

import type React from 'react';
import { useCallback } from 'react';
import sentryDataCache from '~/integrations/sentry/data/sentryDataCache';
import { ReactComponent as PenIcon } from '../assets/pen.svg';

export default function OpenInEditor({ file }: { file: string }) {
  const openInEditor = useCallback(
    (evt: React.MouseEvent) => {
      fetch(`${sentryDataCache.getSidecarUrl()}/open`, {
        method: 'POST',
        body: file,
        credentials: 'omit',
      });
      evt.stopPropagation();
    },
    [file],
  );
  return (
    <PenIcon
      width={18}
      height={18}
      title="Open in editor"
      className="stroke-primary-100 cursor-pointer"
      onClick={openInEditor}
    />
  );
}

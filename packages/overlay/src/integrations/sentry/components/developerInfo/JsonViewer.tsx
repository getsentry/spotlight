import { Envelope, EnvelopeItem } from '@sentry/types';
import { Suspense, lazy } from 'react';
import { RawEventContext } from '~/integrations/integration';
const LazyReactJson = lazy(() => import('react-json-view'));

export default function JsonViewer({
  data,
  onUpdateData = () => {},
  editingEnabled = false,
  clipboardEnabled = false,
  displayDataTypes = false,
  quotesOnKeys = false,
}: {
  data: Envelope[0] | EnvelopeItem | RawEventContext;
  onUpdateData?: (value: unknown) => void;
  editingEnabled?: boolean;
  clipboardEnabled?: boolean;
  displayDataTypes?: boolean;
  quotesOnKeys?: boolean;
}) {
  return (
    <Suspense fallback={<div>loading...</div>}>
      <LazyReactJson
        theme="bright"
        displayDataTypes={displayDataTypes}
        quotesOnKeys={quotesOnKeys}
        shouldCollapse={({ src, type }) => type === 'array' && Object.values(src).length > 5}
        src={data}
        enableClipboard={clipboardEnabled}
        onEdit={
          editingEnabled &&
          (e => {
            if (e.new_value == 'error') {
              return false;
            }
            onUpdateData(e.updated_src);
          })
        }
        onDelete={
          editingEnabled &&
          (e => {
            if (e.new_value == 'error') {
              return false;
            }
            onUpdateData(e.updated_src);
          })
        }
        onAdd={
          editingEnabled &&
          (e => {
            if (e.new_value == 'error') {
              return false;
            }
            onUpdateData(e.updated_src);
          })
        }
      />
    </Suspense>
  );
}

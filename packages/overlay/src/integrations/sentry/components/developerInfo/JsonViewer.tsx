import type { Envelope, EnvelopeItem } from '@sentry/types';
import ReactJson from 'react-json-view';
import type { RawEventContext } from '~/integrations/integration';

// Need this separately to fix Storybook 8 bundling
// See #419 and #420 for more context
const noop = () => {};

export default function JsonViewer({
  data,
  onUpdateData = noop,
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
    <ReactJson
      theme="bright"
      displayDataTypes={displayDataTypes}
      quotesOnKeys={quotesOnKeys}
      shouldCollapse={({ src, type }) => type === 'array' && Object.values(src).length > 5}
      src={data}
      enableClipboard={clipboardEnabled}
      onEdit={
        editingEnabled &&
        (e => {
          if (e.new_value === 'error') {
            return false;
          }
          onUpdateData(e.updated_src);
        })
      }
      onDelete={
        editingEnabled &&
        (e => {
          if (e.new_value === 'error') {
            return false;
          }
          onUpdateData(e.updated_src);
        })
      }
      onAdd={
        editingEnabled &&
        (e => {
          if (e.new_value === 'error') {
            return false;
          }
          onUpdateData(e.updated_src);
        })
      }
    />
  );
}

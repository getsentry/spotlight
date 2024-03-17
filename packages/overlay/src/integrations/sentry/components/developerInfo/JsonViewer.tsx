import { Envelope, EnvelopeItem } from '@sentry/types';
import ReactJson from 'react-json-view';
import { RawEventContext } from '~/integrations/integration';

export default function JsonViewer({
  data,
  onUpdateData = () => {},
  editingEnabled = false,
  clipboardEnabled = false,
}: {
  data: Envelope[0] | EnvelopeItem | RawEventContext;
  onUpdateData?: (value: unknown) => void;
  editingEnabled?: boolean;
  clipboardEnabled?: boolean;
}) {
  return (
    <ReactJson
      theme="bright"
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
  );
}

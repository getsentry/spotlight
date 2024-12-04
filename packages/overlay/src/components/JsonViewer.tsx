import ReactJson from '@microlink/react-json-view';

// Need this separately to fix Storybook 8 bundling
// See #419 and #420 for more context
const noop = () => {};

function shouldCollapse({ src, type }: { src: Array<unknown> | object; type: string }) {
  if (type === 'object') return Object.keys(src).length > 10;
  if (type === 'array') return (src as Array<unknown>).length > 10;
  return false;
}

export default function JsonViewer({
  data,
  onUpdateData = noop,
  editingEnabled = false,
  clipboardEnabled = true,
  displayDataTypes = false,
  quotesOnKeys = false,
  name = null,
  collapseStringsAfterLength = 80,
}: {
  data: object;
  onUpdateData?: (value: unknown) => void;
  editingEnabled?: boolean;
  clipboardEnabled?: boolean;
  displayDataTypes?: boolean;
  quotesOnKeys?: boolean;
  name?: string | null | false;
  collapseStringsAfterLength?: number;
}) {
  return (
    <ReactJson
      theme="bright"
      displayDataTypes={displayDataTypes}
      quotesOnKeys={quotesOnKeys}
      shouldCollapse={shouldCollapse}
      collapseStringsAfterLength={collapseStringsAfterLength}
      name={name}
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

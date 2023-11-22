import { ReactComponent as Logo } from '~/assets/glyph.svg';
import classNames from '../lib/classNames';
import { TriggerButtonCount } from '../types';

export type Anchor = 'bottomRight' | 'bottomLeft';

function getAnchorClasses(anchor: Anchor) {
  switch (anchor) {
    case 'bottomLeft':
      return 'bottom-4 left-4';
    case 'bottomRight':
    default:
      return 'bottom-4 right-4';
  }
}

export default function Trigger({
  isOpen,
  setOpen,
  count,
  anchor = 'bottomRight',
}: {
  isOpen: boolean;
  setOpen: (value: boolean) => void;
  count: TriggerButtonCount;
  anchor?: Anchor;
}) {
  const countSum = count.general + count.severe;

  return (
    <div
      className={classNames(
        'z-[999999]',
        'fixed inline-flex items-center justify-center gap-x-2 rounded border px-3 py-2 font-medium opacity-80 hover:opacity-100',
        'font-raleway cursor-pointer border-indigo-950 bg-indigo-900 font-light uppercase tracking-widest text-white',
        getAnchorClasses(anchor),
        count.severe === 0 ? 'bg-indigo-300 text-indigo-600' : 'bg-red-500 text-white',
      )}
      style={{
        display: isOpen ? 'none' : undefined,
      }}
      onClick={() => setOpen(!isOpen)}
    >
      <Logo height={24} width={24} />
      <span className="font-sans font-medium">{countSum}</span>
    </div>
  );
}

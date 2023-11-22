import { ReactComponent as Logo } from '~/assets/glyph.svg';
import classNames from '~/lib/classNames';
import { TriggerButtonCount } from '~/types';

export default function Trigger({
  isOpen,
  setOpen,
  count,
}: {
  isOpen: boolean;
  setOpen: (value: boolean) => void;
  count: TriggerButtonCount;
}) {
  const countSum = count.general + count.severe;

  return (
    <div
      className={classNames(
        'sentry-trigger',
        count.severe === 0 ? 'bg-indigo-300 text-indigo-600' : 'bg-red-500 text-white',
      )}
      style={{
        display: isOpen ? 'none' : undefined,
      }}
      onClick={() => setOpen(!isOpen)}
    >
      <Logo height={24} width={24} />
      <span>{countSum}</span>
    </div>
  );
}

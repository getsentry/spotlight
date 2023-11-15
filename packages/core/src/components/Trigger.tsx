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
      className="sentry-trigger"
      style={{
        display: isOpen ? 'none' : undefined,
      }}
      onClick={() => setOpen(!isOpen)}
    >
      Spotlight
      <span className={count.severe === 0 ? 'bg-indigo-300 text-indigo-600' : 'bg-red-500 text-white'}>{countSum}</span>
    </div>
  );
}

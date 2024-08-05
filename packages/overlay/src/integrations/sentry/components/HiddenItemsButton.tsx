import type { ComponentProps } from 'react';

export default function HiddenItemsButton({
  itemCount,
  ...props
}: Omit<ComponentProps<'button'>, 'className' | 'children'> & {
  itemCount: number;
}) {
  return (
    <button
      className="bg-primary-900 hover:bg-primary-800 text-primary-200 flex w-full cursor-pointer items-center gap-x-4 px-6 py-2 text-sm"
      {...props}
    >
      <strong>
        {itemCount.toLocaleString()} {itemCount !== 1 ? 'items were' : 'item was'} hidden from different sessions.
      </strong>
      <a className="hover:bg-primary-900 border-primary-500 rounded border px-1.5 py-0.5">Reveal</a>
    </button>
  );
}

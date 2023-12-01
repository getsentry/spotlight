import { ComponentPropsWithoutRef } from 'react';
import { ReactComponent as Logo } from '~/assets/glyph.svg';
import classNames from '../lib/classNames';
import { NotificationCount } from '../types';

export const DEFAULT_ANCHOR = 'bottomRight';

export type Anchor = 'bottomRight' | 'bottomLeft' | 'centerRight' | 'centerLeft' | 'topLeft' | 'topRight';

function getAnchorClasses(anchor: Anchor) {
  switch (anchor) {
    case 'centerRight':
      return 'bottom-[45%] right-4';
    case 'centerLeft':
      return 'bottom-[45%] left-4';
    case 'topLeft':
      return 'top-4 left-4';
    case 'topRight':
      return 'top-4 right-4';
    case 'bottomLeft':
      return 'bottom-4 left-4';
    case 'bottomRight':
    default:
      return 'bottom-4 right-4';
  }
}

function ToolbarItem({
  count,
  children,
  severe = false,
  ...props
}: Omit<ComponentPropsWithoutRef<'div'>, 'className'> & {
  severe?: boolean;
  count?: number | null;
}) {
  return (
    <div className="gap-x hover:bg-primary-400 relative flex items-center rounded p-3" {...props}>
      {children}

      {!!count && (
        <span
          className={classNames(
            severe ? 'bg-red-500' : 'bg-primary-500',
            'absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full font-sans text-[0.65rem] font-medium',
          )}
        >
          {count}
        </span>
      )}
    </div>
  );
}

export default function Trigger({
  isOpen,
  setOpen,
  notificationCount,
  anchor = DEFAULT_ANCHOR,
}: {
  isOpen: boolean;
  setOpen: (value: boolean) => void;
  notificationCount: NotificationCount;
  anchor?: Anchor;
}) {
  const countSum = notificationCount.count;
  const iconSize = 24;

  return (
    <div
      className={classNames(
        'z-[999999]',
        'fixed inline-flex items-center rounded font-medium',
        'font-raleway bg-primary-700 cursor-pointer text-white',
        'flex-col',
        getAnchorClasses(anchor),
        isOpen ? '!hidden' : '',
      )}
      title="Spotlight by Sentry"
      onClick={() => setOpen(!isOpen)}
    >
      <ToolbarItem count={countSum} severe={Boolean(notificationCount.severe)}>
        <Logo height={iconSize} width={iconSize} />
      </ToolbarItem>
    </div>
  );
}

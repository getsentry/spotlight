import type { ComponentPropsWithoutRef } from 'react';

export default function CardList(props: Omit<ComponentPropsWithoutRef<'div'>, 'className'>) {
  return (
    <div
      className="divide-primary-900 border-primary-900 bg-primary-950 flex min-h-0 flex-1 flex-col divide-y overflow-y-auto border-y"
      {...props}
    />
  );
}

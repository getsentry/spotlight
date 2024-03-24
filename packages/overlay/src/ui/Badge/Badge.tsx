import { type ComponentProps } from 'react';

export default function Badge(props: Omit<ComponentProps<'span'>, 'className'>) {
  return (
    <span className="bg-primary-800 inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium" {...props} />
  );
}

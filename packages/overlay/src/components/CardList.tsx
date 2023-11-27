import { ComponentPropsWithoutRef } from 'react';

export default function CardList(props: Omit<ComponentPropsWithoutRef<'div'>, 'className'>) {
  return <div className="divide-y divide-indigo-900 border-y border-indigo-900 bg-indigo-950" {...props} />;
}

import { ComponentPropsWithoutRef } from 'react';

export default function CardList(props: Omit<ComponentPropsWithoutRef<'div'>, 'className'>) {
  return <div className="divide-primary-900 border-primary-900 bg-primary-950 divide-y border-y" {...props} />;
}

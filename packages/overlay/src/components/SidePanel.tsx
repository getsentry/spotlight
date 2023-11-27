import { ComponentPropsWithoutRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function SidePanelHeader({
  title,
  subtitle,
  backTo,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  backTo: string;
}) {
  return (
    <div className="mb-4 flex border-b border-b-indigo-400 pb-4">
      <div className="flex-1">
        <h2 className="text-xl text-indigo-300">{title}</h2>
        {subtitle && <h3 className="font-mono">{subtitle}</h3>}
      </div>
      <Link
        className="-my-1 flex cursor-pointer items-center justify-center rounded px-6 py-1 font-mono text-2xl hover:bg-indigo-900"
        to={backTo}
      >
        {'✕'}
      </Link>
    </div>
  );
}

export default function SidePanel(props: Omit<ComponentPropsWithoutRef<'div'>, 'className'>) {
  return (
    <div
      className="fixed bottom-0 left-1/4 right-0 top-0 h-full overflow-auto border-l border-l-indigo-400 bg-gradient-to-br from-indigo-900 to-indigo-950 to-20% px-6 py-4"
      {...props}
    />
  );
}

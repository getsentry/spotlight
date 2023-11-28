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
    <div className="border-b-primary-400 mb-4 flex border-b pb-4">
      <div className="flex-1">
        <h2 className="text-primary-300 text-xl">{title}</h2>
        {subtitle && <h3 className="font-mono">{subtitle}</h3>}
      </div>
      <Link
        className="hover:bg-primary-900 -my-1 flex cursor-pointer items-center justify-center rounded px-6 py-1 font-mono text-2xl"
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
      className="border-l-primary-400 from-primary-900 to-primary-950 fixed bottom-0 left-1/4 right-0 top-0 h-full overflow-auto border-l bg-gradient-to-br to-20% px-6 py-4"
      {...props}
    />
  );
}

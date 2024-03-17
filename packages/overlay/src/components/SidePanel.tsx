import { type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SidePanelProps } from '~/types';

export function SidePanelHeader({
  title,
  subtitle,
  backto,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  backto: string;
}) {
  return (
    <div className="border-b-primary-400 mb-4 flex border-b pb-4">
      <div className="flex-1">
        <h2 className="text-primary-300 text-xl">{title}</h2>
        {subtitle && <h3 className="font-mono">{subtitle}</h3>}
      </div>
      <Link
        className="hover:bg-primary-900 -my-1 flex cursor-pointer items-center justify-center rounded px-6 py-1 font-mono text-2xl"
        to={backto}
      >
        {'✕'}
      </Link>
    </div>
  );
}

export default function SidePanel(props: SidePanelProps) {
  const navigateTo = useNavigate();
  return (
    <div
      className="fixed bottom-0 left-0 right-0 top-0 z-10 bg-black  bg-opacity-30"
      onClick={() => navigateTo(props.backto)}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="spotlight-sidepanel border-l-primary-400 from-primary-900 to-primary-950 fixed bottom-0 left-1/4 right-0 top-0 z-20 flex h-full flex-col overflow-auto border-l bg-gradient-to-br to-20% px-6 py-4"
        {...props}
      />
    </div>
  );
}

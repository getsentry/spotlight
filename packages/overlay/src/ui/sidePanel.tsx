import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export type SidePanelProps = Omit<ComponentPropsWithoutRef<"div">, "className"> & {
  backto: string;
};

// This trick is taken from:
// https://github.com/remix-run/react-router/discussions/9922#discussioncomment-4722716
export function useGoBackWithFallback(fallback: string) {
  const navigateTo = useNavigate();
  const loc = useLocation();
  return () => (loc.key === "default" ? navigateTo(fallback, { replace: true }) : navigateTo(-1));
}

export function SidePanelHeader({
  title,
  subtitle,
  backto,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  backto: string;
}) {
  const goBackWithFallback = useGoBackWithFallback(backto);

  return (
    <div className="border-b-primary-400 mb-4 flex border-b pb-4">
      <div className="flex-1 overflow-hidden">
        <h2 className="text-primary-300 text-xl">{title}</h2>
        {subtitle && <h3 className="font-mono">{subtitle}</h3>}
      </div>
      <button
        type="button"
        className="hover:bg-primary-900 -my-1 flex cursor-pointer items-center justify-center rounded px-6 py-1 font-mono text-2xl"
        onClick={goBackWithFallback}
      >
        {"✕"}
      </button>
    </div>
  );
}

export default function SidePanel(props: SidePanelProps) {
  const goBackWithFallback = useGoBackWithFallback(props.backto);
  return (
    <div className="fixed bottom-0 left-0 right-0 top-0 z-10 bg-black bg-opacity-30" onClick={goBackWithFallback}>
      <div
        onClick={e => e.stopPropagation()}
        className="spotlight-sidepanel border-l-primary-400 from-primary-900 to-primary-950 fixed bottom-0 left-1/4 right-0 top-0 z-20 flex h-full flex-col overflow-auto border-l bg-gradient-to-br to-20% px-6 py-4"
        {...props}
      />
    </div>
  );
}

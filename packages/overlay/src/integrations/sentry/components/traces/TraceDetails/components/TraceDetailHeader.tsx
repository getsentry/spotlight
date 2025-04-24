import useSentryStore from '~/integrations/sentry/data/sentryStore';
import type { Trace } from '../../../../types';
import TraceIcon from '../../TraceIcon';
import { TraceRootTxnName } from './TraceRootTxnName';

type TraceDetailHeaderProps = {
  trace: Trace;
};

export default function TraceDetailHeader({ trace }: TraceDetailHeaderProps) {
  return (
    <div className="border-b-primary-700 bg-primary-950 flex items-center gap-x-2 border-b px-6 py-4">
      <TraceIcon trace={trace} />
      <h1 className="flex w-full flex-1 items-center truncate text-2xl">
        Trace:&nbsp;&nbsp;
        <TraceRootTxnName trace={trace} flowing />
      </h1>
    </div>
  );
}

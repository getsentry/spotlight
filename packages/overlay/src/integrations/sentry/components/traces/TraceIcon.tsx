import { Trace } from '../../types';
import { sdkToPlatform } from '../../utils/sdkToPlatform';
import PlatformIcon from '../PlatformIcon';

export type TraceIconProps = {
  trace: Trace;
};

function getPlatformsFromTrace(trace: Trace) {
  return [...new Set(trace.transactions.map(transaction => sdkToPlatform(transaction.sdk?.name || 'unknown')))];
}

export default function TraceIcon({ trace }: TraceIconProps) {
  const platformsInTrace = getPlatformsFromTrace(trace);
  if (platformsInTrace.length === 0) {
    return <PlatformIcon className="rounded-md" platform={'unknown'} />;
  }
  if (platformsInTrace.length === 1) {
    return <PlatformIcon className="rounded-md" platform={platformsInTrace[0]} />;
  } else {
    return (
      <div className="bg-primary-900 flex h-[42px] w-[42px] flex-wrap items-center justify-center overflow-hidden rounded-md">
        {platformsInTrace
          .slice(0, 4)
          .map((_platform, ind) =>
            ind < 3 ? (
              <PlatformIcon key={_platform} title={_platform} size={21} platform={_platform} />
            ) : (
              <div
                key={(platformsInTrace.slice(3) || []).join(', ')}
                title={(platformsInTrace.slice(3) || []).join(', ')}
                className="h-[21px] w-[21px] bg-black p-0.5 text-xs font-bold text-white"
              >{`+${platformsInTrace.length - 3}`}</div>
            ),
          )}
      </div>
    );
  }
}

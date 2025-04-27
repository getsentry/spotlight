import type { Trace } from '../../types';
import { sdkToPlatform } from '../../utils/sdkToPlatform';
import PlatformIcon from '../shared/PlatformIcon';

export type TraceIconProps = {
  trace: Trace;
};

const getPlatformsFromTrace = (trace: Trace) => {
  const transactions = trace.transactions || [];

  const platformCounts = transactions.reduce((platformMap, transaction) => {
    const sdkName = transaction.sdk?.name || 'unknown';
    const platform = sdkToPlatform(sdkName);
    const currentCount = platformMap.get(platform) || 0;
    platformMap.set(platform, currentCount + 1);
    return platformMap;
  }, new Map());

  return Array.from(platformCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([platform]) => platform);
};

export default function TraceIcon({ trace }: TraceIconProps) {
  const platformsInTrace = getPlatformsFromTrace(trace);
  if (platformsInTrace.length === 0) {
    return <PlatformIcon className="rounded-md" platform={'unknown'} />;
  }
  if (platformsInTrace.length === 1) {
    return <PlatformIcon className="rounded-md" platform={platformsInTrace[0]} />;
  }

  const dominantPlatforms = platformsInTrace.slice(0, 3);
  const remainingPlatforms = platformsInTrace.slice(3);
  return (
    <div className="bg-primary-900 flex h-[42px] w-[42px] flex-wrap items-center justify-center overflow-hidden rounded-md">
      {dominantPlatforms.map(platform => (
        <PlatformIcon key={platform} title={platform} size={21} platform={platform} />
      ))}
      {remainingPlatforms.length > 0 && (
        <div
          title={remainingPlatforms.join(', ')}
          className="h-[21px] w-[21px] bg-black p-0.5 text-xs font-bold text-white"
        >{`+${remainingPlatforms.length}`}</div>
      )}
    </div>
  );
}

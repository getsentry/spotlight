import { type Trace, sdkToPlatform } from "@spotlightjs/core/sentry";
import PlatformIcon from "../shared/PlatformIcon";

export type TraceIconProps = {
  trace: Trace;
};

function getPlatformsFromTrace(trace: Trace) {
  return [...new Set((trace.transactions || []).map(transaction => sdkToPlatform(transaction.sdk?.name || "unknown")))];
}

export default function TraceIcon({ trace }: TraceIconProps) {
  const platformsInTrace = getPlatformsFromTrace(trace);
  if (platformsInTrace.length === 0) {
    return <PlatformIcon className="rounded-md" platform={"unknown"} />;
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
          title={remainingPlatforms.join(", ")}
          className="h-[21px] w-[21px] bg-black p-0.5 text-xs font-bold text-white"
        >{`+${remainingPlatforms.length}`}</div>
      )}
    </div>
  );
}

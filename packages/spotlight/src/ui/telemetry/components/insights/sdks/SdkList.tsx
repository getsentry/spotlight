import CardList from "@spotlight/ui/telemetry/components/shared/CardList";
import TimeSince from "@spotlight/ui/telemetry/components/shared/TimeSince";
import { useSentrySdks } from "@spotlight/ui/telemetry/data/useSentrySdks";
import { sdkToPlatform } from "@spotlight/ui/telemetry/utils/sdkToPlatform";
import EmptyState from "../../shared/EmptyState";
import PlatformIcon from "../../shared/PlatformIcon";

export default function SdkList() {
  const sdkList = useSentrySdks();

  return (
    <>
      {sdkList.length !== 0 ? (
        <CardList>
          {sdkList.map(sdk => (
            <div className="flex items-center gap-x-4 px-6 py-2" key={`${sdk.name}-${sdk.version}`}>
              <PlatformIcon className="rounded-md" platform={sdkToPlatform(sdk.name)} />

              <div className="text-primary-300 flex flex-col truncate font-mono text-sm">
                <div>{sdk.name}</div>
                <div>{sdk.version}</div>
                <TimeSince date={sdk.lastSeen} />
              </div>
            </div>
          ))}
        </CardList>
      ) : (
        <EmptyState
          variant="full"
          className="h-full"
          title="No SDKs"
          description="No SDKs detected yet. Once Sentry sends data, we'll show what's running."
          showDocsLink
        />
      )}
    </>
  );
}

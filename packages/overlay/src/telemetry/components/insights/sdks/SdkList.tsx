import CardList from "~/telemetry/components/shared/CardList";
import TimeSince from "~/telemetry/components/shared/TimeSince";
import { useSentrySdks } from "~/telemetry/data/useSentrySdks";
import { sdkToPlatform } from "~/telemetry/utils/sdkToPlatform";
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
        <div className="text-primary-300 px-6 py-4">Looks like there's no SDKs that have reported yet. 🤔</div>
      )}
    </>
  );
}

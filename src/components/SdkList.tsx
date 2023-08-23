import TimeSince from "./TimeSince";
import PlatformIcon from "./PlatformIcon";
import { useSentrySdks } from "~/lib/useSentrySdks";

function sdkToPlatform(name: string) {
  if (name.indexOf("sentry.javascript") === 0) return "javascript";
  return "unknown";
}

export default function SdkList() {
  const sdkList = useSentrySdks();

  return (
    <>
      <div className="divide-y divide-indigo-500 bg-indigo-950">
        {sdkList.length !== 0 ? (
          sdkList.map((sdk) => {
            return (
              <div
                className="px-6 py-4 flex gap-x-4 items-center cursor-pointer"
                key={`${sdk.name}-${sdk.version}`}
              >
                <PlatformIcon platform={sdkToPlatform(sdk.name)} />

                <div className="font-mono text-indigo-300 flex flex-col truncate">
                  <div>{sdk.name}</div>
                  <div>{sdk.version}</div>
                  <TimeSince date={sdk.lastSeen} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-6 text-indigo-300">
            Looks like there's no SDKs tha thave reported yet. 🤔
          </div>
        )}
      </div>
    </>
  );
}

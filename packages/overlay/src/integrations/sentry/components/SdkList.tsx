import CardList from '~/components/CardList';
import TimeSince from '../../../components/TimeSince';
import { useSentrySdks } from '../data/useSentrySdks';
import { sdkToPlatform } from '../utils/sdkToPlatform';
import PlatformIcon from './PlatformIcon';

export default function SdkList() {
  const sdkList = useSentrySdks();

  return (
    <>
      {sdkList.length !== 0 ? (
        <CardList>
          {sdkList.map(sdk => {
            return (
              <div className="flex items-center gap-x-4 px-6 py-2" key={`${sdk.name}-${sdk.version}`}>
                <PlatformIcon className="rounded-md" platform={sdkToPlatform(sdk.name)} />

                <div className="text-primary-300 flex flex-col truncate font-mono text-sm">
                  <div>{sdk.name}</div>
                  <div>{sdk.version}</div>
                  <TimeSince date={sdk.lastSeen} />
                </div>
              </div>
            );
          })}
        </CardList>
      ) : (
        <div className="text-primary-300 p-6">Looks like there's no SDKs that have reported yet. 🤔</div>
      )}
    </>
  );
}

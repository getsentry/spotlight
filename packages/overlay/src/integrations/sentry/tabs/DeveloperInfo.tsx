import ReactJson from 'react-json-view';
import sentryDataCache from '../data/sentryDataCache';

export default function DeveloperInfo() {
  const envelopes = sentryDataCache.getEnvelopes();
  console.log({ envelopes });

  return envelopes.map(envelope => <ReactJson src={envelope} theme="monokai" />);
}

export type TagProps = { tagKey: string; value: string };

export default function Tag({ tagKey, value }: TagProps) {
  return (
    <div className="border-primary-300 bg-primary-900 divide-x-primary-300 inline-flex divide-x whitespace-nowrap rounded-full border font-mono text-sm">
      <div className="px-2 py-1 font-semibold">{tagKey}</div>
      <div className="bg-primary-800 rounded-r-full px-2 py-1">{value}</div>
    </div>
  );
}

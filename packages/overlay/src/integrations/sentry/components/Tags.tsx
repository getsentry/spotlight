export default function Tags({ tags }: { tags: { [key: string]: string } }) {
  return (
    <div className="flex flex-row flex-wrap gap-2 pt-2">
      {Object.keys(tags).map(tagKey => {
        return <Tag key={tagKey} tagKey={tagKey} value={tags[tagKey]}></Tag>;
      })}
    </div>
  );
}

function Tag({ tagKey, value }: { tagKey: string; value: string }) {
  return (
    <div className="border-primary-300 bg-primary-900 divide-x-primary-300 inline-flex divide-x whitespace-nowrap rounded-full border font-mono text-sm">
      <div className="px-2 py-1 font-semibold">{tagKey}</div>
      <div className="bg-primary-800 rounded-r-full px-2 py-1">{value}</div>
    </div>
  );
}

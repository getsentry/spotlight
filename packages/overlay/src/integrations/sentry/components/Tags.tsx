export default function Tags({ tags }: { tags: { [key: string]: string } }) {
  return (
    <div className="flex flex-row flex-wrap gap-2">
      {Object.keys(tags).map(tagKey => {
        return <Tag key={tagKey} tagKey={tagKey} value={tags[tagKey]}></Tag>;
      })}
    </div>
  );
}

function Tag({ tagKey, value }: { tagKey: string; value: string }) {
  return (
    <div className="mt-2 whitespace-nowrap text-sm">
      <span className="bg-primary-900 border-primary-300 h-[30px] rounded-l-full border-[1px] p-1 pl-2 font-semibold ">
        {tagKey}
      </span>
      <span className=" border-primary-300 h-[30px] rounded-r-full border-[1px] border-l-0 p-1 pr-2 align-bottom font-mono">
        {value}
      </span>
    </div>
  );
}

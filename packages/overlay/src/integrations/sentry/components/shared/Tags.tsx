import Tag from '~/ui/Tag';

export default function Tags({ tags }: { tags: { [key: string]: string } }) {
  return (
    <div className="flex flex-row flex-wrap gap-2 pt-2">
      {Object.keys(tags).map(tagKey => (
        <Tag key={tagKey} tagKey={tagKey} value={tags[tagKey]} />
      ))}
    </div>
  );
}

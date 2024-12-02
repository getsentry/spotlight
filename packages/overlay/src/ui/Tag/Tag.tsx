import classNames from '~/lib/classNames';

export type TagProps = { tagKey: string; value: string };

export default function Tag({ tagKey, value }: TagProps) {
  return (
    <div className="border-primary-300 bg-primary-900 divide-x-primary-300 inline-flex divide-x whitespace-nowrap rounded-full border font-mono text-sm">
      {tagKey ? <div className="px-2 py-1 font-semibold">{tagKey}</div> : null}
      <div className={classNames('bg-primary-800', 'px-2', 'py-1', tagKey ? 'rounded-r-full' : 'rounded-full')}>
        {value}
      </div>
    </div>
  );
}

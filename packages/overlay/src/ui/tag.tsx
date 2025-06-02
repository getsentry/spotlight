import classNames from "~/lib/classNames";

export type TagProps = {
  tagKey?: string;
  value: string;
  flowing?: boolean;
  maxWidth?: string;
};

export default function Tag({ tagKey, value, flowing = false, maxWidth = "400px" }: TagProps) {
  if (!value) return null;

  return (
    <div
      className={classNames(
        "border-primary-300 bg-primary-900 divide-x-primary-300 inline-flex divide-x overflow-hidden whitespace-nowrap rounded-full border font-mono text-sm",
        flowing && "max-w-full",
      )}
    >
      {tagKey && <div className="px-2 py-1 font-semibold">{tagKey}</div>}
      <div
        title={value}
        className={classNames("bg-primary-800 truncate px-2 py-1", flowing ? "max-w-full" : "max-w-none")}
        style={{ maxWidth: flowing ? "100%" : maxWidth }}
      >
        {value}
      </div>
    </div>
  );
}

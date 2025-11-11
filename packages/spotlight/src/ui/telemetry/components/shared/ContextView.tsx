import JsonViewer from "@spotlight/ui/telemetry/components/shared/JsonViewer";
import type { Tags as TagsType } from "@spotlight/ui/telemetry/types";
import Tags from "./Tags";

export function ContextView({
  context,
  tags,
}: { context: [string, Record<string, unknown>][]; tags?: TagsType | null }) {
  return (
    <div className="space-y-4 px-6 py-4">
      {tags && (
        <div className="pb-4">
          <h2 className="font-bold uppercase">Tags</h2>
          <Tags tags={tags} />
        </div>
      )}
      <div className="space-y-6">
        {context.map(([ctxKey, ctxValues]) => (
          <div key={ctxKey}>
            <h2 className="font-bold uppercase">{ctxKey}</h2>
            <JsonViewer data={ctxValues} />
          </div>
        ))}
      </div>
    </div>
  );
}

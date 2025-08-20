import type { Trace } from "@spotlightjs/core/sentry";
import { getRootTransactionMethod, getRootTransactionName } from "~/integrations/sentry/utils/traces";
import Tag from "~/ui/tag";

export function TraceRootTxnName({ trace, flowing = false }: { trace: Trace; flowing?: boolean }) {
  const method = getRootTransactionMethod(trace);
  const name = getRootTransactionName(trace);
  return <Tag tagKey={method} value={name} flowing={flowing} />;
}

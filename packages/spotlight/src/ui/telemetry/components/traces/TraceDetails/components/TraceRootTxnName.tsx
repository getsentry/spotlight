import type { Trace } from "~/telemetry/types";
import { getRootTransactionMethod, getRootTransactionName } from "~/telemetry/utils/traces";
import Tag from "~/ui/tag";

export function TraceRootTxnName({ trace, flowing = false }: { trace: Trace; flowing?: boolean }) {
  const method = getRootTransactionMethod(trace);
  const name = getRootTransactionName(trace);
  return <Tag tagKey={method} value={name} flowing={flowing} />;
}

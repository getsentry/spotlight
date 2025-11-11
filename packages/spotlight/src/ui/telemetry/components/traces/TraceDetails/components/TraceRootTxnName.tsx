import type { Trace } from "@spotlight/ui/telemetry/types";
import { getRootTransactionMethod, getRootTransactionName } from "@spotlight/ui/telemetry/utils/traces";
import Tag from "@spotlight/ui/ui/tag";

export function TraceRootTxnName({ trace, flowing = false }: { trace: Trace; flowing?: boolean }) {
  const method = getRootTransactionMethod(trace);
  const name = getRootTransactionName(trace);
  return <Tag tagKey={method} value={name} flowing={flowing} />;
}

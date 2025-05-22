import type { Trace } from '~/integrations/sentry/types';
import Tag from '~/ui/tag';

export function TraceRootTxnName({ trace, flowing = false }: { trace: Trace; flowing?: boolean }) {
  const method = String(
    trace.rootTransaction?.contexts?.trace.data?.method || trace.rootTransaction?.request?.method || '',
  );
  const name =
    method && trace.rootTransactionName.startsWith(method)
      ? trace.rootTransactionName.slice(method.length + 1)
      : trace.rootTransactionName;
  return <Tag tagKey={method} value={name} flowing={flowing} />;
}

import type { ConsoleMessage } from './types';

type Props = {
  processedEvents?: ConsoleMessage[];
};
export default function ConsoleTab({ processedEvents }: Props) {
  const messages = (processedEvents || []) as ConsoleMessage[];

  return (
    <div className="divide-primary-900 bg-primary-950 divide-y p-4">
      <h1 className="mb-2 text-xl">Console Logs</h1>
      <div className="flex flex-col gap-2">
        {messages.map(message => (
          <div key={message.msg} className="bg-primary-500 py-4 pl-4">
            <span className="bg-primary-600 p-2 font-bold">{message.type.toUpperCase()}</span>
            <span className="ml-4 font-mono">{message.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { ConsoleMessage } from './types';

type Props = {
  processedEvents?: ConsoleMessage[];
};
export default function ConsoleTab({ processedEvents }: Props) {
  const messages = (processedEvents || []) as ConsoleMessage[];

  return (
    <div className="divide-y divide-indigo-900 bg-indigo-950 p-4">
      <h1 className="mb-2 text-xl">Console Logs</h1>
      <div className="flex flex-col gap-2">
        {messages.map((message, index) => {
          return (
            <div key={index} className="bg-indigo-500 py-4 pl-4">
              <span className="bg-indigo-600 p-2 font-bold">{message.type.toUpperCase()}</span>
              <span className="ml-4 font-mono">{message.msg}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

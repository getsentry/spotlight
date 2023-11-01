import { ConsoleMessage } from './types';

type Props = {
  consoleMessages?: ConsoleMessage[];
  integrationData: Record<string, Array<ConsoleMessage>>;
};
export default function ConsoleTab({ integrationData }: Props) {
  const messages = (integrationData['application/x-spotlight-console'] || []) as ConsoleMessage[];

  return (
    <div className="divide-y divide-indigo-500 bg-indigo-950 p-4">
      <h1 className="text-xl mb-2">Console Logs</h1>
      <div className="flex flex-col gap-2">
        {messages.map((message, index) => {
          return (
            <div key={index} className="py-4 bg-indigo-500 pl-4">
              <span className="bg-indigo-600 font-bold p-2">{message.type.toUpperCase()}</span>
              <span className="font-mono ml-4">{message.msg}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

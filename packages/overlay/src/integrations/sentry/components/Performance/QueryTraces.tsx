import { Link, useParams } from 'react-router-dom';
import { useSentrySpans } from '../../data/useSentrySpans';
import { Span } from '../../types';
import { getFormattedDuration } from '../../utils/duration';

const getDBSpans = (spans: Span[], options: { type?: string; regex?: RegExp }) => {
  if (options.type) {
    return spans.filter((span: Span) => span.description === options.type);
  }
  if (options.regex) {
    const regex = new RegExp(options.regex);
    return spans.filter((span: Span) => regex.test(span.op || ''));
  }
  return [];
};

const QueryTraces = ({ showAll }: { showAll: boolean }) => {
  const [allSpans, localSpans] = useSentrySpans();
  const { type } = useParams();

  const onlyDBSpans = getDBSpans(showAll ? allSpans : localSpans, { type });

  if (onlyDBSpans) {
    return (
      <table className="divide-primary-700 min-w-full divide-y">
        <thead className="bg-primary-900">
          <tr>
            <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold">
              Trace Id
            </th>
            <th scope="col" className="px-4 py-3.5 text-right text-sm font-semibold">
              Span Id
            </th>
            <th scope="col" className="px-4 py-3.5 text-right text-sm font-semibold">
              Total Time
            </th>
          </tr>
        </thead>
        <tbody className="bg-primary-900 bg-opacity-50">
          {onlyDBSpans.map(span => (
            <tr key={span.span_id} className="hover:bg-primary-900">
              <td className="whitespace-nowrap px-4 py-4 text-left text-sm font-medium text-gray-200">
                <Link className="hover:underline" to={`/traces/${span.trace_id}`}>
                  {span.trace_id}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium text-gray-200">
                <Link className="hover:underline" to={`/traces/${span.trace_id}/${span.span_id}`}>
                  {span.span_id}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium text-gray-200">
                {getFormattedDuration(span.timestamp - span.start_timestamp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
};

export default QueryTraces;

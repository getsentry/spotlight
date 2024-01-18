import { Link, useParams } from 'react-router-dom';
import Breadcrumbs from '~/components/Breadcrumbs';
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
      <>
        <Breadcrumbs
          crumbs={[
            {
              id: 'queries',
              label: 'Queries',
              link: true,
              to: '/performance/queries',
            },
            ...(type
              ? [
                  {
                    id: type,
                    label: type,
                    link: false,
                  },
                ]
              : []),
          ]}
        />
        <table className="divide-primary-700 min-w-full divide-y">
          <thead>
            <tr>
              <th scope="col" className="text-primary-100 px-6 py-3.5 text-left text-sm font-semibold">
                Trace Id
              </th>
              <th scope="col" className="text-primary-100 px-6 py-3.5 text-right text-sm font-semibold">
                Span Id
              </th>
              <th scope="col" className="text-primary-100 px-6 py-3.5 text-right text-sm font-semibold">
                Total Time
              </th>
            </tr>
          </thead>
          <tbody>
            {onlyDBSpans.map(span => (
              <tr key={span.span_id} className="hover:bg-primary-900">
                <td className="text-primary-200 whitespace-nowrap px-6 py-4 text-left text-sm font-medium">
                  <Link className="truncate hover:underline" to={`/traces/${span.trace_id}`}>
                    {span.trace_id}
                  </Link>
                </td>
                <td className="text-primary-200 whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <Link className="truncate hover:underline" to={`/traces/${span.trace_id}/${span.span_id}`}>
                    {span.span_id}
                  </Link>
                </td>
                <td className="text-primary-200 whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  {getFormattedDuration(span.timestamp - span.start_timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }
};

export default QueryTraces;

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ReactComponent as Sort } from '~/assets/sort.svg';
import { ReactComponent as SortDown } from '~/assets/sortDown.svg';
import classNames from '~/lib/classNames';
import Breadcrumbs from '~/ui/Breadcrumbs';
import { TRANSACTION_SUMMARY_SORT_KEYS, TRANSACTION_SUMMARY_TABLE_HEADERS } from '../../constants';
import { useSentryEvents } from '../../data/useSentryEvents';
import { useSentryHelpers } from '../../data/useSentryHelpers';

export default function TransactionDetail({ showAll }: { showAll: boolean }) {
  const { name } = useParams();

  const events = useSentryEvents();
  const helpers = useSentryHelpers();

  const [sort, setSort] = useState({
    active: TRANSACTION_SUMMARY_SORT_KEYS.transaction,
    asc: false,
  });

  // Ref: https://developer.mozilla.org/en-US/docs/Web/API/Window/atob
  const decodedTxnName: string = atob(name!);
  const allTransactions = events.filter(e => e.type === 'transaction' && e.transaction === decodedTxnName);
  const filteredTransactions = showAll
    ? allTransactions
    : allTransactions.filter(
        e => (e.contexts?.trace?.trace_id ? helpers.isLocalToSession(e.contexts?.trace?.trace_id) : null) !== false,
      );

  const toggleSortOrder = (type: string) =>
    setSort(prev =>
      prev.active === type
        ? {
            active: type,
            asc: !prev.asc,
          }
        : {
            active: type,
            asc: false,
          },
    );

  return (
    <>
      {allTransactions.length !== 0 ? (
        <div>
          <Breadcrumbs
            crumbs={[
              {
                id: 'transactions',
                label: 'Transactions',
                link: true,
                to: '/performance/transactions',
              },
              {
                id: 'txnSummary',
                label: 'Transaction Summary',
                link: false,
              },
            ]}
          />
          <table className="divide-primary-700 w-full table-fixed divide-y">
            <thead>
              <tr>
                {TRANSACTION_SUMMARY_TABLE_HEADERS.map(header => (
                  <th
                    key={header.id}
                    scope="col"
                    className={classNames(
                      'text-primary-100 select-none px-6 py-3.5 text-sm font-semibold',
                      header.primary ? 'w-2/5' : 'w-[15%]',
                    )}
                  >
                    <div
                      className={classNames(
                        'flex cursor-pointer items-center gap-1',
                        header.primary ? 'justify-start' : 'justify-end',
                      )}
                      onClick={() => toggleSortOrder(header.sortKey)}
                    >
                      {header.title}
                      {sort.active === header.sortKey ? (
                        <SortDown
                          width={12}
                          height={12}
                          className={classNames(
                            'fill-primary-300',
                            sort.asc ? '-translate-y-0.5 rotate-0' : 'translate-y-0.5 rotate-180',
                          )}
                        />
                      ) : (
                        <Sort width={12} height={12} className="stroke-primary-300" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredTransactions.map(txn => (
                <tr key={txn.event_id} className="hover:bg-primary-900">
                  <td className="text-primary-200 w-3/5 truncate whitespace-nowrap px-6 py-4 text-left text-sm font-medium">
                    {/* Ref: https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa */}
                    <Link
                      className="truncate hover:underline"
                      to={`/explore/traces/${txn.contexts?.trace?.trace_id}/spans/${txn.contexts?.trace?.span_id}`}
                    >
                      {txn.event_id}
                    </Link>
                  </td>
                  <td className="text-primary-200 w-1/5 whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    {/* Ref: https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa */}
                    <Link className="truncate hover:underline" to={`/explore/traces/${txn.contexts?.trace?.trace_id}`}>
                      {txn.contexts?.trace?.trace_id}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-primary-300 p-6">Looks like there's no transaction recorded matching this query. 🤔</div>
      )}
    </>
  );
}

import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ReactComponent as Sort } from '~/assets/sort.svg';
import { ReactComponent as SortDown } from '~/assets/sortDown.svg';
import classNames from '~/lib/classNames';
import Breadcrumbs from '~/ui/Breadcrumbs';
import { TRANSACTION_SUMMARY_SORT_KEYS, TRANSACTION_SUMMARY_TABLE_HEADERS } from '../../constants';
import { useSentryEvents } from '../../data/useSentryEvents';
import { useSentryHelpers } from '../../data/useSentryHelpers';
import { SentryTransactionEvent } from '../../types';
import { getFormattedDuration } from '../../utils/duration';
import { truncateId } from '../../utils/misc';
import DateTime from '../DateTime';

export default function TransactionDetail({ showAll }: { showAll: boolean }) {
  const { name } = useParams();

  const events = useSentryEvents();
  const helpers = useSentryHelpers();

  const [sort, setSort] = useState({
    active: TRANSACTION_SUMMARY_SORT_KEYS.timestamp,
    asc: false,
  });

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

  type TransactionsInfoComparator = (a: SentryTransactionEvent, b: SentryTransactionEvent) => number;
  type TransactionsSortTypes = (typeof TRANSACTION_SUMMARY_SORT_KEYS)[keyof typeof TRANSACTION_SUMMARY_SORT_KEYS];

  const transactionsList: SentryTransactionEvent[] = useMemo(() => {
    if (!name) {
      return [];
    }
    const COMPARATORS: Record<TransactionsSortTypes, TransactionsInfoComparator> = {
      [TRANSACTION_SUMMARY_SORT_KEYS.timestamp]: (a, b) => a.start_timestamp - b.start_timestamp,
      [TRANSACTION_SUMMARY_SORT_KEYS.duration]: (a, b) =>
        a.timestamp + b.start_timestamp - a.start_timestamp - b.timestamp,
    };

    // Ref: https://developer.mozilla.org/en-US/docs/Web/API/Window/atob
    const decodedTxnName: string = atob(name!);
    const allTransactions: SentryTransactionEvent[] = events
      .filter(e => e.type === 'transaction')
      .filter(e => e.transaction === decodedTxnName);
    const filteredTransactions: SentryTransactionEvent[] = showAll
      ? allTransactions
      : allTransactions.filter(
          e => (e.contexts?.trace?.trace_id ? helpers.isLocalToSession(e.contexts?.trace?.trace_id) : null) !== false,
        );
    const compareTransactions = COMPARATORS[sort.active] || COMPARATORS[TRANSACTION_SUMMARY_SORT_KEYS.timestamp];

    const sortedTransactions: SentryTransactionEvent[] = filteredTransactions.sort((a, b) =>
      sort.asc ? compareTransactions(a, b) : compareTransactions(b, a),
    );
    return sortedTransactions;
  }, [sort, showAll, events, helpers, name]);

  return (
    <>
      {transactionsList.length !== 0 ? (
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

          <div className="w-11/12 px-6 py-4">
            <h1 className="truncate text-2xl font-bold">{atob(name!)}</h1>
          </div>
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
                      onClick={() => header.sortKey && toggleSortOrder(header.sortKey)}
                    >
                      {header.title}
                      {header.sortKey &&
                        (sort.active === header.sortKey ? (
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
                        ))}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {transactionsList.map(txn => (
                <tr key={txn.event_id} className="hover:bg-primary-900">
                  <td className="text-primary-200 w-2/5 truncate whitespace-nowrap px-6 py-4 text-left text-sm font-medium">
                    {/* Ref: https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa */}
                    <Link
                      className="truncate hover:underline"
                      to={`/explore/traces/${txn.contexts?.trace?.trace_id}/spans/${txn.contexts?.trace?.span_id}`}
                    >
                      {truncateId(txn.event_id)}
                    </Link>
                  </td>
                  <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    {getFormattedDuration(txn.timestamp - txn.start_timestamp)}
                  </td>

                  <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <DateTime date={txn.start_timestamp} />
                  </td>

                  <td className="text-primary-200 w-[15%] whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    {/* Ref: https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa */}
                    <Link className="truncate hover:underline" to={`/explore/traces/${txn.contexts?.trace?.trace_id}`}>
                      {truncateId(txn.contexts?.trace?.trace_id)}
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

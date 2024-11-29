import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ReactComponent as Sort } from '~/assets/sort.svg';
import { ReactComponent as SortDown } from '~/assets/sortDown.svg';
import classNames from '~/lib/classNames';
import { TRANSACTIONS_SORT_KEYS, TRANSACTIONS_TABLE_HEADERS } from '../../constants';
import { useSentryEvents } from '../../data/useSentryEvents';
import { useSentryHelpers } from '../../data/useSentryHelpers';
import { SentryTransactionEvent } from '../../types';

export default function TransactionsList({ showAll }: { showAll: boolean }) {
  const events = useSentryEvents();
  const helpers = useSentryHelpers();

  const [sort, setSort] = useState({
    active: TRANSACTIONS_SORT_KEYS.transaction,
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

  type GroupedTransactions = Record<string, SentryTransactionEvent[]>;
  type TransactionsInfoComparator = (
    a: [string, SentryTransactionEvent[]],
    b: [string, SentryTransactionEvent[]],
  ) => number;
  type TransactionsSortTypes = (typeof TRANSACTIONS_SORT_KEYS)[keyof typeof TRANSACTIONS_SORT_KEYS];

  const transactionsList: [string, SentryTransactionEvent[]][] = useMemo(() => {
    const COMPARATORS: Record<TransactionsSortTypes, TransactionsInfoComparator> = {
      [TRANSACTIONS_SORT_KEYS.transaction]: (a, b) => {
        if (a[0] < b[0]) return -1;
        if (a[0] > b[0]) return 1;
        return 0;
      },
      [TRANSACTIONS_SORT_KEYS.traces]: (a, b) => {
        if (a[1].length < b[1].length) return -1;
        if (a[1].length > b[1].length) return 1;
        return 0;
      },
    };
    const compareTransactions = COMPARATORS[sort.active] || COMPARATORS[TRANSACTIONS_SORT_KEYS.transaction];
    const allTransactions = events.filter(e => e.type === 'transaction');
    const filteredTransactions = showAll
      ? allTransactions
      : allTransactions.filter(
          e => (e.contexts?.trace?.trace_id ? helpers.isLocalToSession(e.contexts?.trace?.trace_id) : null) !== false,
        );
    const groupedTransactions: GroupedTransactions = filteredTransactions.reduce((acc, curr) => {
      if (curr.transaction) {
        if ((curr.transaction as string) in acc) {
          acc[curr.transaction].push(curr);
        } else {
          acc[curr.transaction] = [curr];
        }
      }
      return acc;
    }, {} as GroupedTransactions);
    return Object.entries(groupedTransactions).sort((a, b) =>
      sort.asc ? compareTransactions(a, b) : compareTransactions(b, a),
    );
  }, [sort, showAll, events, helpers]);

  return (
    <>
      {transactionsList.length !== 0 ? (
        <div>
          <table className="divide-primary-700 w-full table-fixed divide-y">
            <thead>
              <tr>
                {TRANSACTIONS_TABLE_HEADERS.map(header => (
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
              {transactionsList.map(([key, value]: [string, SentryTransactionEvent[]]) => (
                <tr key={key} className="hover:bg-primary-900">
                  <td className="text-primary-200 w-3/5 truncate whitespace-nowrap px-6 py-4 text-left text-sm font-medium">
                    {/* Ref: https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa */}
                    <Link className="truncate hover:underline" to={`/performance/transactions/${btoa(key)}`}>
                      {key}
                    </Link>
                  </td>
                  <td className="text-primary-200 w-1/5 whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    {value.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-primary-300 p-6">Looks like there's no transactions recorded matching this query. 🤔</div>
      )}
    </>
  );
}

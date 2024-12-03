import { useState } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useSpotlightContext } from '~/lib/useSpotlightContext';
import { useSentryEvents } from '../../data/useSentryEvents';
import { useSentryHelpers } from '../../data/useSentryHelpers';
import HiddenItemsButton from '../HiddenItemsButton';
import TransactionDetail from './TransactionDetail';
import TransactionsList from './TransactionsList';

export default function PerformanceTabDetails() {
  const events = useSentryEvents();
  const helpers = useSentryHelpers();
  const context = useSpotlightContext();

  const [showAll, setShowAll] = useState(!context.experiments['sentry:focus-local-events']);

  const allTransactions = events.filter(e => e.type === 'transaction');
  const filteredTransactions = showAll
    ? allTransactions
    : allTransactions.filter(t => {
        const traceId = t.contexts?.trace?.trace_id;
        return !traceId || helpers.isLocalToSession(traceId);
      });

  const hiddenItemCount = allTransactions.length - filteredTransactions.length;

  return (
    <div className="flex-1">
      {hiddenItemCount > 0 && (
        <HiddenItemsButton
          itemCount={hiddenItemCount}
          onClick={() => {
            setShowAll(true);
          }}
        />
      )}
      <Routes>
        <Route path="transactions" element={<TransactionsList showAll={showAll} />} />
        <Route path="transactions/:name" element={<TransactionDetail showAll={showAll} />} />
        <Route path="*" element={<Navigate to="/performance/transactions" replace />} />
      </Routes>
      <Outlet />
    </div>
  );
}

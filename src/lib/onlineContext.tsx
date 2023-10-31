import type { ReactNode } from 'react';
import React, { useEffect, useState } from 'react';
import dataCache from './dataCache';

export const OnlineContext = React.createContext<boolean>(false);

export const OnlineContextProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [status, setStatus] = useState(dataCache.isOnline());

  useEffect(() => {
    const unsubscribe = dataCache.subscribe('online', (status: boolean) => {
      setStatus(status);
    });
    return () => {
      unsubscribe();
    };
  });

  return <OnlineContext.Provider value={status}>{children}</OnlineContext.Provider>;
};

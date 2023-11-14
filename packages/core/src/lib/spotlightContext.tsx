import type { ReactNode } from 'react';
import React, { useState } from 'react';
import type { Integration } from '~/integrations/integration';

export const SpotlightContext = React.createContext<{
  integrations: Integration[];
  setIntegrations: (integrations: Integration[]) => void;
}>({
  integrations: [],
  setIntegrations: function () {},
});

export const SpotlightProvider: React.FC<{
  children: ReactNode;
  initializedIntegrations: Integration[];
}> = ({ children, initializedIntegrations }) => {
  const [integrations, setIntegrations] = useState<Integration[]>(initializedIntegrations);

  return (
    <SpotlightContext.Provider
      value={{
        integrations,
        setIntegrations: (integrations: Integration[]) => {
          setIntegrations(integrations);
        },
      }}
    >
      {children}
    </SpotlightContext.Provider>
  );
};

import React, { createContext, useContext } from 'react';
import { useSimpleSubscriptionCheck } from '@/hooks/useSimpleSubscriptionCheck';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';

interface SubscriptionGlobalContextType {
  isActive: boolean;
  isLoading: boolean;
  hasBeenChecked: boolean;
  forceCheck: () => Promise<void>;
}

const SubscriptionGlobalContext = createContext<SubscriptionGlobalContextType>({
  isActive: false,
  isLoading: true,
  hasBeenChecked: false,
  forceCheck: async () => {},
});

export const useSubscriptionGlobal = () => useContext(SubscriptionGlobalContext);

export const SubscriptionGlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUnifiedAuth();
  
  // Usar verificação simples com cache local
  const { isActive, isLoading, hasBeenChecked, forceCheck } = useSimpleSubscriptionCheck(user?.id);

  return (
    <SubscriptionGlobalContext.Provider value={{
      isActive,
      isLoading,
      hasBeenChecked,
      forceCheck,
    }}>
      {children}
    </SubscriptionGlobalContext.Provider>
  );
};
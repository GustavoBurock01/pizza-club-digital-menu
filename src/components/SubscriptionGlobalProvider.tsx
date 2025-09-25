import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSubscriptionCore } from '@/hooks/useSubscriptionCore';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';

interface SubscriptionGlobalContextType {
  isActive: boolean;
  isLoading: boolean;
  hasBeenChecked: boolean;
}

const SubscriptionGlobalContext = createContext<SubscriptionGlobalContextType>({
  isActive: false,
  isLoading: true,
  hasBeenChecked: false,
});

export const useSubscriptionGlobal = () => useContext(SubscriptionGlobalContext);

export const SubscriptionGlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useUnifiedAuth();
  const [hasBeenChecked, setHasBeenChecked] = useState(false);
  
  // Fazer verificação apenas uma vez quando o usuário está autenticado
  const { isActive, isLoading } = useSubscriptionCore(user?.id, {
    enabled: isAuthenticated() && !hasBeenChecked,
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated()) {
      setHasBeenChecked(true);
    }
  }, [isLoading, isAuthenticated]);

  // Reset quando usuário faz logout
  useEffect(() => {
    if (!user) {
      setHasBeenChecked(false);
    }
  }, [user]);

  return (
    <SubscriptionGlobalContext.Provider value={{
      isActive,
      isLoading: isLoading && !hasBeenChecked,
      hasBeenChecked,
    }}>
      {children}
    </SubscriptionGlobalContext.Provider>
  );
};
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppDestination } from '../../types';

interface AppContextValue {
  currentDestination: AppDestination;
  navigateTo: (destination: AppDestination) => void;
  isOnline: boolean;
  isTrainingActive: boolean;
  setIsTrainingActive: (active: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDestination, setCurrentDestination] = useState<AppDestination>('home');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isTrainingActive, setIsTrainingActive] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navigateTo = (destination: AppDestination) => {
    setCurrentDestination(destination);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <AppContext.Provider
      value={{
        currentDestination,
        navigateTo,
        isOnline,
        isTrainingActive,
        setIsTrainingActive,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

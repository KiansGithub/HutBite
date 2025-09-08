import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { IStoreProfile, IWebSettings } from '@/types/store';
import { findNearestStore, getStoreProfile, getWebSettings } from '@/services/apiService';

interface StoreContextType {
  currentStore: IStoreProfile | null;
  webSettings: IWebSettings | null;
  storeId: string | null;
  loading: boolean;
  error: string | null;
  selectStore: (postcode: string) => Promise<void>;
  clearStore: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const [currentStore, setCurrentStore] = useState<IStoreProfile | null>(null);
  const [webSettings, setWebSettings] = useState<IWebSettings | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectStore = async (postcode: string) => {
    setLoading(true);
    setError(null);

    try {
      const foundStoreId = await findNearestStore(postcode);
      if (!foundStoreId) {
        throw new Error('No store found for this postcode');
      }

      const storeProfile = await getStoreProfile(foundStoreId);
      if (!storeProfile) {
        throw new Error('Failed to load store profile');
      }

      const settings = await getWebSettings(storeProfile.StoreURL);
      if (!settings) {
        throw new Error('Failed to load store settings');
      }

      setStoreId(foundStoreId);
      setCurrentStore(storeProfile);
      setWebSettings(settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select store');
    } finally {
      setLoading(false);
    }
  };

  const clearStore = () => {
    setCurrentStore(null);
    setWebSettings(null);
    setStoreId(null);
    setError(null);
  };

  return (
    <StoreContext.Provider value={{
      currentStore,
      webSettings,
      storeId,
      loading,
      error,
      selectStore,
      clearStore
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

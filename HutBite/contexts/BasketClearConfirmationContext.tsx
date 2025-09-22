import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { BasketClearConfirmationModal } from '@/components/BasketClearConfirmationModal';

interface ConfirmationState {
  visible: boolean;
  currentStoreName: string;
  newStoreName: string;
  itemCount: number;
  onConfirm: (() => void) | null;
}

interface BasketClearConfirmationContextType {
  showConfirmation: (params: {
    currentStoreName: string;
    newStoreName: string;
    itemCount: number;
    onConfirm: () => void;
  }) => void;
  hideConfirmation: () => void;
}

const BasketClearConfirmationContext = createContext<BasketClearConfirmationContextType | undefined>(undefined);

export function BasketClearConfirmationProvider({ children }: { children: ReactNode }) {
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    visible: false,
    currentStoreName: '',
    newStoreName: '',
    itemCount: 0,
    onConfirm: null,
  });

  const showConfirmation = useCallback((params: {
    currentStoreName: string;
    newStoreName: string;
    itemCount: number;
    onConfirm: () => void;
  }) => {
    setConfirmationState({
      visible: true,
      currentStoreName: params.currentStoreName,
      newStoreName: params.newStoreName,
      itemCount: params.itemCount,
      onConfirm: params.onConfirm,
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmationState(prev => ({
      ...prev,
      visible: false,
      onConfirm: null,
    }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmationState.onConfirm) {
      confirmationState.onConfirm();
    }
    hideConfirmation();
  }, [confirmationState.onConfirm, hideConfirmation]);

  const handleCancel = useCallback(() => {
    hideConfirmation();
  }, [hideConfirmation]);

  return (
    <BasketClearConfirmationContext.Provider value={{ showConfirmation, hideConfirmation }}>
      {children}
      <BasketClearConfirmationModal
        visible={confirmationState.visible}
        currentStoreName={confirmationState.currentStoreName}
        newStoreName={confirmationState.newStoreName}
        itemCount={confirmationState.itemCount}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </BasketClearConfirmationContext.Provider>
  );
}

export function useBasketClearConfirmation() {
  const context = useContext(BasketClearConfirmationContext);
  if (context === undefined) {
    throw new Error('useBasketClearConfirmation must be used within a BasketClearConfirmationProvider');
  }
  return context;
}

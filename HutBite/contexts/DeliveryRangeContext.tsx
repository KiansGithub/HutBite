import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Database } from '@/lib/supabase.d';
import { DeliveryRangeModal } from '@/components/DeliveryRangeModal';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

interface DeliveryRangeContextType {
  showDeliveryRangeModal: (
    restaurant: Restaurant,
    distance: number | undefined,
    onContinue: () => void
  ) => void;
  hideDeliveryRangeModal: () => void;
}

interface DeliveryRangeState {
  visible: boolean;
  restaurant: Restaurant | null;
  distance?: number;
  onContinue?: () => void;
}

const DeliveryRangeContext = createContext<DeliveryRangeContextType | undefined>(undefined);

interface DeliveryRangeProviderProps {
  children: ReactNode;
}

export const DeliveryRangeProvider: React.FC<DeliveryRangeProviderProps> = ({ children }) => {
  const [modalState, setModalState] = useState<DeliveryRangeState>({
    visible: false,
    restaurant: null,
    distance: undefined,
    onContinue: undefined,
  });

  const showDeliveryRangeModal = (
    restaurant: Restaurant,
    distance: number | undefined,
    onContinue: () => void
  ) => {
    setModalState({
      visible: true,
      restaurant,
      distance,
      onContinue,
    });
  };

  const hideDeliveryRangeModal = () => {
    setModalState({
      visible: false,
      restaurant: null,
      distance: undefined,
      onContinue: undefined,
    });
  };

  const handleContinueAnyway = () => {
    if (modalState.onContinue) {
      modalState.onContinue();
    }
    hideDeliveryRangeModal();
  };

  return (
    <DeliveryRangeContext.Provider
      value={{
        showDeliveryRangeModal,
        hideDeliveryRangeModal,
      }}
    >
      {children}
      
      <DeliveryRangeModal
        visible={modalState.visible}
        restaurant={modalState.restaurant}
        distance={modalState.distance}
        onClose={hideDeliveryRangeModal}
        onContinueAnyway={handleContinueAnyway}
      />
    </DeliveryRangeContext.Provider>
  );
};

export const useDeliveryRange = (): DeliveryRangeContextType => {
  const context = useContext(DeliveryRangeContext);
  if (!context) {
    throw new Error('useDeliveryRange must be used within a DeliveryRangeProvider');
  }
  return context;
};

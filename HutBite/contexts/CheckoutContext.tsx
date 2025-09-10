import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AddressDetails {
  address: string;
  city: string;
  postalCode: string;
}

interface BuildingDetails {
  buildingType: string;
  apt: string;
  buildingName: string;
  entryCode: string;
}

interface CheckoutData {
  addressDetails: AddressDetails;
  buildingDetails: BuildingDetails;
  deliveryInstructions: string;
  phoneNumber: string;
  setAddressDetails: (details: AddressDetails) => void;
  setBuildingDetails: (details: BuildingDetails) => void;
  setDeliveryInstructions: (instructions: string) => void;
  setPhoneNumber: (phone: string) => void;
}

const CheckoutContext = createContext<CheckoutData | undefined>(undefined);

export const CheckoutProvider = ({ children }: { children: ReactNode }) => {
  const [addressDetails, setAddressDetails] = useState<AddressDetails>({ address: '', city: '', postalCode: '' });
  const [buildingDetails, setBuildingDetails] = useState<BuildingDetails>({ buildingType: '', apt: '', buildingName: '', entryCode: '' });
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const value = {
    addressDetails,
    buildingDetails,
    deliveryInstructions,
    phoneNumber,
    setAddressDetails,
    setBuildingDetails,
    setDeliveryInstructions,
    setPhoneNumber,
  };

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
};

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
};

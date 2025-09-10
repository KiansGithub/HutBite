// contexts/CheckoutContext.tsx
import React, { createContext, useContext, useMemo, useState, ReactNode, useEffect } from 'react';
import { useBasket } from '@/contexts/BasketContext';
import { useStore } from '@/contexts/StoreContext';
import type { OrderType } from '@/types/store';

type Theme = 'light' | 'dark';

export interface AddressDetails {
  address: string;
  city: string;
  postalCode: string;
}

export interface BuildingDetails {
  buildingType: string;
  apt: string;
  buildingName: string;
  entryCode: string;
}

export interface ContactDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ComputedTotals {
  subtotalNum: number;
  deliveryNum: number;
  serviceNum: number;
  tipNum: number;
  totalNum: number;
  subtotal: string;
  delivery: string;
  service: string;
  tip: string;
  total: string;
}

interface CheckoutData {
  // raw form state
  contact: ContactDetails;
  addressDetails: AddressDetails;
  buildingDetails: BuildingDetails;
  deliveryInstructions: string;
  phoneValid: boolean;
  orderType: OrderType;           // 'DELIVERY' | 'COLLECTION'
  tipPercent: number;             // e.g. 0, 5, 10, 15
  promoCode: string;

  // setters
  setContact: (v: Partial<ContactDetails>) => void;
  setAddressDetails: (details: Partial<AddressDetails>) => void;
  setBuildingDetails: (details: Partial<BuildingDetails>) => void;
  setDeliveryInstructions: (instructions: string) => void;
  setPhoneValid: (valid: boolean) => void;
  setOrderType: (type: OrderType) => void;
  setTipPercent: (pct: number) => void;
  setPromoCode: (code: string) => void;

  // derived values
  totals: ComputedTotals;

  // helpers
  formatCurrency: (n: number) => string;
  parseCurrency: (s: string) => number;

  // validation + payload helpers for payment
  validate: () => { ok: boolean; errors: Record<string, string> };
  getCheckoutPayload: () => {
    contact: ContactDetails;
    addressDetails: AddressDetails;
    buildingDetails: BuildingDetails;
    deliveryInstructions: string;
    orderType: OrderType;
    tipPercent: number;
    promoCode: string;
    basketItems: ReturnType<typeof useBasket>['getFormattedBasketData'];
    totals: ComputedTotals;
  };
}

const CheckoutContext = createContext<CheckoutData | undefined>(undefined);

export const CheckoutProvider = ({ children }: { children: ReactNode }) => {
  const { total, getFormattedBasketData } = useBasket();
  const { deliveryCharge, serviceCharge, currency, orderType: storeOrderType } = useStore();

  // ---- Raw state
  const [contact, _setContact] = useState<ContactDetails>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [addressDetails, _setAddressDetails] = useState<AddressDetails>({
    address: '',
    city: '',
    postalCode: '',
  });
  const [buildingDetails, _setBuildingDetails] = useState<BuildingDetails>({
    buildingType: '',
    apt: '',
    buildingName: '',
    entryCode: '',
  });
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [phoneValid, setPhoneValid] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>(storeOrderType || 'DELIVERY');
  const [tipPercent, setTipPercent] = useState<number>(0);
  const [promoCode, setPromoCode] = useState<string>('');

  // Keep in sync if store changes orderType elsewhere
  useEffect(() => {
    if (storeOrderType && storeOrderType !== orderType) setOrderType(storeOrderType);
  }, [storeOrderType]);

  // ---- Helpers
  const parseCurrency = (s: string): number => {
    if (!s) return 0;
    // remove currency symbol(s), commas and spaces
    return Number((s.replace(/[^\d.-]/g, '') || '0'));
  };

  const formatCurrency = (n: number): string => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency || 'GBP',
      }).format(n);
    } catch {
      // fallback
      return `£${n.toFixed(2)}`;
    }
  };

  const basketSubtotalNum = useMemo(() => parseCurrency(total), [total]);

  const totals: ComputedTotals = useMemo(() => {
    const deliveryNum = orderType === 'DELIVERY' ? Number(deliveryCharge || 0) : 0;
    const serviceNum = Number(serviceCharge || 0);
    const base = basketSubtotalNum + deliveryNum + serviceNum;
    const tipNum = Math.max(0, Math.round((base * (tipPercent / 100)) * 100) / 100);
    const totalNum = Math.max(0, Math.round((base + tipNum) * 100) / 100);

    return {
      subtotalNum: basketSubtotalNum,
      deliveryNum,
      serviceNum,
      tipNum,
      totalNum,
      subtotal: formatCurrency(basketSubtotalNum),
      delivery: formatCurrency(deliveryNum),
      service: formatCurrency(serviceNum),
      tip: formatCurrency(tipNum),
      total: formatCurrency(totalNum),
    };
  }, [basketSubtotalNum, deliveryCharge, serviceCharge, orderType, tipPercent, currency]);

  // ---- Setters (partial-friendly)
  const setContact = (v: Partial<ContactDetails>) =>
    _setContact(prev => ({ ...prev, ...v }));

  const setAddressDetails = (v: Partial<AddressDetails>) =>
    _setAddressDetails(prev => ({ ...prev, ...v }));

  const setBuildingDetails = (v: Partial<BuildingDetails>) =>
    _setBuildingDetails(prev => ({ ...prev, ...v }));

  // ---- Validation
  const validate = () => {
    const errors: Record<string, string> = {};

    if (!contact.firstName.trim()) errors.firstName = 'First name is required';
    if (!contact.lastName.trim()) errors.lastName = 'Last name is required';

    if (!contact.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(contact.email)) {
      errors.email = 'Enter a valid email';
    }

    if (!contact.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!phoneValid) {
      errors.phone = 'Enter a valid phone number';
    }

    if (orderType === 'DELIVERY') {
      if (!addressDetails.address.trim()) errors.address = 'Address is required for delivery';
      if (!addressDetails.city.trim()) errors.city = 'City is required for delivery';
      if (!addressDetails.postalCode.trim()) errors.postalCode = 'Postal code is required for delivery';
    }

    return { ok: Object.keys(errors).length === 0, errors };
  };

  const getCheckoutPayload = () => ({
    contact,
    addressDetails,
    buildingDetails,
    deliveryInstructions,
    orderType,
    tipPercent,
    promoCode,
    basketItems: getFormattedBasketData(),
    totals,
  });

  const value: CheckoutData = {
    contact,
    addressDetails,
    buildingDetails,
    deliveryInstructions,
    phoneValid,
    orderType,
    tipPercent,
    promoCode,

    setContact,
    setAddressDetails,
    setBuildingDetails,
    setDeliveryInstructions,
    setPhoneValid,
    setOrderType,
    setTipPercent,
    setPromoCode,

    totals,
    formatCurrency,
    parseCurrency,

    validate,
    getCheckoutPayload,
  };

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
};

export const useCheckout = () => {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error('useCheckout must be used within a CheckoutProvider');
  return ctx;
};

import React, { createContext, useContext, useMemo, useState, ReactNode, useEffect } from 'react';
import { useBasket } from '@/contexts/BasketContext';
import { useStore } from '@/contexts/StoreContext';
import type { OrderType } from '@/types/store';

export interface AddressDetails { address: string; city: string; postalCode: string; }
export interface BuildingDetails { buildingType: string; apt: string; buildingName: string; entryCode: string; }
export interface ContactDetails { firstName: string; lastName: string; email: string; phone: string; }

interface ComputedTotals {
  subtotalNum: number; deliveryNum: number; serviceNum: number; tipNum: number; totalNum: number;
  subtotal: string; delivery: string; service: string; tip: string; total: string;
}

interface CheckoutData {
  contact: ContactDetails;
  addressDetails: AddressDetails;
  buildingDetails: BuildingDetails;
  deliveryInstructions: string;
  phoneValid: boolean;
  orderType: OrderType;    // 'DELIVERY' | 'COLLECTION'
  tipPercent: number;
  promoCode: string;

  // NEW: derived completeness flags used by UI + validation
  addressComplete: boolean;
  phoneComplete: boolean;

  setContact: (v: Partial<ContactDetails>) => void;
  setAddressDetails: (details: Partial<AddressDetails>) => void;
  setBuildingDetails: (details: Partial<BuildingDetails>) => void;
  setDeliveryInstructions: (instructions: string) => void;
  setPhoneValid: (valid: boolean) => void;
  setOrderType: (type: OrderType) => void;
  setTipPercent: (pct: number) => void;
  setPromoCode: (code: string) => void;

  totals: ComputedTotals;
  formatCurrency: (n: number) => string;
  parseCurrency: (s: string) => number;

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
  const [contact, _setContact] = useState<ContactDetails>({ firstName: '', lastName: '', email: '', phone: '' });
  const [addressDetails, _setAddressDetails] = useState<AddressDetails>({ address: '', city: '', postalCode: '' });
  const [buildingDetails, _setBuildingDetails] = useState<BuildingDetails>({ buildingType: '', apt: '', buildingName: '', entryCode: '' });
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [phoneValid, setPhoneValid] = useState(true);
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [tipPercent, setTipPercent] = useState<number>(0);
  const [promoCode, setPromoCode] = useState<string>('');

  useEffect(() => {
    if (storeOrderType && storeOrderType !== orderType) setOrderType(storeOrderType);
  }, [storeOrderType]);

  // ---- Derived completeness (single source of truth)
  const addressComplete = useMemo(() => {
    return !!(
      addressDetails.address?.trim() &&
      addressDetails.city?.trim() &&
      addressDetails.postalCode?.trim()
    );
  }, [addressDetails]);

  const phoneComplete = useMemo(() => {
    return !!contact.phone?.trim() && phoneValid;
  }, [contact.phone, phoneValid]);

  // ---- Money helpers
  const parseCurrency = (s: string): number => Number((s || '').replace(/[^\d.-]/g, '') || '0');
  const formatCurrency = (n: number): string => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'GBP' }).format(n);
    } catch { return `£${n.toFixed(2)}`; }
  };

  const basketSubtotalNum = useMemo(() => parseCurrency(total), [total]);

  const totals: ComputedTotals = useMemo(() => {
    const deliveryNum = orderType === 'DELIVERY' ? Number(deliveryCharge || 0) : 0;
    const serviceNum = Number(serviceCharge || 0);
    const base = basketSubtotalNum + deliveryNum + serviceNum;
    const tipNum = Math.max(0, Math.round(base * (tipPercent / 100) * 100) / 100);
    const totalNum = Math.max(0, Math.round((base + tipNum) * 100) / 100);
    return {
      subtotalNum: basketSubtotalNum, deliveryNum, serviceNum, tipNum, totalNum,
      subtotal: formatCurrency(basketSubtotalNum),
      delivery: formatCurrency(deliveryNum),
      service: formatCurrency(serviceNum),
      tip: formatCurrency(tipNum),
      total: formatCurrency(totalNum),
    };
  }, [basketSubtotalNum, deliveryCharge, serviceCharge, orderType, tipPercent, currency]);

  // ---- Setters
  const setContact = (v: Partial<ContactDetails>) => _setContact(prev => ({ ...prev, ...v }));
  const setAddressDetails = (v: Partial<AddressDetails>) => {
    console.log('Updating address details in CheckoutContext:', v);
    _setAddressDetails(prev => ({ ...prev, ...v }));
  };
  const setBuildingDetails = (v: Partial<BuildingDetails>) => _setBuildingDetails(prev => ({ ...prev, ...v }));

  // ---- Validation uses the same flags as UI
  const validate = () => {
    const errors: Record<string, string> = {};

    if (!phoneComplete) {
      errors.phone = contact.phone?.trim() ? 'Enter a valid phone number' : 'Phone number is required';
    }

    if (orderType === 'DELIVERY' && !addressComplete) {
      if (!addressDetails.address.trim()) errors.address = 'Address is required for delivery';
      if (!addressDetails.city.trim()) errors.city = 'City is required for delivery';
      if (!addressDetails.postalCode.trim()) errors.postalCode = 'Postal code is required for delivery';
    }

    return { ok: Object.keys(errors).length === 0, errors };
  };

  const getCheckoutPayload = () => {
    const cleanedContact: ContactDetails = {
      ...contact,
      firstName: (contact.firstName || '').trim() || 'Guest',
      lastName: (contact.lastName || '').trim() || 'Customer',
      email: (contact.email || '').trim() || `guest+${Date.now()}@hutbite.app`,
      phone: (contact.phone || '').trim(),
    };

    return {
      contact: cleanedContact,
      addressDetails,
      buildingDetails,
      deliveryInstructions,
      orderType,
      tipPercent,
      promoCode,
      basketItems: getFormattedBasketData(),
      totals,
    };
  };

  const value: CheckoutData = {
    contact,
    addressDetails,
    buildingDetails,
    deliveryInstructions,
    phoneValid,
    orderType,
    tipPercent,
    promoCode,

    addressComplete,
    phoneComplete,

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

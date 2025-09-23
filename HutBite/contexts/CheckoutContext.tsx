import React, { createContext, useContext, useMemo, useState, ReactNode, useEffect } from 'react';
import { useBasket } from '@/contexts/BasketContext';
import { useStore } from '@/contexts/StoreContext';
import type { OrderType } from '@/types/store';
import type { Restaurant } from '@/types/deliverability';

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

  // NEW: deliverability tracking
  deliverabilityStatus: 'idle' | 'checking' | 'ok' | 'out_of_range' | 'invalid' | 'error';
  deliverabilityChecked: boolean;
  restaurant: Restaurant | null;

  // NEW: derived completeness flags used by UI + validation
  addressComplete: boolean;
  phoneComplete: boolean;
  deliverabilityComplete: boolean;

  setContact: (v: Partial<ContactDetails>) => void;
  setAddressDetails: (details: Partial<AddressDetails>) => void;
  setBuildingDetails: (details: Partial<BuildingDetails>) => void;
  setDeliveryInstructions: (instructions: string) => void;
  setPhoneValid: (valid: boolean) => void;
  setOrderType: (type: OrderType) => void;
  setTipPercent: (pct: number) => void;
  setPromoCode: (code: string) => void;
  
  // NEW: deliverability setters
  setDeliverabilityStatus: (status: 'idle' | 'checking' | 'ok' | 'out_of_range' | 'invalid' | 'error') => void;
  setDeliverabilityChecked: (checked: boolean) => void;
  setRestaurant: (restaurant: Restaurant | null) => void;

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
    deliverabilityStatus: string;
  };
}

const CheckoutContext = createContext<CheckoutData | undefined>(undefined);

export const CheckoutProvider = ({ children }: { children: ReactNode }) => {
  const { total, getFormattedBasketData } = useBasket();
  const { deliveryCharge, serviceCharge, currency, orderType: storeOrderType, minDeliveryValue } = useStore();

  // ---- Raw state
  const [contact, _setContact] = useState<ContactDetails>({ firstName: '', lastName: '', email: '', phone: '' });
  const [addressDetails, _setAddressDetails] = useState<AddressDetails>({ address: '', city: '', postalCode: '' });
  const [buildingDetails, _setBuildingDetails] = useState<BuildingDetails>({ buildingType: '', apt: '', buildingName: '', entryCode: '' });
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [phoneValid, setPhoneValid] = useState(true);
  const [orderType, setOrderType] = useState<OrderType>('DELIVERY');
  const [tipPercent, setTipPercent] = useState<number>(0);
  const [promoCode, setPromoCode] = useState<string>('');

  // NEW: deliverability state
  const [deliverabilityStatus, _setDeliverabilityStatus] = useState<'idle' | 'checking' | 'ok' | 'out_of_range' | 'invalid' | 'error'>('idle');
  const [deliverabilityChecked, _setDeliverabilityChecked] = useState(false);
  const [restaurant, _setRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    if (storeOrderType && storeOrderType !== orderType) setOrderType(storeOrderType as OrderType);
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

  const deliverabilityComplete = useMemo(() => {
    // For delivery orders, require deliverability check to pass
    if (orderType === 'DELIVERY') {
      return deliverabilityStatus === 'ok' && deliverabilityChecked;
    }
    // For collection orders, deliverability is not required
    return true;
  }, [deliverabilityStatus, deliverabilityChecked, orderType]);

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
    // Reset deliverability check when address changes
    if (v.postalCode !== undefined) {
      _setDeliverabilityStatus('idle');
      _setDeliverabilityChecked(false);
    }
  };
  const setBuildingDetails = (v: Partial<BuildingDetails>) => _setBuildingDetails(prev => ({ ...prev, ...v }));

  // NEW: deliverability setters
  const setDeliverabilityStatus = (status: 'idle' | 'checking' | 'ok' | 'out_of_range' | 'invalid' | 'error') => {
    _setDeliverabilityStatus(status);
  };
  const setDeliverabilityChecked = (checked: boolean) => {
    _setDeliverabilityChecked(checked);
  };
  const setRestaurant = (restaurant: Restaurant | null) => {
    _setRestaurant(restaurant);
  };

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

    // NEW: deliverability validation for delivery orders
    if (orderType === 'DELIVERY' && !deliverabilityComplete) {
      if (deliverabilityStatus === 'out_of_range') {
        errors.deliverability = 'This address is outside our delivery area';
      } else if (deliverabilityStatus === 'invalid') {
        errors.deliverability = 'Please enter a valid postcode';
      } else if (deliverabilityStatus === 'error') {
        errors.deliverability = 'Unable to verify delivery area. Please try again';
      } else if (!deliverabilityChecked) {
        errors.deliverability = 'Please verify your delivery address';
      }
    }

    // NEW: minimum order validation for delivery orders
    if (orderType === 'DELIVERY' && minDeliveryValue > 0) {
      const currentTotal = totals.subtotalNum;
      if (currentTotal < minDeliveryValue) {
        const remaining = minDeliveryValue - currentTotal;
        errors.minimumOrder = `Minimum order is £${minDeliveryValue.toFixed(2)}. Add £${remaining.toFixed(2)} more to continue.`;
      }
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
      deliverabilityStatus,
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

    deliverabilityStatus,
    deliverabilityChecked,
    restaurant,

    addressComplete,
    phoneComplete,
    deliverabilityComplete,

    setContact,
    setAddressDetails,
    setBuildingDetails,
    setDeliveryInstructions,
    setPhoneValid,
    setOrderType,
    setTipPercent,
    setPromoCode,

    setDeliverabilityStatus,
    setDeliverabilityChecked,
    setRestaurant,

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

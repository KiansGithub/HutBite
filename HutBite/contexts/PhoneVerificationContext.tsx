/**
 * @fileoverview Phone verification context for managing verified phone numbers
 * Provides persistent storage and state management for phone verification
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PhoneVerificationContextType {
  verifiedPhone: string | null;
  isPhoneVerified: boolean;
  isLoading: boolean;
  setVerifiedPhone: (phone: string) => Promise<void>;
  clearVerifiedPhone: () => Promise<void>;
  checkPhoneVerification: (phone: string) => boolean;
}

const PhoneVerificationContext = createContext<PhoneVerificationContextType | undefined>(undefined);

const STORAGE_KEYS = {
  VERIFIED_PHONE: '@hutbite_verified_phone',
  VERIFICATION_TIMESTAMP: '@hutbite_verification_timestamp'
};

// Phone verification expires after 30 days
const VERIFICATION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

interface PhoneVerificationProviderProps {
  children: ReactNode;
}

export const PhoneVerificationProvider: React.FC<PhoneVerificationProviderProps> = ({ children }) => {
  const [verifiedPhone, setVerifiedPhoneState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load verified phone from storage on app start
  useEffect(() => {
    loadVerifiedPhone();
  }, []);

  const loadVerifiedPhone = async () => {
    try {
      setIsLoading(true);
      const [storedPhone, storedTimestamp] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.VERIFIED_PHONE),
        AsyncStorage.getItem(STORAGE_KEYS.VERIFICATION_TIMESTAMP)
      ]);

      if (storedPhone && storedTimestamp) {
        const timestamp = parseInt(storedTimestamp, 10);
        const now = Date.now();
        
        // Check if verification has expired
        if (now - timestamp < VERIFICATION_EXPIRY_MS) {
          setVerifiedPhoneState(storedPhone);
        } else {
          // Verification expired, clear storage
          await clearVerifiedPhone();
        }
      }
    } catch (error) {
      console.error('Error loading verified phone:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setVerifiedPhone = async (phone: string) => {
    try {
      const timestamp = Date.now().toString();
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.VERIFIED_PHONE, phone),
        AsyncStorage.setItem(STORAGE_KEYS.VERIFICATION_TIMESTAMP, timestamp)
      ]);
      setVerifiedPhoneState(phone);
      console.log('Phone verification saved:', phone);
    } catch (error) {
      console.error('Error saving verified phone:', error);
      throw error;
    }
  };

  const clearVerifiedPhone = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.VERIFIED_PHONE),
        AsyncStorage.removeItem(STORAGE_KEYS.VERIFICATION_TIMESTAMP)
      ]);
      setVerifiedPhoneState(null);
      console.log('Phone verification cleared');
    } catch (error) {
      console.error('Error clearing verified phone:', error);
      throw error;
    }
  };

  const checkPhoneVerification = (phone: string): boolean => {
    if (!verifiedPhone || !phone) return false;
    
    // Normalize phone numbers for comparison
    const normalizePhone = (p: string) => p.replace(/\D/g, '');
    return normalizePhone(verifiedPhone) === normalizePhone(phone);
  };

  const isPhoneVerified = verifiedPhone !== null;

  const value: PhoneVerificationContextType = {
    verifiedPhone,
    isPhoneVerified,
    isLoading,
    setVerifiedPhone,
    clearVerifiedPhone,
    checkPhoneVerification
  };

  return (
    <PhoneVerificationContext.Provider value={value}>
      {children}
    </PhoneVerificationContext.Provider>
  );
};

export const usePhoneVerification = (): PhoneVerificationContextType => {
  const context = useContext(PhoneVerificationContext);
  if (context === undefined) {
    throw new Error('usePhoneVerification must be used within a PhoneVerificationProvider');
  }
  return context;
};

/**
 * @fileoverview Phone verification service for HutBite app
 * Handles PIN-based phone number verification for order authentication
 */

import { AUTH } from '@/constants/api';

export interface PinVerificationResponse {
  success: boolean;
  pin?: string;
  error?: string;
}

/**
 * Verifies user phone number by sending a PIN 
 * @param phoneNumber - Customer's phone number (with country code)
 * @param storeUrl - Store URL for the API call 
 * @returns Promise with PIN verification response
 */
export const verifyUserPin = async (
  phoneNumber: string, 
  storeUrl: string
): Promise<PinVerificationResponse> => {
  try {
    const message = "Your HutBite verification code";
    const encodedPhone = encodeURIComponent(phoneNumber);
    const encodedMessage = encodeURIComponent(message);

    const url = `${storeUrl}/api/VerifyUser?PhoneNumbers=${encodedPhone}&deMesasgae=${encodedMessage}`;

    console.log('Sending PIN verification to:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: AUTH.HEADERS
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('PIN verification response:', data);

    if (data.deMsgBody && data.deMsgType === 6) {
      return {
        success: true, 
        pin: data.deMsgBody
      };
    } else {
      return {
        success: false, 
        error: 'Failed to send verification code'
      };
    }
  } catch (error) {
    console.error('Error sending PIN verification:', error);
    return {
      success: false, 
      error: error instanceof Error ? error.message : 'PIN verification failed'
    };
  }
};

/**
 * Validates UK phone number format
 * @param phoneNumber - Phone number to validate
 * @returns boolean indicating if phone number is valid
 */
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // UK phone number patterns
  const ukMobilePattern = /^(\+44|0044|44)?[0-9]{10}$/;
  const ukLandlinePattern = /^(\+44|0044|44)?[0-9]{10,11}$/;
  
  return ukMobilePattern.test(cleaned) || ukLandlinePattern.test(cleaned);
};

/**
 * Formats phone number for display
 * @param phoneNumber - Raw phone number
 * @returns Formatted phone number string
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Add +44 prefix if not present
  if (cleaned.startsWith('44')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    return `+44${cleaned.substring(1)}`;
  } else if (cleaned.length === 10) {
    return `+44${cleaned}`;
  }
  
  return phoneNumber;
};

/**
 * Checks if phone number needs country code
 * @param phoneNumber - Phone number to check
 * @returns boolean indicating if country code is needed
 */
export const needsCountryCode = (phoneNumber: string): boolean => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  return !cleaned.startsWith('44') && !cleaned.startsWith('+44');
};

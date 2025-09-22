/**
 * @fileoverview React hook for deliverability checking with debouncing
 * Provides debounced postcode validation and delivery radius checking
 * with loading states, error handling, and automatic status management
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { addressClient, DeliverabilityError } from '@/services/AddressClient';
import { 
  Restaurant, 
  DeliverabilityResult, 
  DeliverabilityStatus, 
  DeliverabilityHookResult 
} from '@/types/deliverability';

/**
 * Custom hook for checking postcode deliverability with debouncing
 * @param restaurant - Restaurant location coordinates
 * @param radiusMiles - Delivery radius in miles (default: 3)
 * @param debounceMs - Debounce delay in milliseconds (default: 350)
 * @returns Hook result with status, data, error, and check function
 * 
 * @example
 * const { status, data, error, check, isLoading } = useDeliverability(
 *   { lat: 51.69432, lon: -0.03441 },
 *   3.0
 * );
 * 
 * // Check postcode as user types
 * const handlePostcodeChange = (postcode: string) => {
 *   check(postcode);
 * };
 */
export function useDeliverability(
  restaurant: Restaurant,
  radiusMiles: number = 3,
  debounceMs: number = 350
): DeliverabilityHookResult {
  const [status, setStatus] = useState<DeliverabilityStatus>('idle');
  const [data, setData] = useState<DeliverabilityResult | null>(null);
  const [error, setError] = useState<DeliverabilityError | null>(null);
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentRequestRef = useRef<string | null>(null);

  /**
   * Clears any pending debounced check
   */
  const clearDebounce = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, []);

  /**
   * Performs the actual deliverability check
   * @param postcode - Postcode to check
   * @param requestId - Unique request ID to prevent race conditions
   */
  const performCheck = useCallback(async (postcode: string, requestId: string) => {
    try {
      // Only proceed if this is still the current request
      if (currentRequestRef.current !== requestId) {
        return;
      }

      setStatus('checking');
      setError(null);

      const result = await addressClient.checkDeliverability(
        restaurant,
        postcode,
        radiusMiles
      );

      // Check again if this is still the current request
      if (currentRequestRef.current !== requestId) {
        return;
      }

      setData(result);

      // Set status based on deliverability result
      if (result.deliverable) {
        setStatus('ok');
      } else {
        // Check if it's an invalid postcode or just out of range
        if (result.reason.toLowerCase().includes('invalid') || 
            result.reason.toLowerCase().includes('not found')) {
          setStatus('invalid');
        } else {
          setStatus('out_of_range');
        }
      }

    } catch (err) {
      // Only handle error if this is still the current request
      if (currentRequestRef.current !== requestId) {
        return;
      }

      const deliverabilityError = err instanceof DeliverabilityError 
        ? err 
        : new DeliverabilityError(`Unexpected error: ${err.message}`);

      setError(deliverabilityError);
      setData(null);

      // Set status based on error type
      if (deliverabilityError.code === 'INVALID_INPUT') {
        setStatus('invalid');
      } else {
        setStatus('error');
      }
    }
  }, [restaurant, radiusMiles]);

  /**
   * Initiates a deliverability check with debouncing
   * @param postcode - Postcode to check
   */
  const check = useCallback((postcode: string) => {
    // Clear any existing timeout
    clearDebounce();

    // Reset state if postcode is empty
    if (!postcode || !postcode.trim()) {
      setStatus('idle');
      setData(null);
      setError(null);
      currentRequestRef.current = null;
      return;
    }

    // Generate unique request ID to handle race conditions
    const requestId = `${Date.now()}-${Math.random()}`;
    currentRequestRef.current = requestId;

    // Set up debounced check
    debounceTimeoutRef.current = setTimeout(() => {
      performCheck(postcode.trim(), requestId);
    }, debounceMs);

  }, [clearDebounce, performCheck, debounceMs]);

  /**
   * Cleanup effect to clear timeouts on unmount
   */
  useEffect(() => {
    return () => {
      clearDebounce();
    };
  }, [clearDebounce]);

  /**
   * Reset state when restaurant or radius changes
   */
  useEffect(() => {
    setStatus('idle');
    setData(null);
    setError(null);
    currentRequestRef.current = null;
    clearDebounce();
  }, [restaurant.lat, restaurant.lon, radiusMiles, clearDebounce]);

  return {
    status,
    data,
    error,
    check,
    isLoading: status === 'checking'
  };
}

/**
 * Utility function to get user-friendly status message
 * @param status - Current deliverability status
 * @param data - Deliverability result data
 * @param error - Error object if any
 * @returns User-friendly status message
 */
export function getDeliverabilityMessage(
  status: DeliverabilityStatus,
  data: DeliverabilityResult | null,
  error: DeliverabilityError | null
): string {
  switch (status) {
    case 'idle':
      return '';
    case 'checking':
      return 'Checking delivery area...';
    case 'ok':
      return data 
        ? `✓ We deliver here! (${data.distance_miles.toFixed(1)} miles away)`
        : '✓ We deliver to this area!';
    case 'out_of_range':
      return data
        ? `Sorry, this postcode is ${data.distance_miles.toFixed(1)} miles away (max ${3} miles)`
        : 'Sorry, this postcode is outside our delivery area';
    case 'invalid':
      return 'Please enter a valid UK postcode';
    case 'error':
      return error?.message || 'Unable to check delivery area. Please try again.';
    default:
      return '';
  }
}

/**
 * Utility function to get status color for UI styling
 * @param status - Current deliverability status
 * @returns Color string for UI styling
 */
export function getDeliverabilityColor(status: DeliverabilityStatus): string {
  switch (status) {
    case 'ok':
      return '#10B981'; // Green
    case 'out_of_range':
      return '#F59E0B'; // Amber
    case 'invalid':
    case 'error':
      return '#EF4444'; // Red
    case 'checking':
      return '#6B7280'; // Gray
    default:
      return '#6B7280'; // Gray
  }
}

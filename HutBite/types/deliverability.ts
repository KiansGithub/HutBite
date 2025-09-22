/**
 * @fileoverview TypeScript interfaces for deliverability checking system
 * Defines types for restaurant location, customer postcode validation, and delivery radius checks
 */

export interface Restaurant {
  lat: number;
  lon: number;
}

export interface DeliverabilityRequest {
  restaurant: Restaurant;
  customer_postcode: string;
  radius_miles: number;
}

export interface DeliverabilityResult {
  deliverable: boolean;
  distance_miles: number;
  normalized_postcode: string;
  reason: string;
  source: 'cache' | 'api';
}

export interface DeliverabilityError {
  message: string;
  code?: string;
  status?: number;
}

export type DeliverabilityStatus = 
  | 'idle'           // Initial state, no check performed
  | 'checking'       // Currently checking deliverability
  | 'ok'            // Postcode is deliverable
  | 'out_of_range'  // Postcode is outside delivery radius
  | 'invalid'       // Invalid postcode format
  | 'error';        // Network or other error occurred

export interface DeliverabilityHookResult {
  status: DeliverabilityStatus;
  data: DeliverabilityResult | null;
  error: DeliverabilityError | null;
  check: (postcode: string) => void;
  isLoading: boolean;
}

export interface DeliverabilityCache {
  [key: string]: {
    result: DeliverabilityResult;
    timestamp: number;
  };
}

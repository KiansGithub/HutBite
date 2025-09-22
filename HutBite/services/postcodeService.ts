/**
 * @fileoverview Postcode service for location-based postcode detection and validation
 * Reverse geocoding from GPS coordinates to UK postcodes with postcodes.io primary + Nominatim fallback.
 */

import { UserLocation } from '@/hooks/useLocation';

export interface ReverseGeocodeResult {
  postcode: string | null;
  address?: string;
  error?: string;
  lat?: number;
  lng?: number;
}

/* ----------------------------- Normalization ----------------------------- */

const normalizeUKPostcode = (raw: string) =>
  raw?.toUpperCase().replace(/[^A-Z0-9]/g, '') ?? '';

/** Covers UK formats incl. special case GIR 0AA */
const UK_POSTCODE_FULL = /^(GIR0AA|[A-Z]{1,2}[0-9][0-9A-Z]?[0-9][A-Z]{2})$/;

/** e.g. "sw1a1aa" -> "SW1A 1AA" (if valid) */
export const formatUKPostcode = (postcode: string): string => {
  const clean = normalizeUKPostcode(postcode);
  if (!UK_POSTCODE_FULL.test(clean)) return postcode;
  return `${clean.slice(0, -3)} ${clean.slice(-3)}`;
};

export const validateUKPostcode = (postcode: string): boolean =>
  UK_POSTCODE_FULL.test(normalizeUKPostcode(postcode));

/** Extract postcode from arbitrary address-like text */
export const extractPostcodeFromAddress = (address: string): string | null => {
  const m = address
    ?.toUpperCase()
    .match(/\b(GIR ?0AA|[A-Z]{1,2}\d[A-Z0-9]?\s?\d[A-Z]{2})\b/);
  return m ? formatUKPostcode(m[0]) : null;
};

/* --------------------------- Outward code helpers --------------------------- */

export const getOutwardCode = (postcode: string): string | null => {
  const formatted = formatUKPostcode(postcode);
  const parts = formatted.split(' ');
  return parts.length === 2 ? parts[0] : null;
};

export const isSameDeliveryArea = (postcode1: string, postcode2: string): boolean => {
  const outward1 = getOutwardCode(postcode1);
  const outward2 = getOutwardCode(postcode2);
  return !!outward1 && !!outward2 && outward1 === outward2;
};

/* ------------------------------ Reverse lookup ----------------------------- */

/**
 * Minimal in-memory cache keyed by rounded lat/lon to reduce reverse lookups.
 * Rounds to 4 dp (~11m) which is more than precise enough for postcodes.
 */
const reverseCache = new Map<string, ReverseGeocodeResult>();
const cacheKey = (lat: number, lon: number) => `${lat.toFixed(4)},${lon.toFixed(4)}`;

const reverseWithPostcodesIO = async (lat: number, lon: number): Promise<ReverseGeocodeResult | null> => {
  const res = await fetch(`https://api.postcodes.io/postcodes?lon=${lon}&lat=${lat}`);
  if (!res.ok) throw new Error(`postcodes.io ${res.status}`);
  const data = await res.json();
  const first = data?.result?.[0];
  if (!first) return null;
  return {
    postcode: formatUKPostcode(first.postcode),
    lat: first.latitude as number,
    lng: first.longitude as number,
  };
};

const reverseWithNominatim = async (lat: number, lon: number): Promise<ReverseGeocodeResult> => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&countrycodes=gb&addressdetails=1`;
  const res = await fetch(url, {
    headers: {
      // Nominatim policy requires a valid UA; include contact if you have one
      'User-Agent': 'HutBite-App/1.0 (support@hutbite.com)',
    },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = await res.json();
  const direct = data?.address?.postcode as string | undefined;
  const display = data?.display_name as string | undefined;
  const postcode = direct
    ? formatUKPostcode(direct)
    : display
    ? extractPostcodeFromAddress(display)
    : null;
  const latNum = data?.lat ? Number(data.lat) : undefined;
  const lonNum = data?.lon ? Number(data.lon) : undefined;
  return { postcode, address: display, lat: latNum, lng: lonNum };
};

/**
 * Reverse geocode coordinates to postcode (UK)
 * Tries postcodes.io first (UK-specific), then falls back to Nominatim.
 */
export const reverseGeocodeToPostcode = async (
  location: UserLocation
): Promise<ReverseGeocodeResult> => {
  try {
    const { latitude, longitude } = location;
    const key = cacheKey(latitude, longitude);
    const cached = reverseCache.get(key);
    if (cached) return cached;

    // 1) UK-specific, generous limits
    const a = await reverseWithPostcodesIO(latitude, longitude);
    if (a?.postcode) {
      reverseCache.set(key, a);
      return a;
    }

    // 2) Fallback
    const b = await reverseWithNominatim(latitude, longitude);
    const result = b.postcode ? b : { postcode: null, error: 'No postcode found' as const };

    reverseCache.set(key, result);
    return result;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      postcode: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/* --------------------------- Forward geocoding --------------------------- */

/**
 * Geocode a UK postcode to lat/lng using postcodes.io
 * Returns normalized "SW1A 1AA" plus coordinates.
 */
export const geocodeUKPostcode = async (
  rawPostcode: string
): Promise<{ postcode: string; lat: number; lng: number } | null> => {
  const cleaned = normalizeUKPostcode(rawPostcode);
  if (!UK_POSTCODE_FULL.test(cleaned)) return null;

  const res = await fetch(`https://api.postcodes.io/postcodes/${cleaned}`);
  if (!res.ok) return null;

  const data = await res.json();
  const pc = data?.result?.postcode as string | undefined;
  const lat = data?.result?.latitude as number | undefined;
  const lng = data?.result?.longitude as number | undefined;

  if (!pc || lat == null || lng == null) return null;
  return { postcode: formatUKPostcode(pc), lat, lng };
};

/* ------------------------- Heuristics / utilities ------------------------ */

/** Quick gate to avoid calling APIs for obviously-wrong input */
export const looksLikeUKPostcode = (raw: string): boolean => {
  const s = normalizeUKPostcode(raw);
  // Loose pre-check: must be 5–7 chars total and end with 3 alphanumerics
  if (s.length < 5 || s.length > 7) return false;
  return UK_POSTCODE_FULL.test(s);
};

/**
 * Simple debounce helper for UI inputs (e.g., postcode text field)
 * Usage: const debounced = debounce(fn, 300)
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, ms = 300) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/* ---------------------------- Throttle reverse --------------------------- */

/**
 * Super-light rate limiter so rapid GPS updates don't spam reverse geocoding.
 * Call before kicking off reverse lookups; returns false if you should skip.
 */
let lastReverseAt = 0;
export const allowReverseLookup = (minIntervalMs = 800): boolean => {
  const now = Date.now();
  if (now - lastReverseAt < minIntervalMs) return false;
  lastReverseAt = now;
  return true;
};

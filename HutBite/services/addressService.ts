import { AddressyResponse, AddressySuggestion } from '@/types/addressy';

const API_KEY = 'AU23-PH66-MP68-RW54'; // ⚠️ proxy on server in production
const BASE = 'https://api.addressy.com/Capture/Interactive';

export type RetrieveItem = {
  Line1?: string;
  Line2?: string;
  Line3?: string;
  City?: string;
  PostalCode?: string;
};

export async function addressyFind(
  text: string,
  container?: string,
  limit = 20
): Promise<AddressySuggestion[]> {
  const params = new URLSearchParams({
    Key: API_KEY,
    Text: text,
    Countries: 'GB',               // GB only
    Limit: String(limit),
  });
  if (container) params.set('Container', container);

  const url = `${BASE}/Find/v1.20/json6.ws?${params.toString()}`;
  console.log('[Addressy] FIND →', url);

  const res = await fetch(url);
  if (!res.ok) {
    console.warn('[Addressy] FIND failed:', res.status, await res.text());
    return [];
  }
  const data: AddressyResponse = await res.json();
  return data?.Items ?? [];
}

// TEMP: no Retrieve usage while entitlement is missing
export type RetrievedLike = {
  line1: string;
  line2: string;
  line3: string;
  city: string;
  postalCode: string;
};

// export async function addressyRetrieve(id: string): Promise<RetrieveItem | null> {
//   const params = new URLSearchParams({ Key: API_KEY, Id: id });
//   const url = `${BASE}/Retrieve/v1.20/json3.ws?${params.toString()}`;
//   console.log('[Addressy] RETRIEVE →', url);

//   const res = await fetch(url);
//   if (!res.ok) {
//     console.warn('[Addressy] RETRIEVE failed:', res.status, await res.text());
//     return null;
//   }
//   const data: { Items: RetrieveItem[] } = await res.json();
//   console.log('[Addressy] RETRIEVE data:', JSON.stringify(data, null, 2));
//   return data?.Items?.[0] ?? null;
// }

/**
 * Build a "retrieved-like" address from a Find Address item.
 * UK Description usually ends with the postcode (e.g. "... EN7 6RQ").
 */
export function buildFromFindAddress(item: AddressySuggestion): RetrievedLike | null {
  if (item.Type !== 'Address') return null;

  // Examples:
  // Text: "48 Pear Tree Walk"
  // Description: "Cheshunt, Waltham Cross, EN7 6RQ"
  const text = (item.Text || '').trim();
  const desc = (item.Description || '').trim();

  // Extract postcode (UK) from Description
  const pcMatch = desc.match(/\b[A-Z]{1,2}\d[A-Z0-9]?\s*\d[A-Z]{2}\b/i);
  const postalCode = pcMatch ? pcMatch[0].toUpperCase().replace(/\s+/, ' ') : '';

  // Extract city as the last comma-separated token before postcode, fall back sensibly
  // "Cheshunt, Waltham Cross, EN7 6RQ" -> ["Cheshunt", "Waltham Cross", "EN7 6RQ"]
  const parts = desc.split(',').map(s => s.trim()).filter(Boolean);
  let city = '';
  if (parts.length) {
    // if last is postcode, take previous as city; else take last as city
    const last = parts[parts.length - 1];
    const looksLikePc = /\b[A-Z]{1,2}\d[A-Z0-9]?\s*\d[A-Z]{2}\b/i.test(last);
    city = looksLikePc ? (parts[parts.length - 2] || '') : last;
  }

  // Split Text into line1/line2 rudimentarily; most UK records have text as premise+thoroughfare
  // You can keep it simple and dump entire Text into line1.
  const line1 = text;
  const line2 = '';
  const line3 = '';

  return {
    line1,
    line2,
    line3,
    city,
    postalCode,
  };
}

// Helpers
export const normalizePostcode = (pc: string) => (pc || '').toUpperCase().replace(/\s+/g, '');
export const outwardCode = (pc: string) => {
  const m = (pc || '').toUpperCase().match(/^[A-Z]{1,2}\d[A-Z0-9]?\b/);
  return m ? m[0] : '';
};

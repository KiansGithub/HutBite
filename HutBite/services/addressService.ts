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

  const url = `${BASE}/Find/v1.10/json3.ws?${params.toString()}`;
  console.log('[Addressy] FIND →', url);

  const res = await fetch(url);
  if (!res.ok) {
    console.warn('[Addressy] FIND failed:', res.status, await res.text());
    return [];
  }
  const data: AddressyResponse = await res.json();
  return data?.Items ?? [];
}

export async function addressyRetrieve(id: string): Promise<RetrieveItem | null> {
  const params = new URLSearchParams({ Key: API_KEY, Id: id });
  const url = `${BASE}/Retrieve/v1.20/json3.ws?${params.toString()}`;
  console.log('[Addressy] RETRIEVE →', url);

  const res = await fetch(url);
  if (!res.ok) {
    console.warn('[Addressy] RETRIEVE failed:', res.status, await res.text());
    return null;
  }
  const data: { Items: RetrieveItem[] } = await res.json();
  console.log('[Addressy] RETRIEVE data:', JSON.stringify(data, null, 2));
  return data?.Items?.[0] ?? null;
}

// Helpers
export const normalizePostcode = (pc: string) => (pc || '').toUpperCase().replace(/\s+/g, '');
export const outwardCode = (pc: string) => {
  const m = (pc || '').toUpperCase().match(/^[A-Z]{1,2}\d[A-Z0-9]?\b/);
  return m ? m[0] : '';
};

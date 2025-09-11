import { AddressyResponse, AddressySuggestion } from '@/types/addressy';

// ❗️Don't ship secret keys in the app. Proxy this call on your server.
const API_KEY = 'AU23-PH66-MP68-RW54';
const BASE = 'https://api.addressy.com/Capture/Interactive';

type RetrieveItem = {
  Line1?: string;
  Line2?: string;
  Line3?: string;
  City?: string;
  PostalCode?: string;
};

export async function addressyFind(
  text: string,
  container?: string,
  limit = 8
): Promise<AddressySuggestion[]> {
  const params = new URLSearchParams({
    Key: API_KEY,
    Text: text,
    Countries: 'GB',
    Limit: String(limit),
  });
  if (container) params.set('Container', container);

  const res = await fetch(`${BASE}/Find/v1.10/json3.ws?${params.toString()}`);
  if (!res.ok) return [];
  const data: AddressyResponse = await res.json();
  if (!data?.Items) return [];
  return data.Items as AddressySuggestion[];
}

export async function addressyRetrieve(id: string): Promise<RetrieveItem | null> {
  const params = new URLSearchParams({ Key: API_KEY, Id: id });
  const res = await fetch(`${BASE}/Retrieve/v1.20/json3.ws?${params.toString()}`);
  if (!res.ok) return null;
  const data = await res.json();
  const item: RetrieveItem | undefined = data?.Items?.[0];
  return item || null;
}

// Helpers
export function normalizePostcode(pc: string) {
  return (pc || '').toUpperCase().replace(/\s+/g, '');
}
export function outwardCode(pc: string) {
  // GB outward code = up to first space (e.g., EN7 from "EN7 6RQ")
  const m = (pc || '').toUpperCase().match(/^[A-Z]{1,2}\d[A-Z0-9]?\b/);
  return m ? m[0] : '';
}

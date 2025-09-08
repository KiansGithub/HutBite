import { IStoreInfo } from '@/store/StoreContext';

/**
 * Store status codes
 */
export enum StoreStatus {
    CLOSED = 0, 
    MAINTENANCE = 1, 
    OPEN = 2, 
    HOLIDAY = 3
}

function parseHHMM(s: string): number | null {
    const [h, m] = s.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  }

/**
 * Checks if a store is currently open based on opening/closing times and status 
 * @param storeProfile - Store profile information 
 * @returns boolean indicating if store is open
 */
export function isStoreOpen(storeProfile: Partial<IStoreInfo>): boolean {

  // 2) if backend already told us isOpen, trust it
  if (typeof storeProfile.isOpen === 'boolean') return storeProfile.isOpen;

  // 3) parse "HH:MM-HH:MM"
  if (storeProfile.openingHours) {
    const [openStr, closeStr] = storeProfile.openingHours.split('-');
    const openMin = parseHHMM(openStr?.trim() ?? '');
    const closeMin = parseHHMM(closeStr?.trim() ?? '');
    if (openMin != null && closeMin != null) {
      const now = new Date();
      const current = now.getHours() * 60 + now.getMinutes();

      if (closeMin > openMin) {
        // same-day window
        return current >= openMin && current < closeMin;
      } else {
        // overnight window (e.g. 18:00–02:00)
        // open from openMin..1440 and 0..closeMin
        return current >= openMin || current < closeMin;
      }
    }
  }

  // 4) last resort: explicit OPEN means open; otherwise closed
  return storeProfile.status === StoreStatus.OPEN ? true : false;
}

/**
 * Gets a user-friendly message about store hours 
 * @param storeProfile - Store profile information 
 * @returns Message about store hours
 */
/**
 * Human-friendly store hours/status message.
 */
export function getStoreHoursMessage(store: {
  name?: string;
  address?: string;
  postalCode?: string;
  status?: number;
  openingHours?: string; // "HH:mm-HH:mm"
  isOpen?: boolean;
  closingIn?: number;    // minutes
}): string {

  // Helpers
  const parseHours = (s?: string) => {
    if (!s) return { open: undefined as string | undefined, close: undefined as string | undefined };
    const parts = s.split("-");
    if (parts.length !== 2) return { open: undefined, close: undefined };
    return { open: parts[0]?.trim(), close: parts[1]?.trim() };
  };

  const formatDuration = (mins?: number) => {
    if (mins == null || mins < 0) return "";
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h} hr ${m} min` : `${h} hr`;
  };

  const { open, close } = parseHours(store.openingHours);

  // Priority: special states if you use them
  if (store.status === StoreStatus.MAINTENANCE) {
    return "This store is currently under maintenance.";
  }
  if (store.status === StoreStatus.HOLIDAY) {
    return "This store is currently closed for holiday.";
  }

  // Use isOpen + closingIn when available
  if (store.isOpen === true) {
    // If we know when it closes and/or how long until close
    if (store.closingIn != null && store.closingIn >= 0) {
      const timeLeft = formatDuration(store.closingIn);
      if (close) {
        // e.g. "Open • closes at 23:00 (in 45 min)"
        return `Open now • closes at ${close} (in ${timeLeft}).`;
      }
      return `Open now • closes in ${timeLeft}.`;
    }

    if (close) {
      return `Open now • closes at ${close}.`;
    }
    return "Open now.";
  }

  if (store.isOpen === false) {
    if (open && close) {
      return `Closed now • hours today ${open}–${close}.`;
    }
    return "Closed now.";
  }

  // Fallbacks when isOpen is unknown
  if (open && close) {
    return `Store hours: ${open}–${close}.`;
  }

  return "Store hours unavailable.";
}

/**
 * Checks if store is closing soon (within specified minutes)
 * @param storeProfile - Store profile informatino 
 * @param warningMinutes - Minutes before closing to show warning (default: 15)
 * @returns boolean indicating if store is closing soon 
 */
export function isStoreClosingSoon(storeProfile: Partial<IStoreInfo>, warningMinutes: number = 15): boolean {
    if (!storeProfile.isOpen || !storeProfile.closingIn) {
        return false; 
    }

    return storeProfile.closingIn <= warningMinutes; 
}

/**
 * Gets a user-friendly message about store closing time 
 * @param storeProfile - Store profile information 
 * @returns Message about store closing 
 */
export function getStoreClosingMessage(storeProfile: Partial<IStoreInfo>): string {
    if (!storeProfile.isOpen) {
        return storeProfile.openingHours 
        ? `Store is closed. Hours: ${storeProfile.openingHours}`
        : "Store is currently closed.";
    }

    if (storeProfile.closingIn && storeProfile.closingIn <= 15) {
        return `Store closes in ${storeProfile.closingIn} minutes!`;
    }

    return storeProfile.openingHours
        ? `Store hours: ${storeProfile.openingHours}`
        : "Store is open.";
}

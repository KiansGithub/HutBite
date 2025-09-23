/**
 * Store Hours Utility Functions
 * Handles opening/closing time logic for restaurants
 */

export interface StoreHours {
  opening_time: string | null;
  closing_time: string | null;
  is_open?: boolean | null;
}

/**
 * Checks if a store is currently open based on opening/closing times
 * @param storeHours - Store hours object with opening_time and closing_time
 * @returns boolean - true if store is open, false if closed
 */
export function isStoreOpen(storeHours: StoreHours): boolean {
  // If no hours are set, assume store is open (fallback for MVP)
  if (!storeHours.opening_time || !storeHours.closing_time) {
    return storeHours.is_open ?? true;
  }

  const now = new Date();
  const currentTime = formatTimeToHHMM(now);
  
  const openTime = storeHours.opening_time;
  const closeTime = storeHours.closing_time;

  // Handle same-day hours (e.g., 09:00 - 22:00)
  if (closeTime > openTime) {
    return currentTime >= openTime && currentTime <= closeTime;
  }
  
  // Handle overnight hours (e.g., 22:00 - 02:00 next day)
  if (closeTime < openTime) {
    return currentTime >= openTime || currentTime <= closeTime;
  }

  // If open and close times are the same, store is closed
  return false;
}

/**
 * Gets the store status message for display
 * @param storeHours - Store hours object
 * @returns string - "Open" or "Closed • Opens at XX:XX" or "Closed • Closes at XX:XX"
 */
export function getStoreStatusMessage(storeHours: StoreHours): string {
  if (isStoreOpen(storeHours)) {
    if (storeHours.closing_time) {
      return `Open • Closes at ${formatDisplayTime(storeHours.closing_time)}`;
    }
    return "Open";
  } else {
    if (storeHours.opening_time) {
      return `Closed • Opens at ${formatDisplayTime(storeHours.opening_time)}`;
    }
    return "Closed";
  }
}

/**
 * Formats current time to HH:MM format for comparison
 * @param date - Date object
 * @returns string - Time in HH:MM format
 */
function formatTimeToHHMM(date: Date): string {
  return date.toTimeString().slice(0, 5); // "HH:MM"
}

/**
 * Formats time for display (converts 24h to 12h format)
 * @param time - Time string in HH:MM format
 * @returns string - Formatted time for display
 */
function formatDisplayTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour24 = parseInt(hours, 10);
  
  if (hour24 === 0) {
    return `12:${minutes} AM`;
  } else if (hour24 < 12) {
    return `${hour24}:${minutes} AM`;
  } else if (hour24 === 12) {
    return `12:${minutes} PM`;
  } else {
    return `${hour24 - 12}:${minutes} PM`;
  }
}

/**
 * Gets next opening time for a closed store
 * @param storeHours - Store hours object
 * @returns string | null - Next opening time or null if always closed
 */
export function getNextOpeningTime(storeHours: StoreHours): string | null {
  if (!storeHours.opening_time) return null;
  
  const now = new Date();
  const currentTime = formatTimeToHHMM(now);
  
  // If store opens later today
  if (currentTime < storeHours.opening_time) {
    return `Today at ${formatDisplayTime(storeHours.opening_time)}`;
  }
  
  // Store opens tomorrow
  return `Tomorrow at ${formatDisplayTime(storeHours.opening_time)}`;
}

/**
 * Checks if ordering should be disabled
 * @param storeHours - Store hours object
 * @param orderingEnabled - Global ordering enabled flag
 * @returns boolean - true if ordering should be disabled
 */
export function isOrderingDisabled(storeHours: StoreHours, orderingEnabled: boolean = true): boolean {
  return !orderingEnabled || !isStoreOpen(storeHours);
}

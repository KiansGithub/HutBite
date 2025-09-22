/**
 * @fileoverview AddressClient service for deliverability checking
 * Handles postcode validation, distance calculation, and delivery radius checks
 * with in-memory caching and retry logic for robust API communication
 */

import { 
  Restaurant, 
  DeliverabilityRequest, 
  DeliverabilityResult, 
  DeliverabilityCache 
} from '@/types/deliverability';

class AddressClient {
  private cache: DeliverabilityCache = {};
  private readonly baseUrl = 'https://e724bfcd241c.ngrok-free.app';
  private readonly timeout = 6000; // 6 seconds
  private readonly cacheExpiry = 30 * 60 * 1000; // 30 minutes

  /**
   * Normalizes postcode input by trimming, converting to uppercase, and collapsing spaces
   * @param postcode - Raw postcode input from user
   * @returns Normalized postcode string
   * @example
   * normalizePostcode('  en7 6rq  ') // Returns 'EN7 6RQ'
   * normalizePostcode('sw1a1aa') // Returns 'SW1A 1AA'
   */
  private normalizePostcode(postcode: string): string {
    return postcode
      .trim()
      .toUpperCase()
      .replace(/\s+/g, ' '); // Collapse multiple spaces to single space
  }

  /**
   * Generates cache key for storing deliverability results
   * @param restaurant - Restaurant location coordinates
   * @param normalizedPostcode - Normalized postcode string
   * @param radiusMiles - Delivery radius in miles
   * @returns Cache key string
   */
  private generateCacheKey(
    restaurant: Restaurant, 
    normalizedPostcode: string, 
    radiusMiles: number
  ): string {
    return `${restaurant.lat},${restaurant.lon},${normalizedPostcode},${radiusMiles}`;
  }

  /**
   * Checks if cached result is still valid (not expired)
   * @param timestamp - Timestamp when result was cached
   * @returns True if cache is still valid
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheExpiry;
  }

  /**
   * Retrieves cached deliverability result if available and valid
   * @param cacheKey - Cache key to lookup
   * @returns Cached result or null if not found/expired
   */
  private getCachedResult(cacheKey: string): DeliverabilityResult | null {
    const cached = this.cache[cacheKey];
    if (cached && this.isCacheValid(cached.timestamp)) {
      return { ...cached.result, source: 'cache' };
    }
    
    // Clean up expired cache entry
    if (cached) {
      delete this.cache[cacheKey];
    }
    
    return null;
  }

  /**
   * Stores deliverability result in cache
   * @param cacheKey - Cache key for storage
   * @param result - Deliverability result to cache
   */
  private setCachedResult(cacheKey: string, result: DeliverabilityResult): void {
    this.cache[cacheKey] = {
      result: { ...result, source: 'api' },
      timestamp: Date.now()
    };
  }

  /**
   * Makes HTTP request with timeout and retry logic
   * @param request - Deliverability request payload
   * @returns Promise resolving to deliverability result
   * @throws DeliverabilityError on network or server errors
   */
  private async makeRequest(request: DeliverabilityRequest): Promise<DeliverabilityResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    console.log('Making deliverability request to:', `${this.baseUrl}/deliverability/check`);
    console.log('Request payload:', JSON.stringify(request, null, 2));

    try {
      const response = await fetch(`${this.baseUrl}/deliverability/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new DeliverabilityError(
          `HTTP ${response.status}: ${response.statusText}`,
          'HTTP_ERROR',
          response.status
        );
      }

      const result: DeliverabilityResult = await response.json();
      console.log('API Success Response:', result);
      return { ...result, source: 'api' };

    } catch (error) {
      clearTimeout(timeoutId);
      
      console.error('Request failed:', error);
      
      if (error.name === 'AbortError') {
        throw new DeliverabilityError('Request timeout', 'TIMEOUT');
      }
      
      if (error instanceof DeliverabilityError) {
        throw error;
      }
      
      throw new DeliverabilityError(
        `Network error: ${error.message}`,
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * Performs deliverability check with retry logic
   * @param request - Deliverability request payload
   * @param attempt - Current attempt number (for retry logic)
   * @returns Promise resolving to deliverability result
   */
  private async performCheck(
    request: DeliverabilityRequest, 
    attempt: number = 1
  ): Promise<DeliverabilityResult> {
    try {
      return await this.makeRequest(request);
    } catch (error) {
      // Retry on network errors or 5xx server errors (but not 4xx client errors)
      const shouldRetry = attempt === 1 && (
        error.code === 'NETWORK_ERROR' || 
        error.code === 'TIMEOUT' ||
        (error.status && error.status >= 500)
      );

      if (shouldRetry) {
        console.log(`Deliverability check failed, retrying... (attempt ${attempt + 1})`);
        return this.performCheck(request, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Main method to check if a postcode is within delivery radius
   * @param restaurant - Restaurant location coordinates
   * @param postcode - Customer postcode to check
   * @param radiusMiles - Delivery radius in miles (default: 3)
   * @returns Promise resolving to deliverability result
   * @throws DeliverabilityError on validation or network errors
   * 
   * @example
   * const client = new AddressClient();
   * const result = await client.checkDeliverability(
   *   { lat: 51.69432, lon: -0.03441 },
   *   'EN7 6RQ',
   *   3.0
   * );
   * console.log(result.deliverable); // true/false
   */
  async checkDeliverability(
    restaurant: Restaurant,
    postcode: string,
    radiusMiles: number = 3
  ): Promise<DeliverabilityResult> {
    // Input validation
    if (!restaurant || typeof restaurant.lat !== 'number' || typeof restaurant.lon !== 'number') {
      throw new DeliverabilityError('Invalid restaurant coordinates', 'INVALID_INPUT');
    }

    if (!postcode || typeof postcode !== 'string') {
      throw new DeliverabilityError('Invalid postcode', 'INVALID_INPUT');
    }

    if (typeof radiusMiles !== 'number' || radiusMiles <= 0) {
      throw new DeliverabilityError('Invalid radius', 'INVALID_INPUT');
    }

    const normalizedPostcode = this.normalizePostcode(postcode);
    const cacheKey = this.generateCacheKey(restaurant, normalizedPostcode, radiusMiles);

    // Check cache first
    const cachedResult = this.getCachedResult(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Make API request
    const request: DeliverabilityRequest = {
      restaurant,
      customer_postcode: normalizedPostcode,
      radius_miles: radiusMiles,
    };

    const result = await this.performCheck(request);
    
    // Cache successful result
    this.setCachedResult(cacheKey, result);
    
    return result;
  }

  /**
   * Clears all cached deliverability results
   * Useful for testing or when cache needs to be refreshed
   */
  clearCache(): void {
    this.cache = {};
  }

  /**
   * Gets current cache size (number of cached results)
   * @returns Number of cached deliverability results
   */
  getCacheSize(): number {
    return Object.keys(this.cache).length;
  }
}

// Custom error class for deliverability-specific errors
class DeliverabilityError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'DeliverabilityError';
  }
}

// Export singleton instance for app-wide use
export const addressClient = new AddressClient();
export { AddressClient, DeliverabilityError };

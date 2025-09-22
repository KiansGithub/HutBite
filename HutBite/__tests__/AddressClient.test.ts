/**
 * @fileoverview Unit tests for AddressClient service
 * Tests postcode normalization, cache functionality, and error handling
 */

import { AddressClient, DeliverabilityError } from '@/services/AddressClient';
import { Restaurant } from '@/types/deliverability';

// Mock fetch for testing
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('AddressClient', () => {
  let client: AddressClient;
  const testRestaurant: Restaurant = { lat: 51.69432, lon: -0.03441 };

  beforeEach(() => {
    client = new AddressClient();
    client.clearCache();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Postcode Normalization', () => {
    const testCases = [
      // Input, Expected Output
      ['  en7 6rq  ', 'EN7 6RQ'],
      ['sw1a1aa', 'SW1A 1AA'],
      ['M1  1AA', 'M1 1AA'],
      ['  B33   8TH  ', 'B33 8TH'],
      ['n1c4ag', 'N1C 4AG'],
      ['', ''],
      ['   ', ''],
      ['EC1A 1BB', 'EC1A 1BB'], // Already normalized
    ];

    testCases.forEach(([input, expected]) => {
      it(`should normalize "${input}" to "${expected}"`, async () => {
        // Mock successful API response
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            deliverable: true,
            distance_miles: 2.5,
            normalized_postcode: expected,
            reason: 'OK',
            source: 'api'
          })
        } as Response);

        await client.checkDeliverability(testRestaurant, input);

        // Verify the normalized postcode was sent to API
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:8000/deliverability/check',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              restaurant: testRestaurant,
              customer_postcode: expected,
              radius_miles: 3
            })
          })
        );
      });
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys for same inputs', async () => {
      const restaurant1 = { lat: 51.69432, lon: -0.03441 };
      const restaurant2 = { lat: 51.69432, lon: -0.03441 }; // Same coordinates
      const postcode = 'EN7 6RQ';
      const radius = 3;

      // Mock API response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          deliverable: true,
          distance_miles: 2.5,
          normalized_postcode: postcode,
          reason: 'OK',
          source: 'api'
        })
      } as Response);

      // First call should hit API
      await client.checkDeliverability(restaurant1, postcode, radius);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call with same coordinates should use cache
      const result = await client.checkDeliverability(restaurant2, postcode, radius);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still only 1 API call
      expect(result.source).toBe('cache');
    });

    it('should generate different cache keys for different inputs', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          deliverable: true,
          distance_miles: 2.5,
          normalized_postcode: 'EN7 6RQ',
          reason: 'OK',
          source: 'api'
        })
      } as Response);

      // Different restaurant coordinates
      await client.checkDeliverability({ lat: 51.1, lon: -0.1 }, 'EN7 6RQ', 3);
      await client.checkDeliverability({ lat: 51.2, lon: -0.2 }, 'EN7 6RQ', 3);

      // Different postcodes
      await client.checkDeliverability(testRestaurant, 'SW1A 1AA', 3);
      await client.checkDeliverability(testRestaurant, 'M1 1AA', 3);

      // Different radius
      await client.checkDeliverability(testRestaurant, 'EN7 6RQ', 5);

      // Should have made 5 separate API calls (no cache hits)
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });
  });

  describe('Cache Functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should cache successful results', async () => {
      const mockResponse = {
        deliverable: true,
        distance_miles: 2.5,
        normalized_postcode: 'EN7 6RQ',
        reason: 'OK',
        source: 'api'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      // First call should hit API
      const result1 = await client.checkDeliverability(testRestaurant, 'EN7 6RQ');
      expect(result1.source).toBe('api');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await client.checkDeliverability(testRestaurant, 'EN7 6RQ');
      expect(result2.source).toBe('cache');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still only 1 API call
      expect(result2.deliverable).toBe(true);
    });

    it('should expire cache after 30 minutes', async () => {
      const mockResponse = {
        deliverable: true,
        distance_miles: 2.5,
        normalized_postcode: 'EN7 6RQ',
        reason: 'OK',
        source: 'api'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      // First call
      await client.checkDeliverability(testRestaurant, 'EN7 6RQ');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Advance time by 29 minutes (cache should still be valid)
      jest.advanceTimersByTime(29 * 60 * 1000);
      const result1 = await client.checkDeliverability(testRestaurant, 'EN7 6RQ');
      expect(result1.source).toBe('cache');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Advance time by 2 more minutes (cache should expire)
      jest.advanceTimersByTime(2 * 60 * 1000);
      await client.checkDeliverability(testRestaurant, 'EN7 6RQ');
      expect(mockFetch).toHaveBeenCalledTimes(2); // New API call
    });

    it('should clear cache manually', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          deliverable: true,
          distance_miles: 2.5,
          normalized_postcode: 'EN7 6RQ',
          reason: 'OK',
          source: 'api'
        })
      } as Response);

      // First call to populate cache
      await client.checkDeliverability(testRestaurant, 'EN7 6RQ');
      expect(client.getCacheSize()).toBe(1);

      // Clear cache
      client.clearCache();
      expect(client.getCacheSize()).toBe(0);

      // Next call should hit API again
      await client.checkDeliverability(testRestaurant, 'EN7 6RQ');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        client.checkDeliverability(testRestaurant, 'EN7 6RQ')
      ).rejects.toThrow(DeliverabilityError);
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      await expect(
        client.checkDeliverability(testRestaurant, 'EN7 6RQ')
      ).rejects.toThrow('HTTP 404: Not Found');
    });

    it('should handle timeout errors', async () => {
      jest.useFakeTimers();

      // Mock a request that never resolves
      mockFetch.mockImplementationOnce(() => new Promise(() => {}));

      const promise = client.checkDeliverability(testRestaurant, 'EN7 6RQ');

      // Advance time to trigger timeout
      jest.advanceTimersByTime(7000); // 7 seconds (more than 6s timeout)

      await expect(promise).rejects.toThrow('Request timeout');

      jest.useRealTimers();
    });

    it('should validate input parameters', async () => {
      // Invalid restaurant
      await expect(
        client.checkDeliverability(null as any, 'EN7 6RQ')
      ).rejects.toThrow('Invalid restaurant coordinates');

      // Invalid postcode
      await expect(
        client.checkDeliverability(testRestaurant, '')
      ).rejects.toThrow('Invalid postcode');

      // Invalid radius
      await expect(
        client.checkDeliverability(testRestaurant, 'EN7 6RQ', -1)
      ).rejects.toThrow('Invalid radius');
    });
  });

  describe('Retry Logic', () => {
    it('should retry on network errors', async () => {
      // First call fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            deliverable: true,
            distance_miles: 2.5,
            normalized_postcode: 'EN7 6RQ',
            reason: 'OK',
            source: 'api'
          })
        } as Response);

      const result = await client.checkDeliverability(testRestaurant, 'EN7 6RQ');
      expect(result.deliverable).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on 5xx errors but not 4xx errors', async () => {
      // 500 error should retry
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            deliverable: true,
            distance_miles: 2.5,
            normalized_postcode: 'EN7 6RQ',
            reason: 'OK',
            source: 'api'
          })
        } as Response);

      const result = await client.checkDeliverability(testRestaurant, 'EN7 6RQ');
      expect(result.deliverable).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // 400 error should NOT retry
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      } as Response);

      await expect(
        client.checkDeliverability(testRestaurant, 'SW1A 1AA')
      ).rejects.toThrow('HTTP 400: Bad Request');
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retry
    });
  });
});

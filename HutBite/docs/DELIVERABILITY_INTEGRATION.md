# Deliverability System Integration Guide

This guide explains how to integrate the deliverability checking system into your HutBite app.

## Overview

The deliverability system provides real-time postcode validation and delivery radius checking through a FastAPI backend. It includes:

- **AddressClient**: Service for API communication with caching and retry logic
- **useDeliverability**: React hook with debouncing and status management
- **DeliverabilityChecker**: Ready-to-use UI component
- **Comprehensive TypeScript types**: Full type safety throughout

## Quick Start

### 1. Basic Integration

```tsx
import React from 'react';
import { DeliverabilityChecker } from '@/components/DeliverabilityChecker';

const CheckoutPage = () => {
  const restaurant = { lat: 51.69432, lon: -0.03441 }; // Your restaurant coordinates

  const handleDeliverabilityChange = (deliverable: boolean, postcode: string) => {
    console.log(`${postcode} is ${deliverable ? 'deliverable' : 'not deliverable'}`);
    // Enable/disable checkout button based on deliverability
  };

  return (
    <DeliverabilityChecker
      restaurant={restaurant}
      radiusMiles={3}
      onDeliverabilityChange={handleDeliverabilityChange}
      placeholder="Enter your postcode"
    />
  );
};
```

### 2. Using the Hook Directly

```tsx
import React, { useState } from 'react';
import { useDeliverability } from '@/hooks/useDeliverability';

const CustomDeliveryCheck = () => {
  const [postcode, setPostcode] = useState('');
  const restaurant = { lat: 51.69432, lon: -0.03441 };
  
  const { status, data, error, check, isLoading } = useDeliverability(restaurant, 3);

  const handleInputChange = (text: string) => {
    setPostcode(text);
    check(text); // Automatically debounced by 350ms
  };

  return (
    <View>
      <TextInput
        value={postcode}
        onChangeText={handleInputChange}
        placeholder="Enter postcode"
      />
      
      {isLoading && <Text>Checking...</Text>}
      
      {status === 'ok' && (
        <Text style={{ color: 'green' }}>
          ✓ We deliver here! ({data?.distance_miles.toFixed(1)} miles away)
        </Text>
      )}
      
      {status === 'out_of_range' && (
        <Text style={{ color: 'orange' }}>
          Sorry, this postcode is outside our delivery area
        </Text>
      )}
      
      {status === 'invalid' && (
        <Text style={{ color: 'red' }}>
          Please enter a valid UK postcode
        </Text>
      )}
    </View>
  );
};
```

## Integration Points

### 1. Checkout Flow Integration

```tsx
// In your checkout component
import { DeliverabilityChecker } from '@/components/DeliverabilityChecker';
import { useCheckout } from '@/contexts/CheckoutContext';

const DeliveryAddressForm = () => {
  const { addressDetails, setAddressDetails } = useCheckout();
  const [isDeliverable, setIsDeliverable] = useState(false);
  const restaurant = { lat: 51.69432, lon: -0.03441 };

  const handleDeliverabilityChange = (deliverable: boolean, postcode: string) => {
    setIsDeliverable(deliverable);
    
    // Update address details with validated postcode
    if (deliverable) {
      setAddressDetails(prev => ({
        ...prev,
        postalCode: postcode
      }));
    }
  };

  return (
    <View>
      <DeliverabilityChecker
        restaurant={restaurant}
        radiusMiles={3}
        initialPostcode={addressDetails.postalCode}
        onDeliverabilityChange={handleDeliverabilityChange}
      />
      
      {/* Other address fields */}
      
      <Button 
        title="Continue to Payment"
        disabled={!isDeliverable}
        onPress={handleContinue}
      />
    </View>
  );
};
```

### 2. Restaurant-Specific Integration

```tsx
// Use different restaurants dynamically
import { useStore } from '@/contexts/StoreContext';

const DynamicDeliveryCheck = () => {
  const { storeInfo } = useStore();
  
  // Get restaurant coordinates from your store data
  const restaurant = {
    lat: storeInfo?.latitude || 51.69432,
    lon: storeInfo?.longitude || -0.03441
  };

  return (
    <DeliverabilityChecker
      restaurant={restaurant}
      radiusMiles={storeInfo?.deliveryRadius || 3}
    />
  );
};
```

### 3. Feed Integration

```tsx
// Show delivery availability on restaurant cards
const RestaurantCard = ({ restaurant }) => {
  const [userPostcode, setUserPostcode] = useState('');
  const { status } = useDeliverability(
    { lat: restaurant.lat, lon: restaurant.lon },
    restaurant.deliveryRadius
  );

  return (
    <View>
      <Text>{restaurant.name}</Text>
      
      {status === 'ok' && (
        <Badge color="green">Delivers to your area</Badge>
      )}
      
      {status === 'out_of_range' && (
        <Badge color="orange">Outside delivery area</Badge>
      )}
    </View>
  );
};
```

## Configuration

### Environment Variables

```bash
# Backend API URL (default: http://localhost:8000)
EXPO_PUBLIC_DELIVERABILITY_API_URL=http://localhost:8000

# Default delivery radius in miles (default: 3)
EXPO_PUBLIC_DEFAULT_DELIVERY_RADIUS=3

# Cache expiry in minutes (default: 30)
EXPO_PUBLIC_DELIVERABILITY_CACHE_EXPIRY=30
```

### Custom Configuration

```tsx
// Create custom AddressClient with different settings
import { AddressClient } from '@/services/AddressClient';

const customClient = new AddressClient({
  baseUrl: 'https://your-api.com',
  timeout: 10000, // 10 seconds
  cacheExpiry: 60 * 60 * 1000, // 1 hour
});

// Use in hook
const { status, check } = useDeliverability(
  restaurant,
  radiusMiles,
  350, // debounce ms
  customClient // custom client
);
```

## Status Management

The system provides comprehensive status tracking:

```tsx
type DeliverabilityStatus = 
  | 'idle'           // Initial state, no check performed
  | 'checking'       // Currently checking deliverability
  | 'ok'            // Postcode is deliverable
  | 'out_of_range'  // Postcode is outside delivery radius
  | 'invalid'       // Invalid postcode format
  | 'error';        // Network or other error occurred
```

### Status-Based UI

```tsx
const StatusIndicator = ({ status, data, error }) => {
  switch (status) {
    case 'checking':
      return <ActivityIndicator />;
    
    case 'ok':
      return (
        <View style={{ backgroundColor: '#10B98115', padding: 8, borderRadius: 4 }}>
          <Text style={{ color: '#10B981' }}>
            ✓ We deliver here! ({data?.distance_miles.toFixed(1)} miles)
          </Text>
        </View>
      );
    
    case 'out_of_range':
      return (
        <View style={{ backgroundColor: '#F59E0B15', padding: 8, borderRadius: 4 }}>
          <Text style={{ color: '#F59E0B' }}>
            ⚠ Outside delivery area ({data?.distance_miles.toFixed(1)} miles)
          </Text>
        </View>
      );
    
    case 'invalid':
      return (
        <View style={{ backgroundColor: '#EF444415', padding: 8, borderRadius: 4 }}>
          <Text style={{ color: '#EF4444' }}>
            ✗ Please enter a valid UK postcode
          </Text>
        </View>
      );
    
    case 'error':
      return (
        <View style={{ backgroundColor: '#EF444415', padding: 8, borderRadius: 4 }}>
          <Text style={{ color: '#EF4444' }}>
            ✗ {error?.message || 'Unable to check delivery area'}
          </Text>
        </View>
      );
    
    default:
      return null;
  }
};
```

## Performance Optimization

### Caching Strategy

The system includes intelligent caching:

- **In-memory cache**: Results cached for 30 minutes by default
- **Cache keys**: Based on restaurant coordinates, postcode, and radius
- **Automatic cleanup**: Expired entries removed automatically
- **Manual control**: `clearCache()` method available

```tsx
import { addressClient } from '@/services/AddressClient';

// Clear cache when needed
addressClient.clearCache();

// Check cache size
console.log('Cache size:', addressClient.getCacheSize());
```

### Debouncing

The hook automatically debounces user input:

```tsx
// Default 350ms debounce
const { check } = useDeliverability(restaurant, 3);

// Custom debounce timing
const { check } = useDeliverability(restaurant, 3, 500); // 500ms
```

## Error Handling

### Network Resilience

The system includes comprehensive error handling:

- **Automatic retries**: Network errors and 5xx server errors
- **Timeout handling**: 6-second timeout with retry
- **Graceful degradation**: Fallback error messages
- **Type-safe errors**: Custom `DeliverabilityError` class

```tsx
const handleError = (error: DeliverabilityError) => {
  switch (error.code) {
    case 'NETWORK_ERROR':
      showToast('Network connection issue. Please try again.');
      break;
    
    case 'TIMEOUT':
      showToast('Request timed out. Please check your connection.');
      break;
    
    case 'INVALID_INPUT':
      showToast('Please enter a valid postcode.');
      break;
    
    default:
      showToast('Unable to check delivery area. Please try again.');
  }
};
```

## Testing

### Unit Tests

Run the comprehensive test suite:

```bash
npm test AddressClient.test.ts
```

The tests cover:
- Postcode normalization
- Cache functionality
- Error handling
- Retry logic
- Input validation

### Manual Testing

Test with these postcodes:

```
EN7 6RQ  - Should be deliverable (close to El Curioso)
SW1A 1AA - May be out of range (central London)
INVALID  - Invalid postcode format
M1 1AA   - Test different area (Manchester)
```

## Troubleshooting

### Common Issues

1. **Network errors**: Check backend API is running on `http://localhost:8000`
2. **CORS issues**: Ensure backend allows requests from your frontend domain
3. **Cache issues**: Clear cache with `addressClient.clearCache()`
4. **Type errors**: Ensure all TypeScript interfaces are properly imported

### Debug Mode

Enable debug logging:

```tsx
const { status, data, error } = useDeliverability(restaurant, 3);

useEffect(() => {
  console.log('Deliverability status:', status);
  console.log('Deliverability data:', data);
  console.log('Deliverability error:', error);
}, [status, data, error]);
```

## Next Steps

1. **Integrate into checkout flow**: Use `onDeliverabilityChange` to control checkout button
2. **Add to restaurant cards**: Show delivery availability on feed items
3. **Customize styling**: Match your app's design system
4. **Add analytics**: Track deliverability check success rates
5. **Extend functionality**: Add delivery time estimates, multiple radius zones

## API Reference

### AddressClient Methods

```tsx
// Main method
checkDeliverability(restaurant: Restaurant, postcode: string, radiusMiles?: number): Promise<DeliverabilityResult>

// Cache management
clearCache(): void
getCacheSize(): number
```

### Hook Parameters

```tsx
useDeliverability(
  restaurant: Restaurant,     // Restaurant coordinates
  radiusMiles?: number,      // Delivery radius (default: 3)
  debounceMs?: number        // Debounce delay (default: 350)
): DeliverabilityHookResult
```

### Component Props

```tsx
interface DeliverabilityCheckerProps {
  restaurant: Restaurant;
  radiusMiles?: number;
  initialPostcode?: string;
  onDeliverabilityChange?: (deliverable: boolean, postcode: string) => void;
  placeholder?: string;
  style?: any;
  disabled?: boolean;
}
```

This system is production-ready and provides a robust foundation for delivery area validation in your HutBite app!

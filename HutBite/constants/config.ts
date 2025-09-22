/**
 * App configuration flags
 */
export const APP_CONFIG = {
    // Set to false for production builds without ordering functionality
    ORDERING_ENABLED: process.env.EXPO_PUBLIC_ORDERING_ENABLED !== 'false' && (process.env.EXPO_PUBLIC_ORDERING_ENABLED === 'true' || __DEV__),
    
    // Backend URL for HubRise orders and deliverability checking
    BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL || 'https://hutbiteintegrations.onrender.com',
  } as const;
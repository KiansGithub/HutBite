/**
 * App configuration flags
 */
export const APP_CONFIG = {
    // Set to false for production builds without ordering functionality
    ORDERING_ENABLED: process.env.EXPO_PUBLIC_ORDERING_ENABLED !== 'false' && (process.env.EXPO_PUBLIC_ORDERING_ENABLED === 'true' || __DEV__),
  } as const;
// src/lib/analytics.ts
// import '@react-native-firebase/app';
// import analytics from '@react-native-firebase/analytics';
// import { getFirebaseApp } from './firebase';

// let _enabled = false;

// export async function initAnalytics() {
//   const app = getFirebaseApp();
//   if (!app) return;

//   try {
//     await analytics().setAnalyticsCollectionEnabled(true);
//     _enabled = true;
//     console.log('[Analytics] enabled');
//   } catch (e) {
//     console.warn('[Analytics] init failed', e);
//   }
// }

// export class AnalyticsService {
//   static logSignUp(method: string) {
//     if (!_enabled) return;
//     analytics().logSignUp({ method });
//   }

//   static logLogin(method: string) {
//     if (!_enabled) return;
//     analytics().logLogin({ method });
//   }

//   static setUserId(userId: string) {
//     if (!_enabled) return;
//     analytics().setUserId(userId);
//   }

//   static setUserProperties(properties: Record<string, string>) {
//     if (!_enabled) return;
//     analytics().setUserProperties(properties);
//   }

//   static logScreenView(screenName: string, screenClass?: string) {
//     if (!_enabled) return;
//     analytics().logScreenView({
//       screen_name: screenName,
//       screen_class: screenClass ?? screenName,
//     });
//   }

//   static logVideoPlay(videoUrl: string, restaurantName: string) {
//     if (!_enabled) return;
//     analytics().logEvent('video_play', {
//       video_url: videoUrl,
//       restaurant_name: restaurantName,
//     });
//   }

//   static logVideoComplete(videoUrl: string, restaurantName: string) {
//     if (!_enabled) return;
//     analytics().logEvent('video_complete', {
//       video_url: videoUrl,
//       restaurant_name: restaurantName,
//     });
//   }

//   static logError(error: string, context?: string) {
//     if (!_enabled) return;
//     analytics().logEvent('app_error', {
//       error_message: error,
//       error_context: context,
//     });
//   }

//   static logTiming(name: string, value: number, category?: string) {
//     if (!_enabled) return;
//     analytics().logEvent('timing_complete', {
//       name,
//       value,
//       category,
//     });
//   }

//   static logCustomEvent(eventName: string, parameters: Record<string, any>) {
//     if (!_enabled) return;
//     analytics().logEvent(eventName, parameters);
//   }
// }

// export default AnalyticsService;

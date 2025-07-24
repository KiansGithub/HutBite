import analytics from '@react-native-firebase/analytics';

export class AnalyticsService {
    // Initialize analytics (call this in your app startup) 
    static async initialize() {
        try {
            await analytics().setAnalyticsCollectionEnabled(true);
            console.log('Analytics initialized successfully');
        } catch (error) {
            console.error('Failed to initialize analytics:', error);
        }
    }

    // User Events 
    static logSignUp(method: string) {
        analytics().logSignUp({ method });
    }

    static logLogin(method: string) {
        analytics().logLogin({ method });
    }

    static setUserId(userId: string) {
        analytics().setUserId(userId);
    }

    static setUserProperties(properties: Record<string, string>) {
        analytics().setUserProperties(properties);
    }

    // Screen Tracking 
    static logScreenView(screenName: string, screenClass?: string) {
        analytics().logScreenView({
            screen_name: screenName, 
            screen_class: screenClass || screenName, 
        });
    }

    static logVideoPlay(videoUrl: string, restaurantName: string) {
        analytics().logEvent('video_play', {
            video_url: videoUrl, 
            restaurant_name: restaurantName
        });
    }

    static logVideoComplete(videoUrl: string, restaurantName: string) {
        analytics().logEvent('video_complete', {
            video_url: videoUrl, 
            restaurant_name: restaurantName
        });
    }

    // Error tracking 
    static logError(error: string, context?: string) {
        analytics().logEvent('app_error', {
            error_message: error, 
            error_context: context
        });
    }

    // Performance Events 
    static logTiming(name: string, value: number, category?: string) {
        analytics().logEvent('timing_complete', {
            name, 
            value, 
            category
        });
    }

    // Custom event for additional tracking 
    static logCustomEvent(eventName: string, parameters: Record<string, any>) {
        analytics().logEvent(eventName, parameters);
    }
}

export default AnalyticsService; 
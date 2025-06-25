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
    static async logSignUp(method: string) {
        await analytics().logSignUp({ method });
    }

    static async logLogin(method: string) {
        await analytics().logLogin({ method });
    }

    static async setUserId(userId: string) {
        await analytics().setUserId(userId);
    }

    static async setUserProperties(properties: Record<string, string>) {
        await analytics().setUserProperties(properties);
    }

    // Screen Tracking 
    static async logScreenView(screenName: string, screenClass?: string) {
        await analytics().logScreenView({
            screen_name: screenName, 
            screen_class: screenClass || screenName, 
        });
    }

    static async logVideoPlay(videoUrl: string, restaurantName: string) {
        await analytics().logEvent('video_play', {
            video_url: videoUrl, 
            restaurant_name: restaurantName
        });
    }

    static async logVideoComplete(videoUrl: string, restaurantName: string) {
        await analytics().logEvent('video_complete', {
            video_url: videoUrl, 
            restaurant_name: restaurantName
        });
    }

    // Error tracking 
    static async logError(error: string, context?: string) {
        await analytics().logEvent('app_error', {
            error_message: error, 
            error_context: context
        });
    }

    // Performance Events 
    static  async logTiming(name: string, value: number, category?: string) {
        await analytics().logEvent('timing_complete', {
            name, 
            value, 
            category
        });
    }
}

export default AnalyticsService; 
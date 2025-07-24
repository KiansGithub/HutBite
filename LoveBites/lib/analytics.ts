import analytics from '@react-native-firebase/analytics';

interface SessionData {
    sessionId: string; 
    startTime: number; 
    endTime?: number; 
    duration?: number; 
}

export class AnalyticsService {
    private static currentSession: SessionData | null = null; 

    // Initialize analytics (call this in your app startup) 
    static async initialize() {
        try {
            await analytics().setAnalyticsCollectionEnabled(true);
            console.log('Analytics initialized successfully');
        } catch (error) {
            console.error('Failed to initialize analytics:', error);
        }
    }

    // Session Tracking 
    static async startSession(userId?: string) {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const startTime = Date.now();

        this.currentSession = {
            sessionId, 
            startTime
        };

        await analytics().logEvent('session_start', {
            session_id: sessionId, 
            user_id: userId || 'anonymous',
            timestamp: startTime
        });

        console.log('Session started:', sessionId);
    }

    static async endSession(userId?: string) {
        if (!this.currentSession) {
            console.warn('No active session to end');
            return;
        }

        const endTime = Date.now();
        const duration = endTime - this.currentSession.startTime; 

        this.currentSession.endTime = endTime; 
        this.currentSession.duration = duration; 

        await analytics().logEvent('session_end', {
            session_id: this.currentSession.sessionId, 
            user_id: userId || 'anonymous',
            duration_ms: duration, 
            duration_seconds: Math.round(duration / 1000),
            timestamp: endTime
        });

        console.log('Session ended:', this.currentSession.sessionId, 'Duration:', Math.round(duration / 1000), 'seconds');
        this.currentSession = null; 
    }

    static getCurrentSession(): SessionData | null {
        return this.currentSession; 
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

    // Custom event for additional tracking 
    static async logCustomEvent(eventName: string, parameters: Record<string, any>) {
        await analytics().logEvent(eventName, parameters);
    }
}

export default AnalyticsService; 
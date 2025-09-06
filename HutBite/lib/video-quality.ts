/**
 * Video Quality Management Utility
 * Handles progressive quality loading and network-aware quality selection
 */

export interface VideoQuality {
  label: string;
  resolution: string;
  bitrate: number;
  suffix: string;
}

export const VIDEO_QUALITIES: VideoQuality[] = [
  { label: 'Low', resolution: '480p', bitrate: 500, suffix: '_480p' },
  { label: 'Medium', resolution: '720p', bitrate: 1500, suffix: '_720p' },
  { label: 'High', resolution: '1080p', bitrate: 3000, suffix: '_1080p' },
  { label: 'Original', resolution: 'Original', bitrate: 5000, suffix: '' },
];

export interface NetworkInfo {
  effectiveType: '2g' | '3g' | '4g' | 'unknown';
  downlink: number; // Mbps
  rtt: number; // ms
}

export class VideoQualityManager {
  private static instance: VideoQualityManager;
  private networkInfo: NetworkInfo = { effectiveType: 'unknown', downlink: 10, rtt: 100 };
  private qualityCache = new Map<string, VideoQuality>();
  private failedUrls = new Set<string>();

  static getInstance(): VideoQualityManager {
    if (!VideoQualityManager.instance) {
      VideoQualityManager.instance = new VideoQualityManager();
    }
    return VideoQualityManager.instance;
  }

  /**
   * Update network information (can be called from network monitoring)
   */
  updateNetworkInfo(info: Partial<NetworkInfo>) {
    this.networkInfo = { ...this.networkInfo, ...info };
  }

  /**
   * Get the best quality URL for initial load based on network conditions
   */
  getInitialQuality(baseUrl: string): { url: string; quality: VideoQuality } {
    const quality = this.selectQualityForNetwork();
    const url = this.buildQualityUrl(baseUrl, quality);
    this.qualityCache.set(baseUrl, quality);
    return { url, quality };
  }

  /**
   * Get next higher quality for progressive enhancement
   */
  getNextQuality(baseUrl: string): { url: string; quality: VideoQuality } | null {
    const currentQuality = this.qualityCache.get(baseUrl);
    if (!currentQuality) return null;

    const currentIndex = VIDEO_QUALITIES.findIndex(q => q.suffix === currentQuality.suffix);
    if (currentIndex === -1 || currentIndex === VIDEO_QUALITIES.length - 1) return null;

    const nextQuality = VIDEO_QUALITIES[currentIndex + 1];
    const url = this.buildQualityUrl(baseUrl, nextQuality);
    
    // Don't upgrade if this URL has failed before
    if (this.failedUrls.has(url)) return null;

    return { url, quality: nextQuality };
  }

  /**
   * Get fallback quality for when current quality fails
   */
  getFallbackQuality(baseUrl: string): { url: string; quality: VideoQuality } | null {
    const currentQuality = this.qualityCache.get(baseUrl);
    if (!currentQuality) return null;

    const currentIndex = VIDEO_QUALITIES.findIndex(q => q.suffix === currentQuality.suffix);
    if (currentIndex <= 0) return null;

    const fallbackQuality = VIDEO_QUALITIES[currentIndex - 1];
    const url = this.buildQualityUrl(baseUrl, fallbackQuality);
    
    this.qualityCache.set(baseUrl, fallbackQuality);
    return { url, quality: fallbackQuality };
  }

  /**
   * Mark a URL as failed to avoid retrying
   */
  markUrlAsFailed(url: string) {
    this.failedUrls.add(url);
  }

  /**
   * Clear failed URLs cache (useful on app restart or network change)
   */
  clearFailedUrls() {
    this.failedUrls.clear();
  }

  /**
   * Get current quality for a base URL
   */
  getCurrentQuality(baseUrl: string): VideoQuality | null {
    return this.qualityCache.get(baseUrl) || null;
  }

  private selectQualityForNetwork(): VideoQuality {
    const { effectiveType, downlink } = this.networkInfo;

    // Conservative quality selection based on network
    if (effectiveType === '2g' || downlink < 1) {
      return VIDEO_QUALITIES[0]; // Low quality
    } else if (effectiveType === '3g' || downlink < 3) {
      return VIDEO_QUALITIES[1]; // Medium quality
    } else if (effectiveType === '4g' || downlink < 8) {
      return VIDEO_QUALITIES[2]; // High quality
    } else {
      return VIDEO_QUALITIES[2]; // Start with high, not original to be safe
    }
  }

  private buildQualityUrl(baseUrl: string, quality: VideoQuality): string {
    if (quality.suffix === '') return baseUrl; // Original quality
    
    // Replace .mp4 with quality suffix + .mp4
    return baseUrl.replace(/\.mp4$/i, `${quality.suffix}.mp4`);
  }
}

/**
 * Error types for better error handling
 */
export enum VideoErrorType {
  NETWORK_ERROR = 'network_error',
  DECODE_ERROR = 'decode_error',
  TIMEOUT_ERROR = 'timeout_error',
  CACHE_ERROR = 'cache_error',
  UNKNOWN_ERROR = 'unknown_error',
}

export interface VideoError {
  type: VideoErrorType;
  message: string;
  recoverable: boolean;
  retryDelay?: number; // ms
}

export class VideoErrorHandler {
  /**
   * Classify error and determine recovery strategy
   */
  static classifyError(error: any): VideoError {
    const message = error?.message || error?.toString() || 'Unknown error';
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('network') || lowerMessage.includes('connection') || lowerMessage.includes('timeout')) {
      return {
        type: VideoErrorType.NETWORK_ERROR,
        message: 'Network connection issue',
        recoverable: true,
        retryDelay: 2000,
      };
    }

    if (lowerMessage.includes('decode') || lowerMessage.includes('format') || lowerMessage.includes('codec')) {
      return {
        type: VideoErrorType.DECODE_ERROR,
        message: 'Video format not supported',
        recoverable: false,
      };
    }

    if (lowerMessage.includes('cache') || lowerMessage.includes('storage')) {
      return {
        type: VideoErrorType.CACHE_ERROR,
        message: 'Cache issue detected',
        recoverable: true,
        retryDelay: 1000,
      };
    }

    return {
      type: VideoErrorType.UNKNOWN_ERROR,
      message: 'Playback failed',
      recoverable: true,
      retryDelay: 3000,
    };
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: VideoError): string {
    switch (error.type) {
      case VideoErrorType.NETWORK_ERROR:
        return 'Check your connection';
      case VideoErrorType.DECODE_ERROR:
        return 'Video format error';
      case VideoErrorType.CACHE_ERROR:
        return 'Clearing cache...';
      case VideoErrorType.TIMEOUT_ERROR:
        return 'Loading timeout';
      default:
        return 'Tap to retry';
    }
  }
}

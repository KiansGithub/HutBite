/**
 * Utility functions for handling image URLs
 */

/**
 * Default fallback image to use when image URL cannot be constructed 
 */
const FALLBACK_IMAGE: null = null;

/**
 * Debug prefix for logging image URL construction 
 */
const DEBUG_PREFIX = '[ImageUtils]';

/**
 * Safely constructs an image URL by combining base URL and image path
 * @param baseUrl - Base URL for images (e.g. CDN/storage URL)
 * @param imagePath = Relative path to specific image 
 * @returns Complete image URL or null if invalid inputs
 */
export const buildImageUrl = (
    baseUrl?: string,
    imagePath?: string
): string | null => {
    // console.debug(`${DEBUG_PREFIX} Attempting to build URL:`, { baseUrl, imagePath });

    // Guard against missing image path
    if (!imagePath) {
        console.debug(`${DEBUG_PREFIX} Missing image path`);
        return FALLBACK_IMAGE;
    }

    const trimmedPath = imagePath.trim();

    try {
        // If the path itself is already an absolute URL, use it directly
        if (/^https?:\/\//i.test(trimmedPath)) {
            new URL(trimmedPath); // validate URL
            return trimmedPath;
        }

        // Require base URL for relative paths
        if (!baseUrl) {
            console.debug(`${DEBUG_PREFIX} Missing base URL`);
            return FALLBACK_IMAGE;
        }

        // Normalize base URL
        let normalizedBase = baseUrl.trim();
        if (!normalizedBase.endsWith('/')) {
            normalizedBase += '/';
        }

        // Normalize the relative path
        let normalizedPath = trimmedPath;
        if (normalizedPath.startsWith('/')) {
            normalizedPath = normalizedPath.slice(1);
        }

        const fullUrl = `${normalizedBase}${normalizedPath}`;
        new URL(fullUrl); // validate result

        return fullUrl;
    } catch (error) {
        console.warn('Failed to construct image URL:', error);
        return null;
    }
};
import { useState, useEffect, useCallback } from 'react';
import { Dimensions, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenDimensions {
  width: number;
  height: number;
  screenHeight: number;
  windowHeight: number;
  isLandscape: boolean;
  safeHeight: number;
  contentHeight: number;
}

/**
 * Hook to manage screen dimensions with Android-specific fixes
 * Handles layout corruption issues that occur after errors on Android
 */
export function useScreenDimensions() {
  const insets = useSafeAreaInsets();
  const [dimensions, setDimensions] = useState<ScreenDimensions>(() => {
    const screen = Dimensions.get('screen');
    const window = Dimensions.get('window');
    
    return {
      width: screen.width,
      height: screen.height,
      screenHeight: screen.height,
      windowHeight: window.height,
      isLandscape: screen.width > screen.height,
      safeHeight: screen.height - insets.top - insets.bottom,
      contentHeight: screen.height - insets.top - insets.bottom - (Platform.OS === 'android' ? 60 : 80), // Tab bar height
    };
  });

  // Force refresh dimensions - useful for Android layout corruption recovery
  const refreshDimensions = useCallback(() => {
    const screen = Dimensions.get('screen');
    const window = Dimensions.get('window');
    
    // On Android, sometimes we need to force a layout recalculation
    if (Platform.OS === 'android') {
      // Small delay to ensure proper dimension calculation
      setTimeout(() => {
        const refreshedScreen = Dimensions.get('screen');
        const refreshedWindow = Dimensions.get('window');
        
        setDimensions({
          width: refreshedScreen.width,
          height: refreshedScreen.height,
          screenHeight: refreshedScreen.height,
          windowHeight: refreshedWindow.height,
          isLandscape: refreshedScreen.width > refreshedScreen.height,
          safeHeight: refreshedScreen.height - insets.top - insets.bottom,
          contentHeight: refreshedScreen.height - insets.top - insets.bottom - 60, // Android tab bar
        });
      }, 100);
    } else {
      setDimensions({
        width: screen.width,
        height: screen.height,
        screenHeight: screen.height,
        windowHeight: window.height,
        isLandscape: screen.width > screen.height,
        safeHeight: screen.height - insets.top - insets.bottom,
        contentHeight: screen.height - insets.top - insets.bottom - 80, // iOS tab bar
      });
    }
  }, [insets.top, insets.bottom]);

  // Listen for dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ screen, window }) => {
      setDimensions({
        width: screen.width,
        height: screen.height,
        screenHeight: screen.height,
        windowHeight: window.height,
        isLandscape: screen.width > screen.height,
        safeHeight: screen.height - insets.top - insets.bottom,
        contentHeight: screen.height - insets.top - insets.bottom - (Platform.OS === 'android' ? 60 : 80),
      });
    });

    return () => subscription?.remove();
  }, [insets.top, insets.bottom]);

  // Android-specific: Listen for layout changes and refresh if needed
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Check if dimensions seem corrupted (common Android issue)
      const screen = Dimensions.get('screen');
      if (screen.height <= 0 || screen.width <= 0) {
        console.warn('🔧 Detected corrupted screen dimensions, refreshing...');
        refreshDimensions();
      }
    }
  }, [refreshDimensions]);

  return {
    ...dimensions,
    refreshDimensions,
    // Utility functions
    getTabBarHeight: () => Platform.OS === 'android' ? 60 : 80,
    getStatusBarHeight: () => Platform.OS === 'android' ? StatusBar.currentHeight || 24 : insets.top,
    isAndroid: Platform.OS === 'android',
    isIOS: Platform.OS === 'ios',
  };
}

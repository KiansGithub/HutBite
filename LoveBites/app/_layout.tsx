import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '@/store/authStore';

import AnalyticsService from '@/lib/analytics';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
    AnalyticsService.initialize();
  }, []);

    /* 🔑 make both light & dark themes transparent */
    const TransparentLight = {
      ...DefaultTheme,
      colors: { ...DefaultTheme.colors, background: 'transparent' },
    };
    const TransparentDark = {
      ...DarkTheme,
      colors: { ...DarkTheme.colors, background: 'transparent' },
    };

  if (loading) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? TransparentDark : TransparentLight}>
      <Stack screenOptions={{ headerShown: false }}>
        {user ? <Stack.Screen name="(main)" /> : <Stack.Screen name="auth" />}
      </Stack>
    </ThemeProvider>
  );
}
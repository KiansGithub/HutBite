import 'dotenv/config';
import { ExpoConfig } from '@expo/config';

const config: ExpoConfig = {
  name: "LiveBites",
  slug: "LiveBites",
  owner: "kiandev",
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "livebites",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/logo.png",
    resizeMode: "contain",
    backgroundColor: "#F5A235"
  },
  ios: {
    bundleIdentifier: "com.livebites.livebites",
    googleServicesFile: "./GoogleService-Info.plist",
    supportsTablet: false,
    usesAppleSignIn: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "LiveBites needs your location to show restaurants that deliver to you.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "LiveBites uses your location in the background to keep delivery areas up to date.",
      NSPhotoLibraryUsageDescription:
        "LiveBites needs access to your photos to let you choose images.",
      NSPhotoLibraryAddUsageDescription:
        "LiveBites needs permission to save images to your photo library."
    },
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS
    }
  },
  android: {
    package: "com.livebites.livebites",
    newArchEnabled: false,
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#F5A235"
    },
    edgeToEdgeEnabled: true,
    googleServicesFile: "./google-services.json",
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID
      }
    }
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png"
  },
  plugins: [
    "expo-router",
    [
      "expo-video",
      {
        supportsBackgroundPlayback: false,
        supportsPictureInPicture: false
      }
    ],
    "expo-web-browser",
    "expo-apple-authentication",
    [
      "expo-build-properties",
      {
        ios: {
          useFrameworks: "static",
          useModularHeaders: true,
          config: {
            RNFirebaseAnalyticsWithoutAdIdSupport: "true"
          }
        }
      }
    ],
    "@react-native-firebase/app"
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    router: {},
    eas: {
      projectId: "166d213b-c90c-4e09-b0a0-d21a5f4078b3"
    }
  }
};

export default config;

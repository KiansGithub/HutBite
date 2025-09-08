import 'dotenv/config';
import { ExpoConfig, ConfigContext } from '@expo/config';

const config: ExpoConfig = {
  name: "HutBite",
  slug: "HutBite",
  owner: "kiandev",
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "hutbite",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/logo.png",
    resizeMode: "contain",
    backgroundColor: "#F9FAFB"
  },
  ios: {
    bundleIdentifier: "com.hutbite.hutbite",
    googleServicesFile: "./GoogleService-Info.plist",
    supportsTablet: false,
    usesAppleSignIn: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "hutbite needs your location to show restaurants that deliver to you.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "hutbite uses your location in the background to keep delivery areas up to date.",
      NSPhotoLibraryUsageDescription:
        "hutbite needs access to your photos to let you choose images.",
      NSPhotoLibraryAddUsageDescription:
        "hutbite needs permission to save images to your photo library.", 
      ITSAppUsesNonExemptEncryption: false
    },
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS
    }
  },
  android: {
    package: "com.hutbite.hutbite",
    newArchEnabled: false,
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#F9FAFB"
    },
    edgeToEdgeEnabled: true,
    googleServicesFile: "./google-services.json",
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID
      }
    }, 
    blockedPermissions: ["android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK"],
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
    // [
    //   "expo-build-properties",
    //   {
    //     ios: {
    //       useFrameworks: "static",
    //       useModularHeaders: true,
    //       config: {
    //         RNFirebaseAnalyticsWithoutAdIdSupport: "true"
    //       }
    //     }
    //   }
    // ],
    // "@react-native-firebase/app"
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    FEATURES: {
      MENU: process.env.EXPO_PUBLIC_FEATURE_MENU === 'true' || false,
      ORCHESTRATOR: process.env.EXPO_PUBLIC_FEATURE_ORCHESTRATOR === 'true' || false,
    },
    router: {},
    "eas": {
        "projectId": "07c2cd9b-94b6-46ae-8e2c-40f669996c1e"
      }
  }
};

export default config;

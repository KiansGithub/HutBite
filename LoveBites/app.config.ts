// app.config.js  – put this at the project root, next to package.json
// (Optional) Load .env when you run the app locally with `expo start`
import 'dotenv/config';

export default () => ({
  expo: {
    name: 'LiveBites',
    slug: 'LiveBites',
    owner: 'kiandev',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'livebites',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,

    splash: {
      image: './assets/images/logo.png',
      resizeMode: 'contain',
      backgroundColor: '#FF9900',
    },

    ios: {
      bundleIdentifier: 'com.livebites.livebites',
      googleServicesFile: './GoogleService-Info.plist',
      supportsTablet: true,
      usesAppleSignIn: true,
    },

    android: {
      package: 'com.livebites.livebites',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      googleServicesFile: './google-services.json',
    },

    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },

    plugins: [
      'expo-router',
      [
        'expo-video',
        {
          supportsBackgroundPlayback: true,
          supportsPictureInPicture: true,
        },
      ],
      'expo-web-browser',
      'expo-apple-authentication',
    ],

    experiments: {
      typedRoutes: true,
    },

    /** ⬇️  THIS is what matters: inject build-time env vars */
    extra: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      GOOGLE_WEB_CLIENT_ID: process.env.GOOGLE_WEB_CLIENT_ID,
      eas: { projectId: '166d213b-c90c-4e09-b0a0-d21a5f4078b3' },
    },
  },
});

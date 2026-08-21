import type { ExpoConfig } from 'expo/config';

/**
 * The package name here must match the Android app registered in the Firebase
 * console, or `google-services.json` will not apply and push will silently
 * never arrive — the single most common way this project fails to work.
 */
const config: ExpoConfig = {
  name: 'Mini Social Feed',
  slug: 'mini-social-feed',
  scheme: 'minisocial',
  version: '1.0.0',
  orientation: 'default',
  userInterfaceStyle: 'automatic',

  splash: {
    backgroundColor: '#0A1021',
    resizeMode: 'contain',
  },

  android: {
    package: 'com.minisocialfeed.app',
    versionCode: 1,
    googleServicesFile: './google-services.json',
    adaptiveIcon: { backgroundColor: '#0A1021' },
    permissions: ['POST_NOTIFICATIONS', 'INTERNET'],
    // Edge to edge, per Material 3.
    softwareKeyboardLayoutMode: 'pan',
  },

  plugins: [
    'expo-router',
    'expo-secure-store',
    '@react-native-firebase/app',
    '@react-native-firebase/messaging',
    [
      'expo-build-properties',
      {
        android: { compileSdkVersion: 34, targetSdkVersion: 34, minSdkVersion: 24 },
      },
    ],
  ],

  extra: {
    // Compiled into the build. Point it at the deployed API before shipping an
    // APK: a reviewer cannot run the backend on their phone.
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4000/api/v1',
    eas: { projectId: process.env.EAS_PROJECT_ID ?? '' },
  },

  experiments: { typedRoutes: true },
};

export default config;

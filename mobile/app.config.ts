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
    // The file is gitignored, so it does not exist on an EAS builder. The
    // uploaded file secret arrives as an env var holding a path to it; the
    // local path is the fallback for `expo run:android` on your own machine.
    // Hard-coding the local path alone produces a cloud build with no FCM
    // config and no error to explain why push never arrives.
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
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
    // Not a secret — it identifies the project on EAS, so it belongs in the
    // repo. Hard-coded rather than read from the environment because a dynamic
    // app.config.ts is one `eas init` cannot write to, and a build that reads
    // this from an unset variable fails with an unhelpful error.
    eas: { projectId: 'e962a02b-81d7-405f-9347-4f84cde22649' },
  },

  experiments: { typedRoutes: true },
};

export default config;

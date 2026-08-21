import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { BodoniModa_500Medium_Italic } from '@expo-google-fonts/bodoni-moda';
import { Jost_400Regular, Jost_500Medium, Jost_600SemiBold } from '@expo-google-fonts/jost';
import { RobotoMono_400Regular, RobotoMono_500Medium } from '@expo-google-fonts/roboto-mono';

import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { AuthProvider, useAuth } from '../src/features/auth/AuthProvider';
import { attachHandlers } from '../src/features/push/push';
import { InAppBanner, type BannerState } from '../src/components/InAppBanner';

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

/**
 * The auth gate, plus the deep link the gate has to hold on to.
 *
 * A notification tapped from a cold start arrives before the session has been
 * restored. Navigating immediately would bounce the user to Login and lose the
 * post they were trying to open, so the target is parked until the session
 * resolves and only then followed.
 */
function Gate() {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [banner, setBanner] = useState<BannerState | null>(null);

  useEffect(() => {
    if (status === 'restoring') return;
    void SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';

    if (status === 'signedOut' && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (status === 'signedIn' && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [status, segments, router]);

  // Follow a parked deep link once, as soon as there is a session to follow it with.
  useEffect(() => {
    if (status === 'signedIn' && pending) {
      router.push(`/(app)/post/${pending}`);
      setPending(null);
    }
  }, [status, pending, router]);

  useEffect(() => {
    return attachHandlers({
      onForeground: (payload, title, body) => {
        // Rule N-7: no tray notification for the screen you are looking at.
        setBanner({ title, body, postId: payload.postId });
      },
      onOpened: (payload) => {
        if (status === 'signedIn') router.push(`/(app)/post/${payload.postId}`);
        else setPending(payload.postId);
      },
    });
  }, [status, router]);

  return (
    <>
      <Slot />
      <InAppBanner
        state={banner}
        onDismiss={() => setBanner(null)}
        onOpen={(postId) => {
          setBanner(null);
          router.push(`/(app)/post/${postId}`);
        }}
      />
    </>
  );
}

function Shell() {
  const { c, isLight } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.sky }}>
      <StatusBar style={isLight ? 'dark' : 'light'} backgroundColor={c.plate} />
      <Gate />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BodoniModa_500Medium_Italic,
    Jost_400Regular,
    Jost_500Medium,
    Jost_600SemiBold,
    RobotoMono_400Regular,
    RobotoMono_500Medium,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <Shell />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

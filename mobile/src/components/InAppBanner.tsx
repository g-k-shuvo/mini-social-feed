/**
 * The in-app banner shown when a push lands while the app is on screen.
 *
 * A system tray notification for the screen you are already looking at is
 * noise, so the foreground handler raises this instead. It slides in from the
 * top app bar, the way a delivery slip arrives, and gets out of the way on its
 * own after five seconds.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, AccessibilityInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space, type as T } from '../theme/tokens';
import { Rose } from './Icons';

export interface BannerState {
  title: string;
  body: string;
  postId: string;
}

export function InAppBanner({
  state,
  onDismiss,
  onOpen,
}: {
  state: BannerState | null;
  onDismiss: () => void;
  onOpen: (postId: string) => void;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (!state) return;

    AccessibilityInfo.announceForAccessibility?.(`${state.title}. ${state.body}`);

    Animated.timing(slide, {
      toValue: 0,
      duration: 300,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(slide, {
        toValue: -120,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => finished && onDismiss());
    }, 5000);

    return () => clearTimeout(timer);
  }, [state, slide, onDismiss]);

  if (!state) return null;

  return (
    <Animated.View
      style={[
        s.wrap,
        { top: insets.top + 6, transform: [{ translateY: slide }] },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={() => onOpen(state.postId)}
        accessibilityRole="button"
        accessibilityLabel={`${state.title}. Open the post.`}
        android_ripple={{ color: c.amberBg }}
        style={[s.card, { backgroundColor: c.plate2, borderColor: c.amber }]}
      >
        <Rose size={20} color={c.amber} />
        <View style={{ flex: 1, marginLeft: space.md }}>
          <Text numberOfLines={1} style={[T.bodySmall, { color: c.ink, fontFamily: T.label.fontFamily }]}>
            {state.title}
          </Text>
          {state.body ? (
            <Text numberOfLines={1} style={[T.figSmall, { color: c.ink2, marginTop: 2 }]}>
              {state.body}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: space.md, right: space.md, zIndex: 100 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    borderRadius: radius.sheet,
    borderLeftWidth: 3,
    borderWidth: 1,
    elevation: 6,
  },
});

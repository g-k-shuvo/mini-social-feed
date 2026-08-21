import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../../src/theme/ThemeProvider';
import { radius, space, type as T } from '../../src/theme/tokens';
import { Bell, Observer, Plate } from '../../src/components/Icons';
import { useUnreadCount } from '../../src/api/hooks';

const RAIL_WIDTH = 88;

const DESTINATIONS = [
  { name: 'index', label: 'Feed', Icon: Plate },
  { name: 'notifications', label: 'Notifications', Icon: Bell },
  { name: 'profile', label: 'Profile', Icon: Observer },
] as const;

/**
 * One component, two Material navigation patterns.
 *
 * Compact width gets the navigation bar along the bottom; expanded width gets
 * the navigation rail down the left, which is what Material asks for and what
 * stops a tablet from looking like a stretched phone.
 */
function Navigation({ state, navigation }: BottomTabBarProps) {
  const { c, isExpanded } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: unread = 0 } = useUnreadCount();

  const items = DESTINATIONS.map((d) => {
    const routeIndex = state.routes.findIndex((r) => r.name === d.name);
    const focused = state.index === routeIndex;
    const color = focused ? c.amber : c.ink2;

    return (
      <Pressable
        key={d.name}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={d.label}
        onPress={() => {
          if (!focused) navigation.navigate(d.name);
        }}
        android_ripple={{ color: c.amberBg, borderless: false }}
        style={[s.dest, isExpanded && { width: '100%', paddingVertical: space.sm }]}
      >
        <View style={[s.pill, focused && { backgroundColor: c.sel2 }]}>
          <d.Icon size={24} color={color} />
        </View>
        <Text style={[T.labelLarge, { color, marginTop: 4 }]} numberOfLines={1}>
          {d.label}
        </Text>
        {d.name === 'notifications' && unread > 0 ? (
          <View style={[s.badge, { backgroundColor: c.amber }]}>
            <Text style={[T.figSmall, { color: c.onAmber, fontSize: 10 }]}>
              {unread > 99 ? '99+' : unread}
            </Text>
          </View>
        ) : null}
      </Pressable>
    );
  });

  if (isExpanded) {
    return (
      <View
        style={[
          s.rail,
          {
            backgroundColor: c.plate,
            borderRightColor: c.rule,
            paddingTop: insets.top + space.md,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {items}
      </View>
    );
  }

  return (
    <View
      style={[
        s.bar,
        { backgroundColor: c.plate, borderTopColor: c.rule, paddingBottom: insets.bottom + 8 },
      ]}
    >
      {items}
    </View>
  );
}

export default function AppLayout() {
  const { c, isExpanded } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <Navigation {...props} />}
      sceneContainerStyle={{
        backgroundColor: c.sky,
        // The rail is absolutely positioned, so the scene has to make room.
        paddingLeft: isExpanded ? RAIL_WIDTH : 0,
      }}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Feed' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      {/* Reachable by push and by tapping a post, but never a destination. */}
      <Tabs.Screen name="post/[id]" options={{ href: null }} />
      <Tabs.Screen name="compose" options={{ href: null }} />
    </Tabs>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 6,
  },
  rail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: RAIL_WIDTH,
    borderRightWidth: 1,
    alignItems: 'center',
  },
  dest: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    minHeight: 56,
  },
  pill: {
    width: 60,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    left: '58%',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});

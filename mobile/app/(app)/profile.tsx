import React, { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/features/auth/AuthProvider';
import { inkFor, initialsOf, radius, space, type as T } from '../../src/theme/tokens';
import { useMyStats } from '../../src/api/hooks';
import { AppBar, Button, Ticks } from '../../src/components/chrome';
import { Logout } from '../../src/components/Icons';
import { hasPermission, requestPermission } from '../../src/features/push/push';

export default function Profile() {
  const { c, isLight, preference, setPreference } = useTheme();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const stats = useMyStats();

  const [pushOn, setPushOn] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    void hasPermission().then(setPushOn);
  }, []);

  if (!user) return null;

  const joined = stats.data?.user.createdAt
    ? new Date(stats.data.user.createdAt).toISOString().slice(0, 10)
    : '—';

  return (
    <View style={{ flex: 1, backgroundColor: c.sky, paddingTop: insets.top }}>
      <AppBar title="Profile" serif={false} />

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }}>
        <View style={s.header}>
          <View style={[s.disc, { backgroundColor: inkFor(user.id, isLight) }]}>
            <Text style={[T.title, { color: c.onAmber, fontFamily: T.fig.fontFamily, fontSize: 21 }]}>
              {initialsOf(user.displayName ?? user.username)}
            </Text>
          </View>
          <View style={{ marginLeft: space.lg, flex: 1 }}>
            <Text style={[T.headline, { color: c.ink }]} numberOfLines={1}>
              {user.displayName ?? user.username}
            </Text>
            <Text style={[T.fig, { color: c.ink2, marginTop: 3 }]}>@{user.username}</Text>
          </View>
        </View>

        <Ticks style={{ borderTopWidth: 1, borderTopColor: c.rule }}>
          <Row k="Posts filed" v={String(stats.data?.postCount ?? 0).padStart(2, '0')} />
          <Row k="Likes received" v={String(stats.data?.likesReceived ?? 0).padStart(3, '0')} />
          <Row k="Joined" v={joined} />
        </Ticks>

        <View style={{ height: space.lg }} />

        <View style={[s.setting, { borderBottomColor: c.rule }]}>
          <View style={{ flex: 1, paddingRight: space.md }}>
            <Text style={[T.body, { color: c.ink, fontFamily: T.label.fontFamily, fontSize: 15 }]}>
              Push notifications
            </Text>
            <Text style={[T.bodySmall, { color: c.ink2, marginTop: 3 }]}>
              {pushOn
                ? 'Get told when someone likes or replies to your posts.'
                : "Turned off in system settings. The app works fine — you just won't hear about replies."}
            </Text>
          </View>
          <Switch
            value={pushOn}
            onChange={async () => {
              if (pushOn) {
                // The app cannot revoke a granted permission; only Settings can.
                void Linking.openSettings();
                return;
              }
              const granted = await requestPermission();
              setPushOn(granted);
              if (!granted) void Linking.openSettings();
            }}
          />
        </View>

        <View style={[s.setting, { borderBottomColor: c.rule }]}>
          <View style={{ flex: 1, paddingRight: space.md }}>
            <Text style={[T.body, { color: c.ink, fontFamily: T.label.fontFamily, fontSize: 15 }]}>
              Appearance
            </Text>
            <Text style={[T.bodySmall, { color: c.ink2, marginTop: 3 }]}>
              Follows your system setting unless you pick one.
            </Text>
          </View>
          <View style={[s.segment, { borderColor: c.rule2 }]}>
            {(['light', 'system', 'dark'] as const).map((p, i) => (
              <Pressable
                key={p}
                onPress={() => setPreference(p)}
                accessibilityRole="button"
                accessibilityState={{ selected: preference === p }}
                style={[
                  s.segmentButton,
                  {
                    backgroundColor: preference === p ? c.amber : 'transparent',
                    borderRightWidth: i === 2 ? 0 : 1,
                    borderRightColor: c.rule2,
                  },
                ]}
              >
                <Text
                  style={[
                    T.label,
                    { color: preference === p ? c.onAmber : c.ink2, textTransform: 'uppercase' },
                  ]}
                >
                  {p === 'light' ? 'Plate' : p === 'dark' ? 'Sky' : 'Auto'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ padding: space.lg, paddingTop: space.xl }}>
          <Button
            title="Log out"
            variant="outlined"
            onPress={() => setConfirming(true)}
            icon={<Logout size={18} color={c.amber} />}
          />
        </View>
      </ScrollView>

      <Modal visible={confirming} transparent animationType="fade" onRequestClose={() => setConfirming(false)}>
        <Pressable style={[s.scrim, { backgroundColor: c.scrim }]} onPress={() => setConfirming(false)}>
          <Pressable style={[s.dialog, { backgroundColor: c.plate, borderColor: c.rule2 }]}>
            <Text style={[T.title, { color: c.ink }]}>Log out?</Text>
            <Text style={[T.bodySmall, { color: c.ink2, marginTop: space.sm, marginBottom: space.lg }]}>
              We&apos;ll stop sending you notifications on this device until you sign back in.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Button
                title="Stay"
                variant="text"
                onPress={() => setConfirming(false)}
                style={{ paddingHorizontal: space.lg }}
              />
              <Button
                title="Log out"
                onPress={() => {
                  setConfirming(false);
                  void signOut();
                }}
                style={{ marginLeft: space.sm, paddingHorizontal: space.lg }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  const { c } = useTheme();
  return (
    <View style={[s.readout, { borderBottomColor: c.rule }]}>
      <Text style={[T.label, { color: c.ink2, textTransform: 'uppercase' }]}>{k}</Text>
      <Text style={[T.fig, { color: c.ink, marginLeft: 'auto' }]}>{v}</Text>
    </View>
  );
}

/** Material's switch, themed. The thumb grows on the transform, not on width. */
function Switch({ value, onChange }: { value: boolean; onChange: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onChange}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel="Push notifications"
      hitSlop={8}
      style={[
        s.switch,
        { backgroundColor: value ? c.amber : c.plate2, borderColor: value ? c.amber : c.rule2 },
      ]}
    >
      <View
        style={[
          s.thumb,
          {
            backgroundColor: value ? c.onAmber : c.ink2,
            transform: [{ translateX: value ? 24 : 4 }, { scale: value ? 1 : 0.667 }],
          },
        ]}
      />
    </Pressable>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: space.lg, paddingVertical: 22 },
  disc: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  readout: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: 10,
    paddingHorizontal: space.lg,
    borderBottomWidth: 1,
  },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.lg,
    borderBottomWidth: 1,
    minHeight: 72,
  },
  segment: { flexDirection: 'row', borderWidth: 1, borderRadius: radius.cell, overflow: 'hidden' },
  segmentButton: { minHeight: 44, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' },
  switch: {
    width: 52,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
  },
  thumb: { width: 24, height: 24, borderRadius: 12 },
  scrim: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  dialog: { width: '100%', maxWidth: 400, borderWidth: 1, borderRadius: radius.sheet, padding: 22 },
});

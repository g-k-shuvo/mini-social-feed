/**
 * The shared chrome of the plate: app bar, coordinate band, ruled cells,
 * buttons, and the four states every data surface owes.
 */
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { HIT, radius, space, type as T } from '../theme/tokens';
import { CloudOff, Warn } from './Icons';

/* ------------------------------------------------------------- primitives */

export function Label({ children, quiet }: { children: React.ReactNode; quiet?: boolean }) {
  const { c } = useTheme();
  return (
    <Text style={[T.label, { color: quiet ? c.ink2 : c.amber, textTransform: 'uppercase' }]}>
      {children}
    </Text>
  );
}

export function Fig({ children, color }: { children: React.ReactNode; color?: string }) {
  const { c } = useTheme();
  return <Text style={[T.fig, { color: color ?? c.ink }]}>{children}</Text>;
}

export function Hair() {
  const { c } = useTheme();
  return <View style={{ height: 1, backgroundColor: c.rule }} />;
}

/** The plate's registration marks — the corner ticks the chart world uses. */
export function Ticks({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const tick: ViewStyle = {
    position: 'absolute',
    width: 7,
    height: 7,
    borderColor: c.amber,
    opacity: 0.55,
    top: 0,
  };
  return (
    <View style={style}>
      {children}
      <View pointerEvents="none" style={[tick, { left: 0, borderLeftWidth: 1, borderTopWidth: 1 }]} />
      <View pointerEvents="none" style={[tick, { right: 0, borderRightWidth: 1, borderTopWidth: 1 }]} />
    </View>
  );
}

/* --------------------------------------------------------------- app bar */

export function AppBar({
  title,
  left,
  right,
  serif = true,
}: {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  serif?: boolean;
}) {
  const { c } = useTheme();
  return (
    <View
      style={[
        s.appbar,
        { backgroundColor: c.plate, borderBottomColor: c.rule, paddingLeft: left ? 4 : space.lg },
      ]}
    >
      {left}
      <Text
        numberOfLines={1}
        style={[serif ? T.title : T.body, { color: c.ink, flex: 1, marginLeft: left ? 4 : 0 }]}
      >
        {title}
      </Text>
      {right}
    </View>
  );
}

export function IconButton({
  onPress,
  children,
  label,
}: {
  onPress?: () => void;
  children: React.ReactNode;
  label: string;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      android_ripple={{ color: c.amberBg, borderless: true, radius: 24 }}
      style={s.iconButton}
      hitSlop={6}
    >
      {children}
    </Pressable>
  );
}

/* ---------------------------------------------------- the coordinate band */

export function Band({ cells }: { cells: { label: string; value: string }[] }) {
  const { c } = useTheme();
  return (
    <Ticks style={{ flexDirection: 'row', backgroundColor: c.plate, borderBottomWidth: 1, borderBottomColor: c.rule2 }}>
      {cells.map((cell, i) => (
        <View
          key={cell.label}
          style={{
            flex: 1,
            paddingVertical: 7,
            paddingHorizontal: space.md,
            borderRightWidth: i === cells.length - 1 ? 0 : 1,
            borderRightColor: c.rule,
          }}
        >
          <Label>{cell.label}</Label>
          <Text numberOfLines={1} style={[T.fig, { color: c.ink, marginTop: 3 }]}>
            {cell.value}
          </Text>
        </View>
      ))}
    </Ticks>
  );
}

/* ---------------------------------------------------------------- buttons */

export function Button({
  title,
  onPress,
  disabled,
  loading,
  variant = 'filled',
  icon,
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'filled' | 'outlined' | 'text';
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  const off = disabled || loading;

  const bg = variant === 'filled' ? c.amber : 'transparent';
  const fg = variant === 'filled' ? c.onAmber : variant === 'outlined' ? c.amber : c.ink2;

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off }}
      android_ripple={{ color: variant === 'filled' ? 'rgba(0,0,0,0.16)' : c.amberBg }}
      style={[
        s.button,
        {
          backgroundColor: bg,
          borderWidth: variant === 'outlined' ? 1 : 0,
          borderColor: c.amber,
          opacity: off ? 0.38 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[T.label, { color: fg, marginLeft: icon ? space.sm : 0 }]}>
            {title.toUpperCase()}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/* ------------------------------------------------------------ four states */

export function OfflineBar() {
  const { c } = useTheme();
  return (
    <View
      style={[
        s.offline,
        { backgroundColor: c.amberBg, borderColor: c.amber },
      ]}
    >
      <CloudOff color={c.amber} />
      <Text style={[T.label, { color: c.amber, marginLeft: space.sm }]}>
        OFFLINE — YOU&apos;RE READING CACHED POSTS
      </Text>
    </View>
  );
}

export function Blank({
  glyph,
  title,
  body,
  action,
}: {
  glyph: React.ReactNode;
  title: string;
  body: string;
  action?: { label: string; onPress: () => void; variant?: 'filled' | 'outlined' };
}) {
  const { c } = useTheme();
  return (
    <View style={s.blank}>
      <View style={{ opacity: 0.85 }}>{glyph}</View>
      <Text style={[T.headline, { color: c.ink, textAlign: 'center', marginTop: space.md }]}>
        {title}
      </Text>
      <Text
        style={[
          T.bodySmall,
          { color: c.ink2, textAlign: 'center', marginTop: space.sm, maxWidth: 300 },
        ]}
      >
        {body}
      </Text>
      {action ? (
        <Button
          title={action.label}
          onPress={action.onPress}
          variant={action.variant ?? 'filled'}
          style={{ marginTop: space.lg, paddingHorizontal: space.xl, alignSelf: 'center' }}
        />
      ) : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { c } = useTheme();
  return (
    <Blank
      glyph={<Warn size={30} color={c.amber} />}
      title="The plate didn't load"
      body={message}
      action={{ label: 'Try again', onPress: onRetry }}
    />
  );
}

/** Skeletons match the real card geometry, so nothing shifts on arrival. */
export function FeedSkeleton() {
  const { c } = useTheme();
  const bar = (w: string | number, mb = 9) => (
    <View style={{ height: 11, width: w as number, backgroundColor: c.skeleton, marginBottom: mb }} />
  );
  return (
    <View>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={[s.skeletonRow, { borderBottomColor: c.rule }]}>
          <View style={{ width: 44, alignItems: 'center', paddingTop: 6 }}>
            <View
              style={{
                width: 10 + (i % 3) * 2,
                height: 10 + (i % 3) * 2,
                borderRadius: 8,
                backgroundColor: c.skeleton,
              }}
            />
          </View>
          <View style={{ flex: 1, paddingRight: space.lg }}>
            {bar(`${38 + (i % 3) * 9}%` as unknown as number)}
            {bar(`${88 - (i % 3) * 12}%` as unknown as number)}
            {bar(`${54 + (i % 2) * 18}%` as unknown as number, 14)}
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: 78, height: 34, backgroundColor: c.skeleton, marginRight: 8 }} />
              <View style={{ width: 78, height: 34, backgroundColor: c.skeleton }} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  appbar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 4,
    borderBottomWidth: 1,
  },
  iconButton: {
    width: HIT,
    height: HIT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: HIT / 2,
  },
  button: {
    minHeight: HIT,
    borderRadius: radius.cell,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: space.lg,
  },
  offline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: space.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  blank: {
    paddingVertical: 54,
    paddingHorizontal: 34,
    alignItems: 'center',
  },
  skeletonRow: {
    flexDirection: 'row',
    paddingTop: 13,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
});

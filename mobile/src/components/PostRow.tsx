/**
 * A post as a charted object.
 *
 * The mark's diameter is the like count on a fixed five-step magnitude ramp,
 * so hierarchy lives in the marks and the feed needs no card, no avatar disc,
 * and no row of ghost icons. The counts sit in fixed-width ruled cells so a
 * number holds the same column all the way down the list.
 */
import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AXIS_X, HIT, magnitude, offsetOf, radius, space, type as T } from '../theme/tokens';
import { Reply, StarMark } from './Icons';
import Svg, { Line } from 'react-native-svg';
import type { Post } from '../api/types';
import { relativeTime } from '../lib/time';

interface Props {
  post: Post;
  onOpen: (id: string) => void;
  onLike: (id: string) => void;
  selected?: boolean;
  dimmed?: boolean;
  /** Offset of the next object down, so this row can draw the segment of the
   *  constellation that reaches it. Undefined on the last row. */
  nextDx?: number;
}

function PostRowInner({ post, onOpen, onLike, selected, dimmed, nextDx }: Props) {
  const { c } = useTheme();
  const size = magnitude(post.likeCount);
  const dx = offsetOf(post.id);

  /** The acquisition pulse: one ring out, once, when a like lands. */
  const pulse = useRef(new Animated.Value(0)).current;
  const wasLiked = useRef(post.likedByMe);

  useEffect(() => {
    if (post.likedByMe && !wasLiked.current) {
      pulse.setValue(0);
      Animated.timing(pulse, {
        toValue: 1,
        duration: 520,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }).start();
    }
    wasLiked.current = post.likedByMe;
  }, [post.likedByMe, pulse]);

  const surface = selected ? c.sel : 'transparent';

  return (
    <View
      style={[
        s.row,
        { borderBottomColor: c.rule, backgroundColor: surface, opacity: dimmed ? 0.74 : 1 },
      ]}
    >
      {/* This row's segment of the constellation: from its own mark down to
          wherever the next mark sits. Together the segments make one unbroken
          dotted figure rather than a straight rule beside the marks. */}
      {nextDx !== undefined ? (
        <Svg style={s.thread} pointerEvents="none">
          <Line
            x1={AXIS_X + dx}
            y1={25}
            x2={AXIS_X + nextDx}
            y2="100%"
            stroke={c.axis}
            strokeWidth={1}
            strokeDasharray="2 3"
            strokeLinecap="round"
          />
        </Svg>
      ) : null}

      <View style={s.mark}>
        <Animated.View
          pointerEvents="none"
          style={[
            s.pulse,
            {
              borderColor: c.amber,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 0] }),
              transform: [
                { translateX: dx },
                { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 2.4] }) },
              ],
            },
          ]}
        />
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: c.star,
            borderWidth: 3,
            borderColor: selected ? c.sel : c.sky,
            transform: [{ translateX: dx }],
          }}
        />
        {selected ? (
          <View style={[s.reticle, { borderColor: c.amber, transform: [{ translateX: dx }] }]} pointerEvents="none" />
        ) : null}
      </View>

      <View style={{ flex: 1, paddingRight: space.lg }}>
        <Pressable
          onPress={() => onOpen(post.id)}
          accessibilityRole="button"
          accessibilityLabel={`Open post by ${post.author.username}`}
          android_ripple={{ color: c.amberBg }}
          style={{ paddingBottom: space.md }}
        >
          <View style={s.head}>
            <Text style={[T.who, { color: c.ink }]} numberOfLines={1}>
              {post.author.displayName ?? post.author.username}
            </Text>
            <Text style={[T.figSmall, { color: c.ink2, marginLeft: space.sm }]}>
              @{post.author.username}
            </Text>
            <Text style={[T.figSmall, { color: c.ink2, marginLeft: 'auto' }]}>
              {relativeTime(post.createdAt)}
            </Text>
          </View>
          <Text style={[T.body, { color: c.ink, marginTop: 3 }]}>{post.content}</Text>
        </Pressable>

        <View style={{ flexDirection: 'row' }}>
          <Cell
            onPress={() => onLike(post.id)}
            active={post.likedByMe}
            label={`${post.likedByMe ? 'Unlike' : 'Like'}, ${post.likeCount} likes`}
            icon={
              <StarMark
                color={post.likedByMe ? c.amber : c.ink2}
                filled={post.likedByMe}
              />
            }
            value={post.likeCount}
          />
          <Cell
            onPress={() => onOpen(post.id)}
            label={`${post.commentCount} replies`}
            icon={<Reply color={c.ink2} />}
            value={post.commentCount}
          />
        </View>
      </View>
    </View>
  );
}

export function Cell({
  onPress,
  icon,
  value,
  active,
  label,
  wide,
}: {
  onPress?: () => void;
  icon: React.ReactNode;
  value: number;
  active?: boolean;
  label: string;
  wide?: boolean;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      android_ripple={{ color: c.amberBg }}
      style={[
        s.cell,
        {
          width: wide ? 96 : 78,
          height: wide ? 40 : 34,
          borderColor: active ? c.amber : c.rule,
          marginRight: space.sm,
        },
      ]}
    >
      {icon}
      <Text style={[T.fig, { color: active ? c.amber : c.ink2, marginLeft: 7 }]}>{value}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingTop: 13,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  thread: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 44 },
  mark: {
    width: 44,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
  },
  reticle: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
  },
  head: { flexDirection: 'row', alignItems: 'baseline' },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.sm,
    borderWidth: 1,
    borderRadius: radius.cell,
    minHeight: 34,
  },
});

/** The feed re-renders on every like; only the changed row should follow. */
export const PostRow = memo(
  PostRowInner,
  (a, b) =>
    a.post.id === b.post.id &&
    a.post.likedByMe === b.post.likedByMe &&
    a.post.likeCount === b.post.likeCount &&
    a.post.commentCount === b.post.commentCount &&
    a.selected === b.selected &&
    a.dimmed === b.dimmed &&
    a.nextDx === b.nextDx,
);

export { HIT };

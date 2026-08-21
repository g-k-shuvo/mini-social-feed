import React, { useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { inkFor, initialsOf, space, type as T } from '../../src/theme/tokens';
import { useMarkRead, useNotifications, useUnreadCount } from '../../src/api/hooks';
import { AppBar, Band, Blank, ErrorState, FeedSkeleton, IconButton } from '../../src/components/chrome';
import { Bell, Refresh } from '../../src/components/Icons';
import { clockNow, relativeTime } from '../../src/lib/time';

export default function Notifications() {
  const { c, isLight } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const list = useNotifications();
  const { data: unread = 0 } = useUnreadCount();
  const markRead = useMarkRead();

  const rows = useMemo(() => list.data?.pages.flatMap((p) => p.data) ?? [], [list.data]);

  return (
    <View style={{ flex: 1, backgroundColor: c.sky, paddingTop: insets.top }}>
      <AppBar
        title="Notifications"
        serif={false}
        right={
          rows.length > 0 ? (
            <IconButton label="Mark all read" onPress={() => markRead.mutate({ all: true })}>
              <Refresh size={22} color={c.ink} />
            </IconButton>
          ) : undefined
        }
      />

      <Band
        cells={[
          { label: 'Unread', value: String(unread).padStart(2, '0') },
          { label: 'Total', value: String(rows.length).padStart(2, '0') },
          { label: 'Checked', value: clockNow() },
        ]}
      />

      {list.isLoading ? (
        <FeedSkeleton />
      ) : list.isError ? (
        <ErrorState
          message="We couldn't load your notifications."
          onRetry={() => void list.refetch()}
        />
      ) : rows.length === 0 ? (
        <Blank
          glyph={<Bell size={30} color={c.amber} />}
          title="Nothing yet"
          body="When someone likes or replies to your posts, it lands here."
        />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(n) => n.id}
          onEndReachedThreshold={1.5}
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
          }}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefetching}
              onRefresh={() => void list.refetch()}
              tintColor={c.amber}
              colors={[c.amber]}
              progressBackgroundColor={c.plate}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                if (!item.read) markRead.mutate({ ids: [item.id] });
                router.push(`/(app)/post/${item.postId}`);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${item.actor.username} ${item.type === 'LIKE' ? 'liked' : 'replied to'} your post`}
              android_ripple={{ color: c.amberBg }}
              style={[
                s.row,
                {
                  borderBottomColor: c.rule,
                  // Unread is a surface change plus a mark, never colour alone.
                  backgroundColor: item.read ? 'transparent' : c.sel2,
                },
              ]}
            >
              <View style={s.markCol}>
                {!item.read ? <View style={[s.unreadDot, { backgroundColor: c.amber }]} /> : null}
                <View style={[s.disc, { backgroundColor: inkFor(item.actor.id, isLight) }]}>
                  <Text style={[T.figSmall, { color: c.onAmber }]}>
                    {initialsOf(item.actor.displayName ?? item.actor.username)}
                  </Text>
                </View>
              </View>

              <View style={{ flex: 1, paddingRight: space.sm }}>
                <Text style={[T.bodySmall, { color: c.ink }]}>
                  <Text style={[T.who, { color: c.ink, fontSize: 15 }]}>
                    {item.actor.displayName ?? item.actor.username}
                  </Text>
                  {item.type === 'LIKE' ? ' liked your post' : ' replied to your post'}
                </Text>
                <Text numberOfLines={1} style={[T.figSmall, { color: c.ink2, marginTop: 3 }]}>
                  {item.preview}
                </Text>
              </View>

              <Text style={[T.figSmall, { color: c.ink2 }]}>{relativeTime(item.createdAt)}</Text>
            </Pressable>
          )}
          contentContainerStyle={{ paddingBottom: space.xl }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 13,
    paddingRight: space.lg,
    borderBottomWidth: 1,
    minHeight: 64,
  },
  markCol: { width: 44, alignItems: 'center', paddingTop: 2 },
  unreadDot: { position: 'absolute', left: 7, top: 12, width: 6, height: 6, borderRadius: 3 },
  disc: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});

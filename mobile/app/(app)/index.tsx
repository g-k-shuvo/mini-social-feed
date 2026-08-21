import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { space, type as T, inkFor, radius } from '../../src/theme/tokens';
import { useFeed, usePeople, useToggleLike } from '../../src/api/hooks';
import { PostRow } from '../../src/components/PostRow';
import { AppBar, Band, Blank, Button, ErrorState, FeedSkeleton, IconButton } from '../../src/components/chrome';
import { Filter, Reticle, Rose } from '../../src/components/Icons';
import { clockNow, epochOf } from '../../src/lib/time';
import { ApiError } from '../../src/api/client';
import type { Post, SessionUser } from '../../src/api/types';
import { PostDetailPane } from '../../src/features/post/PostDetailPane';

type Row = { kind: 'epoch'; key: string; label: string } | { kind: 'post'; key: string; post: Post };

export default function Feed() {
  const { c, isExpanded } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [filter, setFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const feed = useFeed(filter ?? undefined);
  const like = useToggleLike();
  const { data: people = [] } = usePeople('');

  const posts = useMemo(
    () => feed.data?.pages.flatMap((p) => p.data) ?? [],
    [feed.data],
  );

  /** Time blocks get a real void between them, not a uniform gutter. */
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let last: string | null = null;
    for (const post of posts) {
      const epoch = epochOf(post.createdAt);
      if (epoch !== last) {
        out.push({ kind: 'epoch', key: `epoch-${epoch}`, label: epoch });
        last = epoch;
      }
      out.push({ kind: 'post', key: post.id, post });
    }
    return out;
  }, [posts]);

  const open = useCallback(
    (id: string) => {
      // Expanded width fills the right pane instead of pushing a new screen —
      // the list never disappears on a tablet.
      if (isExpanded) setSelected(id);
      else router.push(`/(app)/post/${id}`);
    },
    [isExpanded, router],
  );

  const onLike = useCallback((id: string) => like.mutate(id), [like]);

  const listHeader = (
    <>
      <Band
        cells={[
          { label: 'Scope', value: filter ? `@${filter}` : 'All sky' },
          { label: 'Objects', value: String(posts.length).padStart(3, '0') },
          { label: 'Updated', value: clockNow() },
        ]}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.rail}
        style={{ backgroundColor: c.sky, borderBottomWidth: 1, borderBottomColor: c.rule }}
      >
        <Chip label="All sky" active={!filter} onPress={() => setFilter(null)} />
        {people.map((p: SessionUser) => (
          <Chip
            key={p.id}
            label={`@${p.username}`}
            dot={inkFor(p.id, false)}
            active={filter === p.username}
            onPress={() => {
              setFilter(p.username);
              setSelected(null);
            }}
          />
        ))}
      </ScrollView>
    </>
  );

  const body = () => {
    if (feed.isLoading) return <FeedSkeleton />;

    if (feed.isError) {
      const err = feed.error;
      return (
        <ErrorState
          message={
            err instanceof ApiError && (err.code === 'NETWORK' || err.code === 'TIMEOUT')
              ? err.message
              : "The server didn't answer. Your connection looks fine, so this one is on us."
          }
          onRetry={() => void feed.refetch()}
        />
      );
    }

    if (posts.length === 0) {
      return filter ? (
        <Blank
          glyph={<Reticle size={30} color={c.amber} />}
          title={`Nothing from @${filter} yet`}
          body="They haven't posted anything. Clear the filter to see the whole sky."
          action={{ label: 'Clear filter', onPress: () => setFilter(null), variant: 'outlined' }}
        />
      ) : (
        <Blank
          glyph={<Rose size={30} color={c.amber} />}
          title="The sky is empty"
          body="No posts yet. Be the first — say something first."
          action={{ label: 'Write a post', onPress: () => router.push('/(app)/compose') }}
        />
      );
    }

    return (
      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        renderItem={({ item }) =>
          item.kind === 'epoch' ? (
            <View style={s.epoch}>
              <Text style={[T.label, { color: c.amber, textTransform: 'uppercase' }]}>
                {item.label}
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: c.rule, marginLeft: space.md }} />
            </View>
          ) : (
            <PostRow
              post={item.post}
              onOpen={open}
              onLike={onLike}
              selected={isExpanded && selected === item.post.id}
              dimmed={isExpanded && selected !== null && selected !== item.post.id}
            />
          )
        }
        // The unbroken filing axis: one dotted constellation line joining every
        // mark down the whole feed.
        ListHeaderComponent={<View style={{ height: 1 }} />}
        // Prefetch two screens early so the next page is already there.
        onEndReachedThreshold={2}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            refreshing={feed.isRefetching && !feed.isFetchingNextPage}
            onRefresh={() => void feed.refetch()}
            tintColor={c.amber}
            colors={[c.amber]}
            progressBackgroundColor={c.plate}
          />
        }
        // Room to scroll clear of the floating action button.
        contentContainerStyle={{ paddingBottom: 96 }}
        // Transparent, so the axis behind it stays visible.
        style={{ backgroundColor: 'transparent' }}
      />
    );
  };

  const list = (
    <View style={{ flex: 1 }}>
      <AppBar
        title="Mini Social Feed"
        left={
          <View style={{ width: 44, alignItems: 'center' }}>
            <Rose size={24} color={c.amber} />
          </View>
        }
        right={
          isExpanded ? undefined : (
            <IconButton label="Filter by author" onPress={() => undefined}>
              <Filter size={23} color={c.ink} />
            </IconButton>
          )
        }
      />
      {listHeader}
      <View style={{ flex: 1 }}>
        {/* The filing axis: one dotted line behind the whole list, joining
            every magnitude mark. Absolute, so it never indents the content. */}
        {posts.length > 0 ? (
          <View
            pointerEvents="none"
            style={[s.axis, { borderLeftColor: c.axis }]}
          />
        ) : null}
        {body()}
      </View>
    </View>
  );

  if (isExpanded) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: c.sky, paddingTop: insets.top }}>
        {/* The FAB lives over the list pane, never over the detail pane's
            reply bar. */}
        <View style={[s.pane, { borderRightColor: c.rule2 }]}>
          {list}
          <Fab onPress={() => router.push('/(app)/compose')} />
        </View>
        <View style={{ flex: 1 }}>
          <PostDetailPane postId={selected} onClose={() => setSelected(null)} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.sky, paddingTop: insets.top }}>
      {list}
      <Fab onPress={() => router.push('/(app)/compose')} />
    </View>
  );
}

function Fab({ onPress }: { onPress: () => void }) {
  const { c, isExpanded } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="New post"
      android_ripple={{ color: 'rgba(0,0,0,0.2)', borderless: false, radius: 28 }}
      style={[
        s.fab,
        { backgroundColor: c.amber, bottom: isExpanded ? space.xl : 24, right: space.lg },
      ]}
    >
      <Rose size={26} color={c.onAmber} />
    </Pressable>
  );
}

function Chip({
  label,
  active,
  onPress,
  dot,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  dot?: string;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      android_ripple={{ color: c.amberBg }}
      style={[
        s.chip,
        {
          backgroundColor: active ? c.amber : 'transparent',
          borderColor: active ? c.amber : c.rule2,
        },
      ]}
    >
      {dot ? <View style={[s.chipDot, { backgroundColor: active ? c.onAmber : dot }]} /> : null}
      <Text style={[T.labelLarge, { color: active ? c.onAmber : c.ink2, textTransform: 'uppercase' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  rail: { paddingHorizontal: space.lg, paddingVertical: 11, gap: space.sm },
  chip: {
    minHeight: 40,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderRadius: radius.cell,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipDot: { width: 6, height: 6, borderRadius: 3, marginRight: 7 },
  epoch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 26,
    paddingBottom: 9,
    paddingHorizontal: space.lg,
  },
  axis: {
    position: 'absolute',
    left: 27,
    top: 0,
    bottom: 0,
    width: 0,
    borderLeftWidth: 1,
    borderStyle: 'dotted',
  },
  pane: { width: 420, borderRightWidth: 1 },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
});

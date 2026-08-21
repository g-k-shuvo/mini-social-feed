/**
 * One post opened, with its replies.
 *
 * The same component serves the phone's own screen and the tablet's right
 * pane, so the two can never drift apart. `wide` only widens the measure and
 * the padding — it never changes what is on screen.
 *
 * The readout table is the chart world's data block, carrying real facts:
 * when it was filed, its magnitude, how many replies, who wrote it.
 */
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, space, type as T } from '../../theme/tokens';
import { useAddComment, useComments, usePost, useToggleLike } from '../../api/hooks';
import { AppBar, Blank, ErrorState, IconButton, Ticks } from '../../components/chrome';
import { Cell } from '../../components/PostRow';
import { Back, Reply, Reticle, Send, StarMark } from '../../components/Icons';
import { filedAt, relativeTime } from '../../lib/time';
import type { Comment } from '../../api/types';

export function PostDetailPane({
  postId,
  onClose,
  onBack,
  wide = true,
}: {
  postId: string | null;
  onClose?: () => void;
  onBack?: () => void;
  wide?: boolean;
}) {
  const { c } = useTheme();
  const post = usePost(postId);
  const comments = useComments(postId);
  const like = useToggleLike();
  const addComment = useAddComment(postId ?? '');
  const [draft, setDraft] = useState('');

  const rows = useMemo<Comment[]>(
    () => comments.data?.pages.flatMap((p) => p.data) ?? [],
    [comments.data],
  );

  if (!postId) {
    return (
      <View style={{ flex: 1, backgroundColor: c.sky }}>
        <AppBar title="" />
        <Blank
          glyph={<Reticle size={32} color={c.amber} />}
          title="Pick an object"
          body="Choose a post on the left and it opens here — the list never gets pushed off screen."
        />
      </View>
    );
  }

  if (post.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.sky }}>
        <AppBar title="Post" left={onBack ? <BackButton onPress={onBack} /> : undefined} />
        <View style={s.centre}>
          <ActivityIndicator color={c.amber} />
        </View>
      </View>
    );
  }

  if (post.isError || !post.data) {
    return (
      <View style={{ flex: 1, backgroundColor: c.sky }}>
        <AppBar title="Post" left={onBack ? <BackButton onPress={onBack} /> : undefined} />
        <ErrorState message="That post could not be loaded." onRetry={() => void post.refetch()} />
      </View>
    );
  }

  const p = post.data;
  const pad = wide ? 30 : space.lg;
  const canSend = draft.trim().length > 0 && !addComment.isPending;

  const send = () => {
    if (!canSend) return;
    const content = draft.trim();
    setDraft('');
    addComment.mutate(content, { onError: () => setDraft(content) });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.sky }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppBar
        title="Post"
        left={onBack ? <BackButton onPress={onBack} /> : undefined}
        right={
          onClose ? (
            <IconButton label="Close" onPress={onClose}>
              <Reticle size={22} color={c.ink} />
            </IconButton>
          ) : undefined
        }
      />

      <FlatList
        data={rows}
        keyExtractor={(x) => x.id}
        style={{ flex: 1 }}
        onEndReachedThreshold={1.5}
        onEndReached={() => {
          if (comments.hasNextPage && !comments.isFetchingNextPage) void comments.fetchNextPage();
        }}
        ListHeaderComponent={
          <View>
            <View style={{ paddingHorizontal: pad, paddingTop: 20, paddingBottom: space.lg, maxWidth: wide ? 660 : undefined }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={[T.headline, { color: c.ink }]}>
                  {p.author.displayName ?? p.author.username}
                </Text>
                <Text style={[T.figSmall, { color: c.ink2, marginLeft: space.md }]}>
                  @{p.author.username}
                </Text>
              </View>
              <Text style={[T.body, { color: c.ink, fontSize: wide ? 20 : 18, lineHeight: wide ? 32 : 29, marginTop: space.md }]}>
                {p.content}
              </Text>
            </View>

            <Ticks style={{ borderTopWidth: 1, borderTopColor: c.rule, maxWidth: wide ? 660 : undefined }}>
              <Readout k="Filed" v={filedAt(p.createdAt)} pad={pad} />
              <Readout k="Magnitude" v={`${p.likeCount} ${p.likeCount === 1 ? 'like' : 'likes'}`} pad={pad} />
              <Readout k="Replies" v={String(p.commentCount)} pad={pad} />
              <Readout k="Author" v={p.author.displayName ?? p.author.username} pad={pad} serif />
            </Ticks>

            <View style={{ flexDirection: 'row', paddingHorizontal: pad, paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: c.rule }}>
              <Cell
                wide
                onPress={() => like.mutate(p.id)}
                active={p.likedByMe}
                label={`${p.likedByMe ? 'Unlike' : 'Like'}, ${p.likeCount} likes`}
                icon={<StarMark size={21} color={p.likedByMe ? c.amber : c.ink2} filled={p.likedByMe} />}
                value={p.likeCount}
              />
              <Cell
                wide
                label={`${p.commentCount} replies`}
                icon={<Reply size={21} color={c.ink2} />}
                value={p.commentCount}
              />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: pad, paddingTop: 20, paddingBottom: 10 }}>
              <Text style={[T.label, { color: c.amber, textTransform: 'uppercase' }]}>Replies</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: c.rule, marginLeft: space.md }} />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[s.reply, { borderBottomColor: c.rule, paddingHorizontal: pad }]}>
            <View style={{ width: 18, paddingTop: 8 }}>
              <View style={{ width: 9, height: 1, backgroundColor: c.rule2 }} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={[T.who, { color: c.ink, fontSize: 15 }]}>
                  {item.author.displayName ?? item.author.username}
                </Text>
                <Text style={[T.figSmall, { color: c.ink2, marginLeft: space.sm }]}>
                  @{item.author.username}
                </Text>
                <Text style={[T.figSmall, { color: c.ink2, marginLeft: 'auto' }]}>
                  {relativeTime(item.createdAt)}
                </Text>
              </View>
              <Text style={[T.bodySmall, { color: c.ink, marginTop: 2 }]}>{item.content}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          comments.isLoading ? (
            <View style={s.centre}>
              <ActivityIndicator color={c.amber} />
            </View>
          ) : (
            <Blank
              glyph={<Reply size={26} color={c.amber} />}
              title="No replies yet"
              body="Be the first to answer."
            />
          )
        }
        contentContainerStyle={{ paddingBottom: space.md }}
      />

      <View style={[s.replyBar, { backgroundColor: c.plate, borderTopColor: c.rule, paddingHorizontal: wide ? 26 : 14 }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Write a reply"
          placeholderTextColor={c.ink2}
          selectionColor={c.amber}
          cursorColor={c.amber}
          returnKeyType="send"
          onSubmitEditing={send}
          maxLength={300}
          style={[T.body, s.replyInput, { color: c.ink, borderColor: c.rule2 }]}
        />
        <Pressable
          onPress={send}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send reply"
          android_ripple={{ color: 'rgba(0,0,0,0.2)' }}
          style={[s.send, { backgroundColor: c.amber, opacity: canSend ? 1 : 0.35 }]}
        >
          <Send color={c.onAmber} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  const { c } = useTheme();
  return (
    <IconButton label="Back" onPress={onPress}>
      <Back size={23} color={c.ink} />
    </IconButton>
  );
}

function Readout({ k, v, pad, serif }: { k: string; v: string; pad: number; serif?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={[s.readoutRow, { borderBottomColor: c.rule, paddingHorizontal: pad }]}>
      <Text style={[T.label, { color: c.ink2, textTransform: 'uppercase' }]}>{k}</Text>
      <Text style={[serif ? T.who : T.fig, { color: c.ink, marginLeft: 'auto' }]}>{v}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  centre: { paddingVertical: 48, alignItems: 'center' },
  readoutRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  reply: {
    flexDirection: 'row',
    paddingTop: 11,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  replyInput: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.cell,
    paddingHorizontal: space.md,
    paddingVertical: 11,
    marginRight: space.sm,
  },
  send: {
    width: 48,
    height: 48,
    borderRadius: radius.cell,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

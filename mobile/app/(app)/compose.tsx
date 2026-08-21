import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { radius, space, type as T } from '../../src/theme/tokens';
import { useCreatePost } from '../../src/api/hooks';
import { Button, IconButton } from '../../src/components/chrome';
import { Close, Warn } from '../../src/components/Icons';
import { ApiError } from '../../src/api/client';

const MAX = 500;
const NEAR = 450;

/**
 * The count cell has four states and they are four different *forms*, not four
 * tints of one colour: hairline outline, amber outline, amber fill, and a
 * dashed outline with a warning glyph. Someone who cannot separate the hues
 * still sees which one they are in.
 */
type CountState = 'under' | 'near' | 'over' | 'failed';

export default function Compose() {
  const { c } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const createPost = useCreatePost();

  const [draft, setDraft] = useState('');
  const [failed, setFailed] = useState<string | null>(null);

  const len = draft.length;
  const state: CountState = failed ? 'failed' : len > MAX ? 'over' : len >= NEAR ? 'near' : 'under';
  const canPost = draft.trim().length > 0 && len <= MAX && !createPost.isPending;

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)');
  };

  const submit = () => {
    if (!canPost) return;
    setFailed(null);
    createPost.mutate(draft.trim(), {
      onSuccess: close,
      onError: (err) =>
        setFailed(
          err instanceof ApiError
            ? err.message
            : "Couldn't send — your post is safe here. Try again when you're back.",
        ),
    });
  };

  const cellStyle =
    state === 'over'
      ? { backgroundColor: c.amber, borderColor: c.amber }
      : state === 'failed'
        ? { borderColor: c.amber, borderStyle: 'dashed' as const, backgroundColor: c.amberBg }
        : state === 'near'
          ? { borderColor: c.amber }
          : { borderColor: c.rule2 };

  const cellFg = state === 'over' ? c.onAmber : state === 'under' ? c.ink2 : c.amber;

  return (
    <KeyboardAvoidingView
      style={[s.wrap, { backgroundColor: c.scrim }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Pressable style={s.scrim} onPress={close} accessibilityLabel="Close" />

      <View
        style={[
          s.sheet,
          { backgroundColor: c.plate, borderTopColor: c.amber, paddingBottom: insets.bottom + space.lg },
        ]}
      >
        <View style={[s.grip, { backgroundColor: c.rule2 }]} />

        <View style={s.head}>
          <Text style={[T.title, { color: c.ink, flex: 1 }]}>New post</Text>
          <IconButton label="Close" onPress={close}>
            <Close size={21} color={c.ink} />
          </IconButton>
        </View>

        <View style={{ paddingHorizontal: space.lg }}>
          <TextInput
            value={draft}
            onChangeText={(t) => {
              setDraft(t);
              // Editing clears the failure: the state describes the last
              // attempt, not the text in front of you now.
              if (failed) setFailed(null);
            }}
            placeholder="Say something first."
            placeholderTextColor={c.ink2}
            selectionColor={c.amber}
            cursorColor={c.amber}
            multiline
            autoFocus
            textAlignVertical="top"
            style={[T.body, s.input, { color: c.ink, borderColor: c.rule2 }]}
          />

          {failed ? (
            <View style={s.error}>
              <Warn size={15} color={c.amber} />
              <Text style={[T.bodySmall, { color: c.amber, marginLeft: 6, flex: 1 }]}>{failed}</Text>
            </View>
          ) : null}
        </View>

        <View style={s.foot}>
          <View style={[s.countCell, cellStyle]}>
            {state === 'failed' ? <Warn size={14} color={c.amber} /> : null}
            <Text
              style={[
                T.label,
                { color: cellFg, textTransform: 'uppercase', marginLeft: state === 'failed' ? 6 : 0 },
              ]}
            >
              {state === 'failed' ? 'Not sent' : 'Chars'}
            </Text>
            <Text style={[T.fig, { color: cellFg, marginLeft: space.sm }]}>
              {len}/{MAX}
            </Text>
          </View>

          <Button
            title="Post"
            onPress={submit}
            disabled={!canPost}
            loading={createPost.isPending}
            style={{ marginLeft: 'auto', paddingHorizontal: space.xl }}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject },
  sheet: {
    borderTopWidth: 1,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    maxHeight: '86%',
  },
  grip: { width: 34, height: 3, borderRadius: 2, alignSelf: 'center', marginTop: 9 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: space.lg,
    paddingRight: 4,
    paddingVertical: space.sm,
  },
  input: {
    minHeight: 128,
    borderWidth: 1,
    borderRadius: radius.cell,
    padding: 13,
    fontSize: 17,
    lineHeight: 26,
  },
  error: { flexDirection: 'row', alignItems: 'flex-start', marginTop: space.md },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
  },
  countCell: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderRadius: radius.cell,
  },
});

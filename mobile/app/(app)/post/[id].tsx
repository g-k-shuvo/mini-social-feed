import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { PostDetailPane } from '../../../src/features/post/PostDetailPane';

/**
 * The phone's own post screen, and the target of every notification deep link.
 * It renders the same pane the tablet shows on the right, narrow.
 */
export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: c.sky, paddingTop: insets.top }}>
      <PostDetailPane
        postId={id ?? null}
        wide={false}
        onBack={() => {
          // A deep link can land here with nothing behind it.
          if (router.canGoBack()) router.back();
          else router.replace('/(app)');
        }}
      />
    </View>
  );
}

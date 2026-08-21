import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/features/auth/AuthProvider';
import { radius, space, type as T } from '../../src/theme/tokens';
import { Button } from '../../src/components/chrome';
import { Rose, Warn } from '../../src/components/Icons';
import { ApiError } from '../../src/api/client';

export default function Login() {
  const { c } = useTheme();
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();

  const [identifier, setIdentifier] = useState('priya');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(identifier.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.sky }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.inner}>
          <View style={{ alignItems: 'center', marginBottom: space.lg }}>
            <Rose size={40} color={c.amber} />
          </View>

          <Text style={[T.display, { color: c.ink, textAlign: 'center' }]}>Mini Social Feed</Text>
          <Text style={[T.bodySmall, { color: c.ink2, textAlign: 'center', marginTop: space.sm, marginBottom: space.xl }]}>
            One shared sky. Text only.
          </Text>

          <Field
            label="Username or email"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoCorrect={false}
            bad={!!error}
            returnKeyType="next"
          />

          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            bad={!!error}
            returnKeyType="go"
            onSubmitEditing={submit}
          />

          {error ? (
            <View style={s.error}>
              <Warn size={15} color={c.amber} />
              <Text style={[T.bodySmall, { color: c.amber, marginLeft: 6, flex: 1 }]}>{error}</Text>
            </View>
          ) : null}

          <Button title="Log in" onPress={submit} loading={busy} style={{ marginTop: space.md }} />

          <Link href="/(auth)/signup" asChild>
            <Pressable style={s.textButton} accessibilityRole="link">
              <Text style={[T.labelLarge, { color: c.ink2 }]}>CREATE AN ACCOUNT</Text>
            </Pressable>
          </Link>

          <View style={[s.demo, { borderColor: c.rule2 }]}>
            <Text style={[T.label, { color: c.ink2, textTransform: 'uppercase' }]}>Demo account</Text>
            <Text style={[T.fig, { color: c.ink, marginTop: 5 }]}>priya · demo1234</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Field({
  label,
  bad,
  hint,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; bad?: boolean; hint?: string }) {
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: space.md }}>
      <Text style={[T.label, { color: c.ink2, textTransform: 'uppercase', marginBottom: 6 }]}>
        {label}
      </Text>
      <TextInput
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        placeholderTextColor={c.ink2}
        selectionColor={c.amber}
        cursorColor={c.amber}
        style={[
          T.body,
          s.input,
          {
            color: c.ink,
            borderColor: bad || focused ? c.amber : c.rule2,
            borderWidth: focused ? 2 : 1,
          },
        ]}
      />
      {hint ? (
        <Text style={[T.figSmall, { color: c.ink2, marginTop: 6 }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: space.xl },
  inner: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  input: {
    borderRadius: radius.cell,
    paddingHorizontal: space.md,
    paddingVertical: 13,
    minHeight: 52,
  },
  error: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: space.md },
  textButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  demo: {
    marginTop: space.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.cell,
    alignItems: 'center',
  },
});

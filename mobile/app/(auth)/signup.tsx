import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/features/auth/AuthProvider';
import { space, type as T } from '../../src/theme/tokens';
import { Button } from '../../src/components/chrome';
import { Rose, Warn } from '../../src/components/Icons';
import { ApiError } from '../../src/api/client';
import { Field } from './login';

export default function Signup() {
  const { c } = useTheme();
  const { signUp } = useAuth();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [badField, setBadField] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setBadField(null);
    try {
      await signUp({
        username: username.trim(),
        email: email.trim(),
        password,
        displayName: displayName.trim() || undefined,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        // The server tells us which field, so the highlight lands on it.
        if (err.code === 'USERNAME_TAKEN') setBadField('username');
        else if (err.code === 'EMAIL_TAKEN') setBadField('email');
        else setBadField(err.details?.[0]?.field ?? null);
      } else {
        setError('Something went wrong. Try again.');
      }
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
          { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.inner}>
          <View style={{ alignItems: 'center', marginBottom: space.lg }}>
            <Rose size={36} color={c.amber} />
          </View>

          <Text style={[T.display, { color: c.ink, textAlign: 'center', fontSize: 30 }]}>
            Join the sky
          </Text>
          <Text
            style={[
              T.bodySmall,
              { color: c.ink2, textAlign: 'center', marginTop: space.sm, marginBottom: space.xl },
            ]}
          >
            Pick a name the sky will know you by.
          </Text>

          <Field
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            bad={badField === 'username'}
            hint="Letters, numbers, and underscores. 3–20 characters."
          />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            bad={badField === 'email'}
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            bad={badField === 'password'}
            // Shown before submitting, not as a punishment afterwards.
            hint="At least 8 characters, with a letter and a number."
          />
          <Field
            label="Display name (optional)"
            value={displayName}
            onChangeText={setDisplayName}
            returnKeyType="go"
            onSubmitEditing={submit}
          />

          {error ? (
            <View style={s.error}>
              <Warn size={15} color={c.amber} />
              <Text style={[T.bodySmall, { color: c.amber, marginLeft: 6, flex: 1 }]}>{error}</Text>
            </View>
          ) : null}

          <Button
            title="Create account"
            onPress={submit}
            loading={busy}
            disabled={!username || !email || !password}
            style={{ marginTop: space.sm }}
          />

          <Link href="/(auth)/login" asChild>
            <Pressable style={s.textButton} accessibilityRole="link">
              <Text style={[T.labelLarge, { color: c.ink2 }]}>ALREADY HAVE AN ACCOUNT? LOG IN</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: space.xl },
  inner: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  error: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: space.md },
  textButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
});

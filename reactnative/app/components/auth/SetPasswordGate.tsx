import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../lib/colors';
import { userService } from '../../../lib/services';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';

/**
 * Accounts created for somebody else — by the setup mailbox or the admin
 * onboarding screen — arrive with a temporary password in an email and
 * force_password_reset set. The web has gated on that since the flow was
 * built; the app did not, so an artist who opened the app instead of the
 * website carried on using the password from their email indefinitely.
 *
 * Mirrors VerifyEmailGate: it replaces the whole app rather than sitting in
 * the navigator, because there is nothing useful to do until it is done.
 */
export default function SetPasswordGate() {
  const { refreshUser, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleSubmit = async () => {
    setError(null);

    if (!currentPassword || !password || !passwordConfirmation) {
      setError('Fill in all three fields.');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('The new passwords do not match.');
      return;
    }

    setSaving(true);

    try {
      await userService.changePassword({
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      });

      // Clears force_password_reset, which is what dismisses this gate.
      await refreshUser();
    } catch (err: any) {
      if (!mountedRef.current) return;

      const fieldErrors = err?.data?.errors;
      setError(
        fieldErrors?.current_password?.[0]
        || fieldErrors?.password?.[0]
        || err?.data?.message
        || 'Could not set your password. Please try again.'
      );
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <MaterialIcons name="lock-outline" size={72} color={colors.accent} style={styles.icon} />

          <Text style={styles.title}>Set your password</Text>
          <Text style={styles.subtitle}>
            Your account was created with a temporary password. Enter it below along
            with your new password to get started.
          </Text>

          {error && <Text style={styles.feedback}>{error}</Text>}

          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Temporary password (from your email)"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="New password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
            placeholder="Confirm new password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Button
            title="Set password"
            onPress={handleSubmit}
            loading={saving}
            style={styles.button}
          />

          <Button
            title="Sign Out"
            onPress={logout}
            variant="secondary"
            style={styles.button}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  feedback: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    marginTop: 12,
  },
});

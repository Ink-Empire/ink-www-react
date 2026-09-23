import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../../lib/colors';
import { authApi } from '../../../lib/api';
import Button from '../common/Button';
import Input from '../common/Input';

interface CorrectEmailFormProps {
  currentEmail: string;
  onCorrected: (newEmail: string) => void;
}

/**
 * Lets someone who mistyped their address at registration point the account at
 * the right one. The account is unverified, so there is no session to use; the
 * old address and password are the credential.
 */
export default function CorrectEmailForm({ currentEmail, onCorrected }: CorrectEmailFormProps) {
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = newEmail.trim().length > 0 && password.length > 0;

  const handleSubmit = async () => {
    setError(null);

    if (!currentEmail) {
      setError('We do not know which account to update. Please register again or contact support.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await authApi.correctEmail({
        email: currentEmail,
        password,
        new_email: newEmail.trim(),
      });

      setPassword('');
      setNewEmail('');
      setOpen(false);
      onCorrected(response.verification.email);
    } catch (err: any) {
      if (err.status === 429) {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else {
        setError(err.data?.message || 'Please check the details and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.toggle}>
        <Text style={styles.toggleText}>Used the wrong email address?</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.form}>
      <Text style={styles.explainer}>
        We will move this account to the new address and send the verification link there.
        The link already sent to {currentEmail} stops working.
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <Input
        label="Correct email address"
        value={newEmail}
        onChangeText={setNewEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
      />

      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        textContentType="password"
      />

      <Button
        title="Update and resend"
        onPress={handleSubmit}
        loading={submitting}
        disabled={!canSubmit}
      />

      <TouchableOpacity onPress={() => setOpen(false)} style={styles.toggle}>
        <Text style={styles.toggleText}>Nevermind, my email is correct</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    marginTop: 16,
    alignSelf: 'center',
  },
  toggleText: {
    color: colors.textMuted,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  form: {
    marginTop: 20,
  },
  explainer: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 12,
  },
});

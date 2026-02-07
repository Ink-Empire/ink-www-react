import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../../lib/colors';
import { authApi } from '../../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

export default function VerifyEmailScreen({ route, navigation }: Props) {
  const { email } = route.params;
  const { refreshUser } = useAuth();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleResend = async () => {
    setResending(true);
    setMessage(null);
    try {
      await authApi.resendVerification(email);
      setMessage('Verification email sent!');
    } catch (err: any) {
      setMessage(err.data?.message || 'Failed to resend. Try again.');
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    setMessage(null);
    try {
      const user = await refreshUser();
      if (!user) {
        setMessage('Email not verified yet. Please check your inbox.');
      }
      // If user is fetched successfully, AuthContext will update and
      // the navigation will automatically switch to MainTabs
    } catch {
      setMessage('Email not verified yet. Please check your inbox.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.message}>
        We sent a verification link to:
      </Text>
      <Text style={styles.email}>{email}</Text>
      <Text style={styles.message}>
        Click the link in your email to verify your account, then tap the button below.
      </Text>

      {message && <Text style={styles.feedback}>{message}</Text>}

      <Button
        title="I've Verified My Email"
        onPress={handleCheckVerification}
        loading={checking}
        style={styles.button}
      />

      <Button
        title="Resend Verification Email"
        onPress={handleResend}
        loading={resending}
        variant="outline"
        style={styles.button}
      />

      <Button
        title="Back to Sign In"
        onPress={() => navigation.navigate('Login')}
        variant="secondary"
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  email: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  feedback: {
    color: colors.info,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    marginTop: 12,
  },
});

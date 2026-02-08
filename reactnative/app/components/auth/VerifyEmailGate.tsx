import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../lib/colors';
import { authApi } from '../../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';

interface VerifyEmailGateProps {
  email: string;
}

const POLL_INTERVAL_MS = 5000;

export default function VerifyEmailGate({ email }: VerifyEmailGateProps) {
  const { refreshUser, logout } = useAuth();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    pollRef.current = setInterval(async () => {
      try {
        const user = await refreshUser();
        if (user?.is_email_verified && mountedRef.current) {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // Not verified yet, silently continue
      }
    }, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [refreshUser]);

  const handleResend = async () => {
    setResending(true);
    setMessage(null);
    try {
      await authApi.resendVerification(email);
      if (mountedRef.current) {
        setMessage('Verification email sent! Check your inbox.');
        setMessageType('success');
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setMessage(err.data?.message || 'Failed to resend. Try again.');
        setMessageType('error');
      }
    } finally {
      if (mountedRef.current) setResending(false);
    }
  };

  const handleCheckNow = async () => {
    setChecking(true);
    setMessage(null);
    try {
      const user = await refreshUser();
      if ((!user || !user.is_email_verified) && mountedRef.current) {
        setMessage('Email not verified yet. Please check your inbox.');
        setMessageType('info');
      }
    } catch {
      if (mountedRef.current) {
        setMessage('Email not verified yet. Please check your inbox.');
        setMessageType('info');
      }
    } finally {
      if (mountedRef.current) setChecking(false);
    }
  };

  const handleLogout = async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    await logout();
  };

  const messageColor =
    messageType === 'success' ? colors.success :
    messageType === 'error' ? colors.error :
    colors.info;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <MaterialIcons name="mail-outline" size={72} color={colors.accent} style={styles.icon} />

        <Text style={styles.title}>You're almost done!</Text>
        <Text style={styles.subtitle}>Verify your email to start using the app.</Text>

        <Text style={styles.body}>
          We've sent a verification link to:
        </Text>
        <Text style={styles.email}>{email}</Text>
        <Text style={styles.body}>
          Click the link in the email to verify your account. This page will update automatically once verified.
        </Text>
        <Text style={styles.hint}>
          Can't find the email? Check your spam or junk folder.
        </Text>

        {message && <Text style={[styles.feedback, { color: messageColor }]}>{message}</Text>}

        <Button
          title="I've Verified My Email"
          onPress={handleCheckNow}
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
          title="Sign Out"
          onPress={handleLogout}
          variant="secondary"
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
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
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 20,
  },
  body: {
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
    marginBottom: 12,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  feedback: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    marginTop: 12,
  },
});

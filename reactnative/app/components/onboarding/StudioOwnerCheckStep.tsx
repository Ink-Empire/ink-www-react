import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../lib/colors';
import { authApi } from '../../../lib/api';
import Input from '../common/Input';
import Button from '../common/Button';

export interface StudioOwnerData {
  hasExistingAccount: boolean;
  isAuthenticated: boolean;
  existingEmail?: string;
}

interface StudioOwnerCheckStepProps {
  onComplete: (data: StudioOwnerData) => void;
  onBack: () => void;
}

type Screen = 'choice' | 'login';

export default function StudioOwnerCheckStep({ onComplete, onBack }: StudioOwnerCheckStepProps) {
  const [screen, setScreen] = useState<Screen>('choice');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleNewAccount = () => {
    onComplete({
      hasExistingAccount: false,
      isAuthenticated: false,
    });
  };

  const handleExistingAccount = () => {
    setScreen('login');
  };

  const validateLogin = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;

    setLoading(true);
    try {
      await authApi.login({ email: email.trim().toLowerCase(), password });
      onComplete({
        hasExistingAccount: true,
        isAuthenticated: true,
        existingEmail: email.trim().toLowerCase(),
      });
    } catch (err: any) {
      const message = err.data?.message || err.message || 'Login failed. Please try again.';
      Alert.alert('Login Error', message);
    } finally {
      setLoading(false);
    }
  };

  if (screen === 'login') {
    return (
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Sign in to your account</Text>
        <Text style={styles.subtitle}>
          Log in with your existing InkedIn account to create a studio profile.
        </Text>

        <Input
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="your.email@example.com"
          error={errors.email}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          error={errors.password}
          secureTextEntry
        />

        <View style={styles.buttons}>
          <Button
            title="Back"
            onPress={() => setScreen('choice')}
            variant="secondary"
            style={styles.buttonHalf}
          />
          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.buttonHalf}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Studio Registration</Text>
      <Text style={styles.subtitle}>Do you already have an InkedIn account?</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={handleExistingAccount}
        activeOpacity={0.7}
      >
        <MaterialIcons name="person" size={28} color={colors.accent} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Yes, I have an account</Text>
          <Text style={styles.cardDescription}>
            Sign in to link a studio to your existing profile
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={handleNewAccount}
        activeOpacity={0.7}
      >
        <MaterialIcons name="person-add" size={28} color={colors.accent} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>No, I'm new here</Text>
          <Text style={styles.cardDescription}>
            Create a new account and set up your studio
          </Text>
        </View>
      </TouchableOpacity>

      <Button title="Back" onPress={onBack} variant="secondary" style={styles.backButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  backButton: {
    marginTop: 8,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  buttonHalf: {
    flex: 1,
  },
});

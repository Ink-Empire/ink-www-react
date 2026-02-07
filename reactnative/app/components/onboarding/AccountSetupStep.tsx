import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../../lib/colors';
import Input from '../common/Input';
import Button from '../common/Button';

interface AccountSetupStepProps {
  onComplete: (credentials: {
    email: string;
    password: string;
    password_confirmation: string;
  }) => void;
  onBack: () => void;
}

export default function AccountSetupStep({ onComplete, onBack }: AccountSetupStepProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (password !== passwordConfirmation) {
      newErrors.passwordConfirmation = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleComplete = () => {
    if (!validate()) return;
    onComplete({
      email: email.trim().toLowerCase(),
      password,
      password_confirmation: passwordConfirmation,
    });
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create Your Account</Text>
      <Text style={styles.subtitle}>Set up your login credentials</Text>

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="your@email.com"
        error={errors.email}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
      />

      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 8 characters"
        error={errors.password}
        secureTextEntry
      />

      <Input
        label="Confirm Password"
        value={passwordConfirmation}
        onChangeText={setPasswordConfirmation}
        placeholder="Re-enter your password"
        error={errors.passwordConfirmation}
        secureTextEntry
      />

      <View style={styles.buttons}>
        <Button title="Back" onPress={onBack} variant="secondary" style={styles.buttonHalf} />
        <Button title="Create Account" onPress={handleComplete} style={styles.buttonHalf} />
      </View>
    </ScrollView>
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
    marginBottom: 24,
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

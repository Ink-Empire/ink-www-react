import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../lib/colors';
import { api } from '../../../lib/api';
import Input from '../common/Input';
import Button from '../common/Button';
import PasswordRequirements, { allRequirementsMet } from './PasswordRequirements';

interface AccountSetupStepProps {
  onComplete: (credentials: {
    email: string;
    password: string;
    password_confirmation: string;
    has_accepted_toc: boolean;
    has_accepted_privacy_policy: boolean;
  }) => void;
  onBack: () => void;
  userType?: 'client' | 'artist' | 'studio';
  loading?: boolean;
}

export default function AccountSetupStep({ onComplete, onBack, userType = 'client', loading = false }: AccountSetupStepProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptedToc, setAcceptedToc] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const accountLabel = userType === 'artist'
    ? 'artist account'
    : userType === 'studio'
      ? 'studio account'
      : 'account';

  const checkEmailAvailability = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailStatus('idle');
      return;
    }

    setEmailStatus('checking');

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await api.post<any>('/check-availability', { email: value });
        if (response.available) {
          setEmailStatus('available');
          setErrors(prev => {
            const next = { ...prev };
            delete next.email;
            return next;
          });
        } else {
          setEmailStatus('taken');
          setErrors(prev => ({ ...prev, email: 'This email is already registered' }));
        }
      } catch {
        setEmailStatus('idle');
      }
    }, 500);
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    } else if (emailStatus === 'taken') {
      newErrors.email = 'This email is already registered';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!allRequirementsMet(password)) {
      newErrors.password = 'Password does not meet all requirements';
    }

    if (password !== passwordConfirmation) {
      newErrors.passwordConfirmation = 'Passwords do not match';
    }

    if (!acceptedToc || !acceptedPrivacy) {
      newErrors.terms = 'You must accept both the Terms of Service and Privacy Policy';
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
      has_accepted_toc: acceptedToc,
      has_accepted_privacy_policy: acceptedPrivacy,
    });
  };

  const isDisabled = loading || emailStatus === 'taken' || emailStatus === 'checking' || !allRequirementsMet(password) || !acceptedToc || !acceptedPrivacy;

  const renderEmailIndicator = () => {
    if (emailStatus === 'checking') {
      return <ActivityIndicator size="small" color={colors.accent} style={styles.emailIndicator} />;
    }
    if (emailStatus === 'available') {
      return <MaterialIcons name="check-circle" size={18} color={colors.success} style={styles.emailIndicator} />;
    }
    if (emailStatus === 'taken') {
      return <MaterialIcons name="cancel" size={18} color={colors.error} style={styles.emailIndicator} />;
    }
    return null;
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Almost there! Set up your {accountLabel}</Text>
      <Text style={styles.subtitle}>Create your login credentials to join the InkedIn community.</Text>

      <View>
        <Input
          label="Email Address"
          value={email}
          onChangeText={(text) => {
            const trimmed = text.replace(/\s/g, '');
            setEmail(trimmed);
            checkEmailAvailability(trimmed);
          }}
          placeholder="your.email@example.com"
          error={errors.email}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />
        {renderEmailIndicator()}
      </View>

      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Create a strong password"
        error={errors.password}
        secureTextEntry
      />

      <PasswordRequirements password={password} />

      <Input
        label="Confirm Password"
        value={passwordConfirmation}
        onChangeText={setPasswordConfirmation}
        placeholder="Confirm your password"
        error={errors.passwordConfirmation}
        secureTextEntry
      />

      <View style={styles.buttons}>
        <Button title="Back" onPress={onBack} variant="secondary" style={styles.buttonHalf} disabled={loading} />
        <Button
          title={loading ? "Creating..." : "Create Account"}
          onPress={handleComplete}
          disabled={isDisabled}
          loading={loading}
          style={styles.buttonHalf}
        />
      </View>

      <View style={styles.checkboxSection}>
        <TouchableOpacity style={styles.checkboxRow} onPress={() => setAcceptedToc(!acceptedToc)}>
          <MaterialIcons
            name={acceptedToc ? 'check-box' : 'check-box-outline-blank'}
            size={22}
            color={acceptedToc ? colors.accent : colors.textMuted}
          />
          <Text style={styles.checkboxLabel}>
            I agree to the{' '}
            <Text
              style={styles.checkboxLink}
              onPress={() => Linking.openURL('https://getinked.in/terms-of-service')}
            >
              Terms of Service
            </Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.checkboxRow} onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}>
          <MaterialIcons
            name={acceptedPrivacy ? 'check-box' : 'check-box-outline-blank'}
            size={22}
            color={acceptedPrivacy ? colors.accent : colors.textMuted}
          />
          <Text style={styles.checkboxLabel}>
            I agree to the{' '}
            <Text
              style={styles.checkboxLink}
              onPress={() => Linking.openURL('https://getinked.in/privacy')}
            >
              Privacy Policy
            </Text>
          </Text>
        </TouchableOpacity>

        {errors.terms && (
          <Text style={styles.checkboxError}>{errors.terms}</Text>
        )}
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
  emailIndicator: {
    position: 'absolute',
    right: 12,
    top: 36,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  buttonHalf: {
    flex: 1,
  },
  checkboxSection: {
    marginBottom: 32,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  checkboxLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    flex: 1,
    lineHeight: 22,
  },
  checkboxLink: {
    color: colors.accent,
    textDecorationLine: 'underline',
  },
  checkboxError: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});

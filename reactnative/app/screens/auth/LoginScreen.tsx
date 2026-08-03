import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../../lib/colors';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email or username and password');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      if (err.requires_verification) {
        navigation.navigate('VerifyEmail', { email: err.email || email });
        return;
      }

      const message = err.data?.message || err.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require('../../assets/images/inkedin-text.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>Sign in to your account</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Input
          label="Email or Username"
          value={email}
          onChangeText={setEmail}
          placeholder="Email or username"
          autoCapitalize="none"
          keyboardType="default"
          autoCorrect={false}
        />

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          secureTextEntry
        />

        <Button title="Sign In" onPress={handleLogin} loading={loading} />

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          style={styles.link}
        >
          <Text style={styles.linkText}>Forgot your password?</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={styles.link}
        >
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkAccent}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 80,
  },
  logo: {
    width: 260,
    height: 62,
    alignSelf: 'center',
    marginBottom: 16,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  errorBox: {
    backgroundColor: 'rgba(199, 93, 93, 0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  link: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  linkAccent: {
    color: colors.accent,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
});

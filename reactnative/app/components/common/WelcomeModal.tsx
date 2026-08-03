import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../../lib/colors';
import { useAuth } from '../../contexts/AuthContext';

const WELCOME_SHOWN_KEY = 'inkedin_welcome_shown';

export default function WelcomeModal() {
  const { isAuthenticated } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkShown = async () => {
      const alreadyShown = await AsyncStorage.getItem(WELCOME_SHOWN_KEY);
      if (!alreadyShown) {
        setVisible(true);
      }
    };
    checkShown();
  }, [isAuthenticated]);

  const handleDismiss = async () => {
    setVisible(false);
    await AsyncStorage.setItem(WELCOME_SHOWN_KEY, 'true');
  };

  if (!isAuthenticated) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.body}>
            We’re building a growing community of tattoo artists, shops, and
            collectors. New artists are being onboarded every week - explore
            what’s here now, save your favorites, and help us grow by referring
            artists you love.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleDismiss}>
            <Text style={styles.buttonText}>Start Exploring</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  buttonText: {
    color: colors.textOnLight,
    fontSize: 16,
    fontWeight: '600',
  },
});

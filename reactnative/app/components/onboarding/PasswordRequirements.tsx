import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../lib/colors';

interface Requirement {
  label: string;
  met: boolean;
}

function getRequirements(password: string): Requirement[] {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function allRequirementsMet(password: string): boolean {
  return getRequirements(password).every(r => r.met);
}

interface PasswordRequirementsProps {
  password: string;
}

export default function PasswordRequirements({ password }: PasswordRequirementsProps) {
  if (!password) return null;

  const requirements = getRequirements(password);

  return (
    <View style={styles.container}>
      {requirements.map((req) => (
        <View key={req.label} style={styles.row}>
          <MaterialIcons
            name={req.met ? 'check-circle' : 'cancel'}
            size={16}
            color={req.met ? colors.success : colors.textMuted}
          />
          <Text style={[styles.label, req.met && styles.labelMet]}>
            {req.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    marginLeft: 6,
  },
  labelMet: {
    color: colors.success,
  },
});

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../lib/colors';

export default function GrowingBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <View style={styles.container}>
      <MaterialIcons name="info-outline" size={18} color={colors.warning} />
      <Text style={styles.text}>
        <Text style={styles.bold}>We're growing! </Text>
        New artists join every week. Check back for more.
      </Text>
      <TouchableOpacity
        onPress={() => setDismissed(true)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcons name="close" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningDim,
    borderBottomWidth: 2,
    borderBottomColor: colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

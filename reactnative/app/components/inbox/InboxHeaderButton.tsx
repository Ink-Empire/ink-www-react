import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../lib/colors';
import { useUnreadMessageCount } from '../../contexts/UnreadCountContext';

export default function InboxHeaderButton() {
  const navigation = useNavigation<any>();
  const { unreadCount } = useUnreadMessageCount();

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => navigation.navigate('InboxStack')}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <MaterialIcons name="inbox" size={24} color={colors.textPrimary} />
      {unreadCount > 0 && <View style={styles.dot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginRight: 12,
    padding: 4,
  },
  dot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
});

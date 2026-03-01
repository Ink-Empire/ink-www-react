import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { useNotifications } from '@inkedin/shared/hooks';
import { useUnreadNotifications } from '../contexts/UnreadNotificationContext';
import type { AppNotification } from '@inkedin/shared/types';

const ICON_MAP: Record<string, string> = {
  artist_tagged: 'label',
  tattoo_approved: 'check-circle',
  tattoo_rejected: 'cancel',
  booking_request: 'event-note',
  booking_accepted: 'event-available',
  booking_declined: 'event-busy',
};

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek}w ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsScreen({ navigation }: any) {
  const {
    notifications,
    loading,
    refreshing,
    hasMore,
    refresh,
    loadMore,
    markAllRead,
  } = useNotifications(api);
  const { refresh: refreshUnreadCount } = useUnreadNotifications();

  useFocusEffect(
    useCallback(() => {
      markAllRead().then(() => refreshUnreadCount());
    }, [markAllRead, refreshUnreadCount]),
  );

  const handlePress = useCallback(
    (item: AppNotification) => {
      if (item.entity_type === 'tattoo' && item.entity_id) {
        navigation.navigate('TattooDetail', { id: item.entity_id });
      }
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: AppNotification }) => {
      const iconName = ICON_MAP[item.type] || 'notifications';
      const isUnread = !item.read_at;

      return (
        <TouchableOpacity
          style={[styles.row, isUnread && styles.rowUnread]}
          onPress={() => handlePress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <MaterialIcons name={iconName} size={24} color={colors.accent} />
          </View>
          <View style={styles.content}>
            <Text style={styles.message} numberOfLines={2}>
              {item.message}
            </Text>
            <Text style={styles.time}>{getRelativeTime(item.created_at)}</Text>
          </View>
          {item.entity_type && item.entity_id && (
            <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
          )}
        </TouchableOpacity>
      );
    },
    [handlePress],
  );

  const renderEmpty = useCallback(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="notifications-none" size={64} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>All caught up</Text>
        <Text style={styles.emptySubtitle}>No notifications yet</Text>
      </View>
    );
  }, [loading]);

  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }, [hasMore]);

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.accent}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 12,
  },
  rowUnread: {
    backgroundColor: colors.surfaceElevated,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  message: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 20,
  },
  time: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: 8,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

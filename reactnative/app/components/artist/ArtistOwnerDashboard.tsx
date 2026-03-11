import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../lib/colors';
import { artistService, bulkUploadService } from '../../../lib/services';
import { prefetchCalendarData } from '../../../lib/calendarCache';
import Button from '../common/Button';

interface DashboardStats {
  profile_views: number;
  saves_this_week: number;
  upcoming_appointments: number;
  unread_messages: number;
  pending_approvals?: number;
}

interface ArtistOwnerDashboardProps {
  artistId: number;
  artistName: string;
  artistSlug: string;
  navigation: any;
}

export default function ArtistOwnerDashboard({
  artistId,
  artistName,
  artistSlug,
  navigation,
}: ArtistOwnerDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [draftCount, setDraftCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statModal, setStatModal] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    prefetchCalendarData(artistId, artistSlug);
  }, [artistId, artistSlug]);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [artistId]),
  );

  const fetchStats = async () => {
    try {
      const [statsResponse, draftsResponse] = await Promise.all([
        artistService.getDashboardStats(artistId),
        bulkUploadService.getDraftCount().catch(() => ({ draft_count: 0 })),
      ]);
      setStats((statsResponse as any)?.data ?? null);
      setDraftCount((draftsResponse as any)?.draft_count ?? 0);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const navigateToCalendar = () => {
    navigation.navigate('Calendar', {
      artistId,
      artistName,
      artistSlug,
    });
  };

  const navigateToEditProfile = () => {
    navigation.navigate('ProfileTab', { screen: 'EditProfile' });
  };

  const navigateToPendingApprovals = () => {
    navigation.navigate('ProfileTab', { screen: 'PendingApprovals' });
  };

  const navigateToInbox = () => {
    navigation.navigate('InboxStack', { screen: 'Inbox' });
  };

  const navigateToDrafts = () => {
    navigation.navigate('ProfileTab', { screen: 'Drafts' });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.accent} size="small" />
      </View>
    );
  }

  const statItems = [
    {
      label: 'Upcoming',
      value: stats?.upcoming_appointments ?? 0,
      icon: 'event' as const,
      onPress: navigateToCalendar,
    },
    {
      label: 'Views',
      value: stats?.profile_views ?? 0,
      icon: 'visibility' as const,
      onPress: () => setStatModal({ title: 'Profile Views', message: `Viewed by ${stats?.profile_views ?? 0} users` }),
    },
    {
      label: 'Saves',
      value: stats?.saves_this_week ?? 0,
      icon: 'bookmark' as const,
      onPress: () => setStatModal({ title: 'Saves', message: `Saved by ${stats?.saves_this_week ?? 0} users` }),
    },
    {
      label: 'Messages',
      value: stats?.unread_messages ?? 0,
      icon: 'mail' as const,
      onPress: navigateToInbox,
      highlight: (stats?.unread_messages ?? 0) > 0,
    },
    {
      label: 'Approve Tags',
      value: stats?.pending_approvals ?? 0,
      icon: 'check-circle' as const,
      onPress: navigateToPendingApprovals,
    },
    ...(draftCount > 0
      ? [
          {
            label: 'Drafts',
            value: draftCount,
            icon: 'collections' as const,
            onPress: navigateToDrafts,
            highlight: true,
          },
        ]
      : []),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.statsGrid}>
        {statItems.map((item, index) => {
          const isLastOdd = statItems.length % 2 === 1 && index === statItems.length - 1;
          return (
            <TouchableOpacity
              key={item.label}
              style={[styles.statCard, isLastOdd && styles.statCardFull, item.highlight && styles.statCardHighlight]}
              onPress={item.onPress}
              disabled={!item.onPress}
              activeOpacity={item.onPress ? 0.7 : 1}
            >
              <MaterialIcons name={item.icon} size={18} color={item.highlight ? colors.error : colors.accent} />
              <Text style={[styles.statCardLabel, item.highlight && styles.statCardLabelHighlight]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Button
          title="View Calendar"
          onPress={navigateToCalendar}
          style={styles.actionButton}
        />
        <Button
          title="Edit Profile"
          onPress={navigateToEditProfile}
          variant="outline"
          style={styles.actionButton}
        />
      </View>

      {/* Stat detail modal */}
      <Modal
        visible={!!statModal}
        transparent
        animationType="fade"
        onRequestClose={() => setStatModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStatModal(null)}
        >
          <View style={styles.modalCard}>
            <MaterialIcons
              name={statModal?.title === 'Saves' ? 'bookmark' : 'visibility'}
              size={32}
              color={colors.accent}
            />
            <Text style={styles.modalTitle}>{statModal?.title}</Text>
            <Text style={styles.modalMessage}>{statModal?.message}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setStatModal(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statCardHighlight: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  statsGrid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCardFull: {
    width: '100%',
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statCardLabel: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  statCardLabelHighlight: {
    color: colors.error,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    minWidth: 260,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  modalMessage: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: 6,
  },
  modalButton: {
    marginTop: 20,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  modalButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '700',
  },
});

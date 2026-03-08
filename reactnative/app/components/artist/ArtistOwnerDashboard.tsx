import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
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
  const [expanded, setExpanded] = useState(false);

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
    },
    {
      label: 'Saves',
      value: stats?.saves_this_week ?? 0,
      icon: 'bookmark' as const,
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
      {/* Collapsed: Compact stat chips row */}
      <TouchableOpacity
        style={styles.chipRow}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        {statItems.map((item) => (
          <View key={item.label} style={[styles.chip, item.highlight && styles.chipHighlight]}>
            <MaterialIcons name={item.icon} size={18} color={item.highlight ? colors.error : colors.textMuted} />
            <Text style={[styles.chipValue, item.highlight && styles.chipValueHighlight]}>{item.value}</Text>
          </View>
        ))}
      </TouchableOpacity>

      {/* Expanded: Full stats grid */}
      {expanded && (
        <View style={styles.expandedSection}>
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
                  <MaterialIcons name={item.icon} size={20} color={item.highlight ? colors.error : colors.accent} />
                  <Text style={styles.statValue}>{item.value}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    width: '30%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  chipValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  chipHighlight: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  chipValueHighlight: {
    color: colors.error,
  },
  statCardHighlight: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  expandedSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  statsGrid: {
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
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
});

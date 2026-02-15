import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../lib/colors';
import { artistService } from '../../../lib/services';
import { prefetchCalendarData } from '../../../lib/calendarCache';
import Button from '../common/Button';

interface DashboardStats {
  profile_views: number;
  saves_this_week: number;
  upcoming_appointments: number;
  unread_messages: number;
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
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchStats();
    prefetchCalendarData(artistId, artistSlug);
  }, [artistId]);

  const fetchStats = async () => {
    try {
      const response = await artistService.getDashboardStats(artistId);
      setStats((response as any)?.data ?? null);
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
    navigation.navigate('EditProfile');
  };

  const navigateToInbox = () => {
    navigation.navigate('InboxStack', { screen: 'Inbox' });
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
    },
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
          <View key={item.label} style={styles.chip}>
            <MaterialIcons name={item.icon} size={18} color={colors.textMuted} />
            <Text style={styles.chipValue}>{item.value}</Text>
          </View>
        ))}
      </TouchableOpacity>

      {/* Expanded: Full stats grid */}
      {expanded && (
        <View style={styles.expandedSection}>
          <View style={styles.statsGrid}>
            {statItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.statCard}
                onPress={item.onPress}
                disabled={!item.onPress}
                activeOpacity={item.onPress ? 0.7 : 1}
              >
                <MaterialIcons name={item.icon} size={20} color={colors.accent} />
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
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
    gap: 10,
  },
  chip: {
    flex: 1,
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
  expandedSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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

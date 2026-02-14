import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DeviceInfo from 'react-native-device-info';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useStyles } from '@inkedin/shared/hooks';
import Avatar from '../components/common/Avatar';
import StyleTag from '../components/common/StyleTag';
import Button from '../components/common/Button';
import { BUILD_GIT_SHA, BUILD_DATE } from '../buildInfo';

const SOCIAL_ICONS: Record<string, string> = {
  instagram: 'camera-alt',
  facebook: 'facebook',
  x: 'tag',
  tiktok: 'music-note',
  bluesky: 'cloud',
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function ProfileScreen({ navigation }: any) {
  const { user, logout, refreshUser } = useAuth();
  const { styles: allStyles } = useStyles(api);

  // Refresh user data when screen comes into focus (e.g. after editing)
  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser])
  );

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) return null;

  const u = user as any;
  const isArtist = u.type === 'artist' || u.type_id === 2;
  const imageUri = typeof u.image === 'string' && u.image ? u.image : u.image?.uri;

  // Resolve style IDs to names — handle both [1, 3] and [{id:1, name:"..."}] formats
  const userStyleIds: number[] = Array.isArray(u.styles)
    ? u.styles.map((s: any) => (typeof s === 'number' ? s : s?.id)).filter(Boolean)
    : [];
  const userStyles = allStyles.filter(s => userStyleIds.includes(s.id));

  // Studio info
  const primaryStudio = u.studio;
  const affiliatedStudios: any[] = u.studios_affiliated || [];

  // Social links
  const socialLinks: any[] = u.social_media_links || [];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarBorder}>
          <Avatar uri={imageUri} name={u.name} size={88} />
        </View>
        <Text style={styles.name}>{u.name}</Text>
        {u.username && <Text style={styles.username}>@{u.username}</Text>}
        {u.location && (
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={14} color={colors.textMuted} />
            <Text style={styles.locationText}>{u.location}</Text>
          </View>
        )}
      </View>

      {/* Edit Profile */}
      <TouchableOpacity
        style={styles.profileLink}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <MaterialIcons name="edit" size={20} color={colors.accent} />
        <Text style={styles.profileLinkText}>Edit Profile</Text>
        <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      {/* My Calendar (Artists) */}
      {isArtist && (
        <TouchableOpacity
          style={styles.profileLink}
          onPress={() => navigation.navigate('Calendar', {
            artistId: u.id,
            artistName: u.name,
            artistSlug: u.slug,
          })}
        >
          <MaterialIcons name="event" size={20} color={colors.accent} />
          <Text style={styles.profileLinkText}>My Calendar</Text>
          <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* View Public Profile (Artists) */}
      {isArtist && u.slug && (
        <TouchableOpacity
          style={styles.profileLink}
          onPress={() => navigation.push('ArtistDetail', { slug: u.slug, name: u.name })}
        >
          <MaterialIcons name="person" size={20} color={colors.accent} />
          <Text style={styles.profileLinkText}>View Public Profile</Text>
          <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* Notification Settings */}
      <TouchableOpacity
        style={styles.profileLink}
        onPress={() => navigation.navigate('NotificationSettings')}
      >
        <MaterialIcons name="notifications" size={20} color={colors.accent} />
        <Text style={styles.profileLinkText}>Notification Settings</Text>
        <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      {/* About */}
      {u.about ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>{u.about}</Text>
        </View>
      ) : null}

      {/* Studio */}
      {(primaryStudio || affiliatedStudios.length > 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Studio</Text>
          {affiliatedStudios.length > 0 ? (
            affiliatedStudios.map((studio: any) => (
              <TouchableOpacity
                key={studio.id}
                style={styles.studioRow}
                onPress={() => studio.slug && navigation.push('StudioDetail', {
                  slug: studio.slug,
                  name: studio.name,
                })}
                activeOpacity={studio.slug ? 0.7 : 1}
              >
                <MaterialIcons name="store" size={18} color={colors.accent} />
                <Text style={styles.studioName}>{studio.name}</Text>
                {studio.is_primary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Primary</Text>
                  </View>
                )}
                {studio.slug && (
                  <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            ))
          ) : primaryStudio ? (
            <TouchableOpacity
              style={styles.studioRow}
              onPress={() => primaryStudio.slug && navigation.push('StudioDetail', {
                slug: primaryStudio.slug,
                name: primaryStudio.name,
              })}
              activeOpacity={primaryStudio.slug ? 0.7 : 1}
            >
              <MaterialIcons name="store" size={18} color={colors.accent} />
              <Text style={styles.studioName}>{primaryStudio.name}</Text>
              {primaryStudio.slug && (
                <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Styles */}
      {userStyles.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Styles</Text>
          <View style={styles.tagsRow}>
            {userStyles.map(style => (
              <StyleTag key={style.id} label={style.name} />
            ))}
          </View>
        </View>
      )}

      {/* Social Links */}
      {socialLinks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Media</Text>
          {socialLinks.map((link: any) => (
            <TouchableOpacity
              key={link.platform}
              style={styles.socialRow}
              onPress={() => {
                if (link.url) Linking.openURL(link.url);
              }}
            >
              <MaterialIcons
                name={SOCIAL_ICONS[link.platform] || 'link'}
                size={18}
                color={colors.accent}
              />
              <View style={styles.socialInfo}>
                <Text style={styles.socialPlatform}>
                  {link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
                </Text>
                <Text style={styles.socialUsername}>@{link.username}</Text>
              </View>
              <MaterialIcons name="open-in-new" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Account Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.infoRow}>
          <MaterialIcons name="email" size={18} color={colors.textMuted} />
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{u.email}</Text>
        </View>

        {u.phone ? (
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={18} color={colors.textMuted} />
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{u.phone}</Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <MaterialIcons name="badge" size={18} color={colors.textMuted} />
          <Text style={styles.infoLabel}>Type</Text>
          <Text style={[styles.infoValue, styles.capitalize]}>{u.type}</Text>
        </View>

        {u.created_at ? (
          <View style={styles.infoRow}>
            <MaterialIcons name="calendar-today" size={18} color={colors.textMuted} />
            <Text style={styles.infoLabel}>Member since</Text>
            <Text style={styles.infoValue}>{formatDate(u.created_at)}</Text>
          </View>
        ) : null}
      </View>

      {/* Build Info */}
      <View style={styles.buildInfo}>
        <Text style={styles.buildText}>
          v{DeviceInfo.getVersion()} ({DeviceInfo.getBuildNumber()})
          {BUILD_GIT_SHA !== 'dev' ? ` - ${BUILD_GIT_SHA}` : ''}
        </Text>
        {BUILD_DATE ? (
          <Text style={styles.buildText}>
            Built {new Date(BUILD_DATE).toLocaleDateString()}
          </Text>
        ) : null}
      </View>

      {/* Sign Out */}
      <View style={styles.actions}>
        <Button title="Sign Out" onPress={handleLogout} variant="destructive" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarBorder: {
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 48,
    padding: 2,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 14,
  },
  username: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '500',
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  locationText: {
    color: colors.textMuted,
    fontSize: 14,
  },

  // View Profile Link
  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  profileLinkText: {
    flex: 1,
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },

  // About
  aboutText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },

  // Studio
  studioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  studioName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  primaryBadge: {
    backgroundColor: colors.accentDim,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  primaryBadgeText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '600',
  },

  // Styles
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // Social
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  socialInfo: {
    flex: 1,
  },
  socialPlatform: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  socialUsername: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 1,
  },

  // Account Info
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 14,
    width: 100,
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  capitalize: {
    textTransform: 'capitalize',
  },

  // Build Info
  buildInfo: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  buildText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },

  // Actions
  actions: {
    padding: 16,
    paddingBottom: 40,
  },
});

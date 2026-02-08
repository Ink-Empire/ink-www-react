import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../lib/colors';
import type { Conversation } from '@inkedin/shared/types';

interface ConversationItemProps {
  conversation: Conversation;
  currentUserId?: number;
  onPress: () => void;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getPreviewText(conversation: Conversation, currentUserId?: number): string {
  const msg = conversation.last_message;
  if (!msg) return 'No messages yet';

  if (msg.type === 'system') return msg.content;

  const prefix = msg.sender_id === currentUserId ? 'You: ' : '';
  return `${prefix}${msg.content}`;
}

export default function ConversationItem({ conversation, currentUserId, onPress }: ConversationItemProps) {
  const participant = conversation.participant;
  const hasUnread = conversation.unread_count > 0;
  const avatarUri = participant?.image?.uri;
  const initials = participant ? getInitials(participant.name || participant.username) : '?';
  const timestamp = conversation.last_message?.created_at || conversation.updated_at;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarContainer}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, hasUnread && styles.nameUnread]} numberOfLines={1}>
            {participant?.name || participant?.username || 'Unknown'}
          </Text>
          <Text style={styles.timestamp}>{formatRelativeTime(timestamp)}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text
            style={[styles.preview, hasUnread && styles.previewUnread]}
            numberOfLines={1}
          >
            {getPreviewText(conversation, currentUserId)}
          </Text>
          {hasUnread && <View style={styles.dot} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceElevated,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  nameUnread: {
    fontWeight: '700',
  },
  timestamp: {
    color: colors.textMuted,
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preview: {
    color: colors.textMuted,
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  previewUnread: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    marginLeft: 4,
  },
});

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../../../lib/colors';
import type { Message } from '@inkedin/shared/types';

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function MessageBubble({ message, isSent }: MessageBubbleProps) {
  if (message.type === 'system') {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }

  const hasAttachments = message.attachments && message.attachments.length > 0;
  const hasText = !!message.content;

  return (
    <View style={[styles.container, isSent ? styles.containerSent : styles.containerReceived]}>
      <View style={[styles.bubble, isSent ? styles.bubbleSent : styles.bubbleReceived]}>
        {hasAttachments && (
          <View style={styles.attachmentsContainer}>
            {message.attachments.map((attachment) =>
              attachment.image ? (
                <Image
                  key={attachment.id}
                  source={{ uri: attachment.image.uri }}
                  style={styles.attachmentImage}
                  resizeMode="cover"
                />
              ) : null
            )}
          </View>
        )}
        {hasText && (
          <Text style={[styles.text, isSent ? styles.textSent : styles.textReceived]}>
            {message.content}
          </Text>
        )}
      </View>
      <Text style={[styles.timestamp, isSent ? styles.timestampSent : styles.timestampReceived]}>
        {formatTime(message.created_at)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    paddingHorizontal: 16,
    maxWidth: '80%',
  },
  containerSent: {
    alignSelf: 'flex-end',
  },
  containerReceived: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  bubbleSent: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: colors.surfaceElevated,
    borderBottomLeftRadius: 4,
  },
  attachmentsContainer: {
    gap: 2,
  },
  attachmentImage: {
    width: 240,
    height: 180,
    borderRadius: 0,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textSent: {
    color: colors.background,
  },
  textReceived: {
    color: colors.textPrimary,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
    marginBottom: 4,
  },
  timestampSent: {
    textAlign: 'right',
    marginRight: 4,
  },
  timestampReceived: {
    textAlign: 'left',
    marginLeft: 4,
  },
  systemContainer: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  systemText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

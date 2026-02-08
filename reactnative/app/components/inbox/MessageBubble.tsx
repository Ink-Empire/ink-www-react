import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

  return (
    <View style={[styles.container, isSent ? styles.containerSent : styles.containerReceived]}>
      <View style={[styles.bubble, isSent ? styles.bubbleSent : styles.bubbleReceived]}>
        <Text style={[styles.text, isSent ? styles.textSent : styles.textReceived]}>
          {message.content}
        </Text>
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleSent: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: colors.surfaceElevated,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
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

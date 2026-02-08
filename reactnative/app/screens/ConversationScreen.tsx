import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useConversation } from '@inkedin/shared/hooks';
import MessageBubble from '../components/inbox/MessageBubble';
import type { Message } from '@inkedin/shared/types';

export default function ConversationScreen({ route }: any) {
  const { conversationId } = route.params;
  const { user } = useAuth();
  const {
    messages,
    loading,
    hasMore,
    sendMessage,
    markAsRead,
    fetchMoreMessages,
  } = useConversation(api, conversationId);

  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Reverse messages for inverted FlatList (newest first)
  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  // Mark as read when conversation opens
  useEffect(() => {
    if (conversationId) {
      markAsRead();
    }
  }, [conversationId, markAsRead]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    setInputText('');

    await sendMessage(text);
    setSending(false);
  }, [inputText, sending, sendMessage]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loading) return;
    // In inverted list, "end" is the top = oldest messages
    const oldestMessage = messages[0];
    if (oldestMessage) {
      fetchMoreMessages(oldestMessage.id);
    }
  }, [hasMore, loading, messages, fetchMoreMessages]);

  const renderItem = useCallback(({ item }: { item: Message }) => (
    <MessageBubble
      message={item}
      isSent={item.sender_id === user?.id}
    />
  ), [user?.id]);

  if (loading && messages.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.accent} size="large" style={styles.loader} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={invertedMessages}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        inverted
        contentContainerStyle={styles.messageList}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={5000}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          <MaterialIcons
            name="send"
            size={22}
            color={inputText.trim() && !sending ? colors.background : colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loader: {
    marginTop: 40,
  },
  messageList: {
    paddingVertical: 12,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceElevated,
  },
});

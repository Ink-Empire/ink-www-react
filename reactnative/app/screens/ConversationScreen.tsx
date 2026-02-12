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
  Image,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ImageCropPicker from 'react-native-image-crop-picker';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useConversation } from '@inkedin/shared/hooks';
import MessageBubble from '../components/inbox/MessageBubble';
import { uploadImagesToS3, type ImageFile } from '../../lib/s3Upload';
import type { Message } from '@inkedin/shared/types';

const MAX_ATTACHMENTS = 5;

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
  const [pendingAttachments, setPendingAttachments] = useState<ImageFile[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const hasContent = inputText.trim().length > 0 || pendingAttachments.length > 0;

  // Reverse messages for inverted FlatList (newest first)
  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  // Mark as read when conversation opens
  useEffect(() => {
    if (conversationId) {
      markAsRead();
    }
  }, [conversationId, markAsRead]);

  const handlePickImages = useCallback(async () => {
    const remaining = MAX_ATTACHMENTS - pendingAttachments.length;
    if (remaining <= 0) return;

    try {
      const results = await ImageCropPicker.openPicker({
        mediaType: 'photo',
        multiple: true,
        maxFiles: remaining,
        compressImageQuality: 0.8,
      });

      const newImages: ImageFile[] = results.map((img) => ({
        uri: img.path,
        type: img.mime || 'image/jpeg',
        name: img.filename || `photo_${Date.now()}.jpg`,
      }));

      setPendingAttachments((prev) => [...prev, ...newImages].slice(0, MAX_ATTACHMENTS));
    } catch {
      // User cancelled
    }
  }, [pendingAttachments.length]);

  const handleRemoveAttachment = useCallback((index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!hasContent || sending) return;

    setSending(true);
    setInputText('');
    const attachments = [...pendingAttachments];
    setPendingAttachments([]);

    try {
      if (attachments.length > 0) {
        const uploaded = await uploadImagesToS3(api, attachments, 'message');
        const attachmentIds = uploaded.map((img) => img.id);
        await sendMessage(text || '', 'image', undefined, attachmentIds);
      } else {
        await sendMessage(text);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Restore attachments on failure
      if (attachments.length > 0) {
        setPendingAttachments(attachments);
      }
    }

    setSending(false);
  }, [inputText, hasContent, sending, pendingAttachments, sendMessage]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loading) return;
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

      {pendingAttachments.length > 0 && (
        <View style={styles.previewStrip}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {pendingAttachments.map((file, index) => (
              <View key={`${file.uri}-${index}`} style={styles.previewItem}>
                <Image source={{ uri: file.uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.previewRemove}
                  onPress={() => handleRemoveAttachment(index)}
                >
                  <MaterialIcons name="close" size={14} color={colors.background} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.inputBar}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={handlePickImages}
          disabled={sending || pendingAttachments.length >= MAX_ATTACHMENTS}
        >
          <MaterialIcons
            name="image"
            size={24}
            color={sending || pendingAttachments.length >= MAX_ATTACHMENTS ? colors.textMuted : colors.accent}
          />
        </TouchableOpacity>
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
          style={[styles.sendButton, (!hasContent || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!hasContent || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.textMuted} />
          ) : (
            <MaterialIcons
              name="send"
              size={22}
              color={hasContent ? colors.background : colors.textMuted}
            />
          )}
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
  previewStrip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  previewItem: {
    marginRight: 8,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  previewRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
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

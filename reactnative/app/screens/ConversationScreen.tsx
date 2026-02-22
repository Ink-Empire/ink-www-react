import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  ScrollView,
  AppState,
  AppStateStatus,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ImageCropPicker from 'react-native-image-crop-picker';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { messageService, appointmentService } from '../../lib/services';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useUnreadMessageCount } from '../contexts/UnreadCountContext';
import { useMessageNotification } from '../contexts/MessageNotificationContext';
import { useConversation, type RealtimeConfig } from '@inkedin/shared/hooks';
import { getEcho } from '../utils/echo';
import MessageBubble from '../components/inbox/MessageBubble';
import { uploadImagesToS3, type ImageFile } from '../../lib/s3Upload';
import { clearCalendarCache } from '../../lib/calendarCache';
import type { Message } from '@inkedin/shared/types';

const MAX_ATTACHMENTS = 5;

interface OptimisticMessage {
  tempId: string;
  content: string;
  status: 'sending' | 'failed';
  attachmentUris?: string[];
}

export default function ConversationScreen({ route, navigation }: any) {
  const { conversationId: initialConversationId, clientId } = route.params;
  const [resolvedId, setResolvedId] = useState<number | undefined>(
    initialConversationId ?? undefined,
  );
  const resolvedIdRef = useRef(resolvedId);
  resolvedIdRef.current = resolvedId;
  const resolvePromiseRef = useRef<{ resolve: (id: number) => void } | null>(null);
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const { refresh: refreshUnreadCount } = useUnreadMessageCount();
  const { setActiveConversationId, clearActiveConversationId } = useMessageNotification();
  const isArtist = user?.type_id === 2;

  // Resolve conversation from clientId if no conversationId was provided
  useEffect(() => {
    if (resolvedId || !clientId) return;
    let cancelled = false;
    messageService.createConversation(clientId).then((response: any) => {
      if (cancelled) return;
      const id = response?.conversation?.id || response?.id;
      if (id) {
        setResolvedId(id);
        // Flush any queued sends waiting for resolution
        if (resolvePromiseRef.current) {
          resolvePromiseRef.current.resolve(id);
          resolvePromiseRef.current = null;
        }
      }
    }).catch((err: any) => {
      console.error('Failed to resolve conversation:', err);
    });
    return () => { cancelled = true; };
  }, [clientId, resolvedId]);

  // Returns the resolved conversation ID, waiting if necessary
  const waitForConversationId = useCallback((): Promise<number> => {
    if (resolvedIdRef.current) return Promise.resolve(resolvedIdRef.current);
    return new Promise((resolve) => {
      resolvePromiseRef.current = { resolve };
    });
  }, []);

  const realtime: RealtimeConfig | undefined = { getEcho };
  const {
    conversation,
    messages,
    loading,
    hasMore,
    sendMessage: hookSendMessage,
    markAsRead,
    fetchMoreMessages,
  } = useConversation(api, resolvedId, realtime);

  const [respondingToBooking, setRespondingToBooking] = useState<number | null>(null);
  const [respondedBookings, setRespondedBookings] = useState<Record<number, 'accepted' | 'declined'>>({});
  const [respondingToReschedule, setRespondingToReschedule] = useState<number | null>(null);

  const handleRespondToBooking = useCallback(async (appointmentId: number, action: 'accept' | 'decline') => {
    setRespondingToBooking(appointmentId);
    try {
      await appointmentService.respond(appointmentId, { action });
      setRespondedBookings(prev => ({ ...prev, [appointmentId]: action === 'accept' ? 'accepted' : 'declined' }));
      clearCalendarCache();
      // Refetch messages so the system message appears immediately
      await fetchMoreMessages();
      showSnackbar(
        action === 'accept'
          ? 'Booking accepted! The client has been notified.'
          : 'Booking declined. The client has been notified.',
        'success',
      );
    } catch (err) {
      console.error(`Failed to ${action} booking:`, err);
      showSnackbar(`Failed to ${action} booking. Please try again.`, 'error');
    } finally {
      setRespondingToBooking(null);
    }
  }, [showSnackbar, fetchMoreMessages]);

  const handleRespondToReschedule = useCallback(async (messageId: number, action: 'accept' | 'decline') => {
    if (!resolvedIdRef.current) return;
    setRespondingToReschedule(messageId);
    try {
      await messageService.respondToMessage(resolvedIdRef.current, messageId, action);
      clearCalendarCache();
      await fetchMoreMessages();
      if (action === 'decline') {
        setInputText("Hey, the proposed time doesn't work for me. Can we discuss some alternative options?");
      }
      showSnackbar(
        action === 'accept'
          ? 'Reschedule accepted! The appointment has been updated.'
          : 'Reschedule declined.',
        'success',
      );
    } catch (err) {
      console.error(`Failed to ${action} reschedule:`, err);
      showSnackbar(`Failed to ${action} reschedule. Please try again.`, 'error');
    } finally {
      setRespondingToReschedule(null);
    }
  }, [showSnackbar, fetchMoreMessages]);

  // Keep a ref so handleSend always uses the latest hookSendMessage
  const sendMessageRef = useRef(hookSendMessage);
  sendMessageRef.current = hookSendMessage;

  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<ImageFile[]>([]);
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const hasContent = inputText.trim().length > 0 || pendingAttachments.length > 0;

  // Combine real messages with optimistic ones for display
  const invertedMessages = useMemo(() => {
    const real = [...messages].map(msg => {
      if (msg.type === 'booking_card' && msg.metadata?.appointment_id && respondedBookings[msg.metadata.appointment_id]) {
        return { ...msg, metadata: { ...msg.metadata, status: respondedBookings[msg.metadata.appointment_id] } };
      }
      return msg;
    }).reverse();
    // Optimistic messages show at the top (newest) of the inverted list
    const optimistic = optimisticMessages.map((om) => ({
      id: om.tempId as any,
      conversation_id: resolvedId || 0,
      sender_id: user?.id || 0,
      sender: { id: user?.id || 0, name: user?.name || '', username: '', initials: '', image: null },
      content: om.content,
      type: om.attachmentUris?.length ? 'image' : 'text',
      metadata: null,
      attachments: (om.attachmentUris || []).map((uri, i) => ({
        id: -(i + 1),
        image: { id: -(i + 1), uri },
      })),
      read_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _optimistic: om.status,
    }));
    return [...optimistic, ...real];
  }, [messages, optimisticMessages, resolvedId, user, respondedBookings]);

  // Mark as read when conversation opens, then sync the badge
  useEffect(() => {
    if (resolvedId) {
      markAsRead().then(() => refreshUnreadCount());
    }
  }, [resolvedId, markAsRead, refreshUnreadCount]);

  // Track active conversation to suppress notification banners
  useEffect(() => {
    if (resolvedId) {
      setActiveConversationId(resolvedId);
    }
    return () => clearActiveConversationId();
  }, [resolvedId, setActiveConversationId, clearActiveConversationId]);

  // Fast 5s poll for new messages
  useEffect(() => {
    if (!resolvedId) return;

    const interval = setInterval(() => {
      fetchMoreMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [resolvedId, fetchMoreMessages]);

  // Refetch messages when app returns to foreground
  useEffect(() => {
    if (!resolvedId) return;

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        fetchMoreMessages();
        markAsRead().then(() => refreshUnreadCount());
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [resolvedId, fetchMoreMessages, markAsRead, refreshUnreadCount]);

  const handlePickImages = useCallback(async () => {
    const remaining = MAX_ATTACHMENTS - pendingAttachments.length;
    if (remaining <= 0) return;

    try {
      const results = await ImageCropPicker.openPicker({
        mediaType: 'photo',
        multiple: true,
        maxFiles: remaining,
        compressImageQuality: 0.8,
        forceJpg: true,
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

    const attachments = [...pendingAttachments];
    const tempId = `opt_${Date.now()}`;

    // Show optimistic bubble immediately
    setOptimisticMessages((prev) => [...prev, {
      tempId,
      content: text,
      status: 'sending',
      attachmentUris: attachments.map((a) => a.uri),
    }]);

    setSending(true);
    setInputText('');
    setPendingAttachments([]);

    try {
      await waitForConversationId();

      if (attachments.length > 0) {
        const uploaded = await uploadImagesToS3(api, attachments, 'message');
        const attachmentIds = uploaded.map((img) => img.id);
        await sendMessageRef.current(text || '', 'image', undefined, attachmentIds);
      } else {
        await sendMessageRef.current(text);
      }

      // Success — remove optimistic message (real one is in hook state now)
      setOptimisticMessages((prev) => prev.filter((m) => m.tempId !== tempId));
    } catch (err) {
      console.error('Error sending message:', err);
      // Mark as failed so user sees the error
      setOptimisticMessages((prev) =>
        prev.map((m) => m.tempId === tempId ? { ...m, status: 'failed' as const } : m),
      );
    }

    setSending(false);
  }, [inputText, hasContent, sending, pendingAttachments, waitForConversationId]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loading) return;
    const oldestMessage = messages[0];
    if (oldestMessage) {
      fetchMoreMessages(oldestMessage.id);
    }
  }, [hasMore, loading, messages, fetchMoreMessages]);

  const handleViewCalendar = useCallback((date?: string) => {
    if (user?.id) {
      navigation.navigate('Main', {
        screen: 'ProfileTab',
        params: {
          screen: 'Calendar',
          params: {
            artistId: user.id,
            artistName: user.name || 'Artist',
            artistSlug: user.slug,
            ...(date ? { initialDate: date } : {}),
          },
        },
      });
    }
  }, [user?.id, user?.name, user?.slug, navigation]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <MessageBubble
      message={item}
      isSent={item.sender_id === user?.id}
      status={(item as any)._optimistic}
      onViewCalendar={isArtist ? handleViewCalendar : undefined}
      onRespondToBooking={isArtist ? handleRespondToBooking : undefined}
      respondingToBooking={respondingToBooking}
      onRespondToReschedule={handleRespondToReschedule}
      respondingToReschedule={respondingToReschedule}
    />
  ), [user?.id, handleViewCalendar, isArtist, handleRespondToBooking, respondingToBooking, handleRespondToReschedule, respondingToReschedule]);

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

import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useConversations } from '@inkedin/shared/hooks';
import ConversationItem from '../components/inbox/ConversationItem';
import EmptyState from '../components/common/EmptyState';
import type { Conversation } from '@inkedin/shared/types';

export default function InboxScreen({ navigation }: any) {
  const { user } = useAuth();
  const { conversations, loading, fetchConversations } = useConversations(api);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      fetchConversations();
      return () => { mountedRef.current = false; };
    }, [fetchConversations])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);

  const handlePress = useCallback((conversation: Conversation) => {
    navigation.push('Conversation', {
      conversationId: conversation.id,
      participantName: conversation.participant?.name || conversation.participant?.username || 'Chat',
    });
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: Conversation }) => (
    <ConversationItem
      conversation={item}
      currentUserId={user?.id}
      onPress={() => handlePress(item)}
    />
  ), [user?.id, handlePress]);

  if (loading && conversations.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.accent} size="large" style={styles.loader} />
      </View>
    );
  }

  if (!loading && conversations.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          message="No conversations yet. Start a conversation by messaging an artist."
          actionLabel="Browse Artists"
          onAction={() => navigation.navigate('ArtistsTab')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    flexGrow: 1,
  },
  loader: {
    marginTop: 40,
  },
});

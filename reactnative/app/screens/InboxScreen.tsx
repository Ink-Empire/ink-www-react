import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { messageService } from '../../lib/services';
import { useAuth } from '../contexts/AuthContext';
import { useConversations } from '@inkedin/shared/hooks';
import ConversationItem from '../components/inbox/ConversationItem';
import type { Conversation } from '@inkedin/shared/types';

interface UserResult {
  id: number;
  name: string;
  username: string;
  slug?: string;
  image?: { id: number; uri: string } | null;
}

export default function InboxScreen({ navigation }: any) {
  const { user } = useAuth();
  const { conversations, loading, fetchConversations } = useConversations(api);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  // New message modal state
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Typeahead search with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = recipientSearch.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearchError('');
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await messageService.searchUsers(query);
        setSearchResults(response.users || []);
        setSearchError(response.users?.length === 0 ? 'No users found' : '');
      } catch {
        setSearchError('Search failed. Please try again.');
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [recipientSearch]);

  const handleSelectUser = async (selectedUser: UserResult) => {
    setCreatingConversation(true);
    setSearchError('');

    try {
      const response = await messageService.createConversation(selectedUser.id);
      const conversationId = response?.conversation?.id;
      fetchConversations();
      closeNewMessageModal();
      if (conversationId) {
        navigation.push('Conversation', {
          conversationId,
          participantName: selectedUser.name || selectedUser.username || 'Chat',
        });
      }
    } catch {
      setSearchError('Failed to start conversation. Please try again.');
    } finally {
      setCreatingConversation(false);
    }
  };

  const closeNewMessageModal = () => {
    setNewMessageOpen(false);
    setRecipientSearch('');
    setSearchResults([]);
    setSearchError('');
  };

  // Set header right button
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setNewMessageOpen(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="add" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="inbox" size={56} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a conversation by tapping the + button above
      </Text>
      <TouchableOpacity
        style={styles.newMessageButton}
        onPress={() => setNewMessageOpen(true)}
      >
        <MaterialIcons name="add" size={18} color={colors.background} />
        <Text style={styles.newMessageButtonText}>New Message</Text>
      </TouchableOpacity>
    </View>
  );

  const getInitials = (u: UserResult) =>
    u.name
      ? u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
      : u.username?.slice(0, 2).toUpperCase() || '??';

  const renderUserResult = ({ item }: { item: UserResult }) => (
    <TouchableOpacity
      style={styles.resultRow}
      onPress={() => handleSelectUser(item)}
      disabled={creatingConversation}
    >
      {item.image?.uri ? (
        <Image source={{ uri: item.image.uri }} style={styles.resultAvatar} />
      ) : (
        <View style={styles.resultAvatarFallback}>
          <Text style={styles.resultAvatarText}>{getInitials(item)}</Text>
        </View>
      )}
      <View style={styles.resultInfo}>
        <Text style={styles.resultName}>{item.name || item.username}</Text>
        <Text style={styles.resultUsername}>@{item.username}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading && conversations.length === 0 ? (
        <ActivityIndicator color={colors.accent} size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={conversations.length === 0 ? styles.emptyList : styles.list}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
        />
      )}

      {/* New Message Modal */}
      <Modal
        visible={newMessageOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeNewMessageModal}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeNewMessageModal}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Message</Text>
            <View style={{ width: 50 }} />
          </View>

          {/* Search Input */}
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrap}>
              <MaterialIcons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, username, or email..."
                placeholderTextColor={colors.textMuted}
                value={recipientSearch}
                onChangeText={setRecipientSearch}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                returnKeyType="search"
              />
              {searching && (
                <ActivityIndicator size="small" color={colors.accent} style={styles.searchSpinner} />
              )}
            </View>
          </View>

          {/* Error */}
          {searchError && !searching ? (
            <Text style={styles.errorText}>{searchError}</Text>
          ) : null}

          {/* Creating indicator */}
          {creatingConversation && (
            <View style={styles.creatingRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.creatingText}>Starting conversation...</Text>
            </View>
          )}

          {/* Results */}
          <FlatList
            data={searchResults}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderUserResult}
            contentContainerStyle={styles.resultsList}
            keyboardShouldPersistTaps="handled"
          />
        </KeyboardAvoidingView>
      </Modal>
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
  emptyList: {
    flexGrow: 1,
  },
  loader: {
    marginTop: 40,
  },
  headerButton: {
    marginRight: 12,
    padding: 4,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  newMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  newMessageButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalCancel: {
    fontSize: 16,
    color: colors.accent,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  // Search
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: colors.textPrimary,
  },
  searchSpinner: {
    marginLeft: 8,
  },
  // Error
  errorText: {
    color: colors.textMuted,
    fontSize: 14,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  // Creating
  creatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  creatingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  // Results
  resultsList: {
    paddingHorizontal: 16,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  resultAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultAvatarText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  resultInfo: {
    marginLeft: 12,
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  resultUsername: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
});

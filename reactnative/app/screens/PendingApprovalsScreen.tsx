import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { tattooService } from '../../lib/services';
import { usePendingApprovals } from '@inkedin/shared/hooks';
import { useSnackbar } from '../contexts/SnackbarContext';
import type { PendingTattoo } from '@inkedin/shared/types';

export default function PendingApprovalsScreen({ navigation }: any) {
  const { pendingTattoos, loading, refetch, removeTattoo } = usePendingApprovals(api);
  const { showSnackbar } = useSnackbar();
  const [respondingId, setRespondingId] = useState<number | null>(null);

  const handleRespond = async (tattoo: PendingTattoo, action: 'approve' | 'reject') => {
    const confirmMessage = action === 'approve'
      ? 'Approve this tattoo? It will appear in the main feed and on your profile.'
      : 'Reject this tag? The tattoo will remain on the user\'s profile only.';

    Alert.alert(
      action === 'approve' ? 'Approve Tattoo' : 'Reject Tag',
      confirmMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'approve' ? 'Approve' : 'Reject',
          style: action === 'reject' ? 'destructive' : 'default',
          onPress: async () => {
            setRespondingId(tattoo.id);
            try {
              await tattooService.respondToTag(tattoo.id, action);
              removeTattoo(tattoo.id);
              showSnackbar(
                action === 'approve'
                  ? 'Tattoo approved and added to your profile.'
                  : 'Tag rejected. The tattoo remains on the user\'s profile.'
              );
            } catch (err: any) {
              showSnackbar(err.message || 'Something went wrong', 'error');
            } finally {
              setRespondingId(null);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: PendingTattoo }) => {
    const isResponding = respondingId === item.id;
    const imageUri = item.primary_image?.uri || item.images?.[0]?.uri;

    return (
      <View style={s.card}>
        <View style={s.cardTop}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={s.thumbnail} />
          ) : (
            <View style={[s.thumbnail, s.thumbnailPlaceholder]}>
              <MaterialIcons name="image" size={24} color={colors.textMuted} />
            </View>
          )}
          <View style={s.cardInfo}>
            <Text style={s.uploaderName}>{item.uploader?.name ?? 'Unknown user'}</Text>
            {item.title && <Text style={s.tattooTitle}>{item.title}</Text>}
            {item.created_at && (
              <Text style={s.date}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        <View style={s.actions}>
          <TouchableOpacity
            style={[s.actionBtn, s.rejectBtn]}
            onPress={() => handleRespond(item, 'reject')}
            disabled={isResponding}
          >
            {isResponding ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <MaterialIcons name="close" size={18} color={colors.error} />
                <Text style={s.rejectText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, s.approveBtn]}
            onPress={() => handleRespond(item, 'approve')}
            disabled={isResponding}
          >
            {isResponding ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <>
                <MaterialIcons name="check" size={18} color={colors.background} />
                <Text style={s.approveText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <FlatList
        data={pendingTattoos}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.listContent}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <MaterialIcons name="check-circle-outline" size={48} color={colors.textMuted} />
            <Text style={s.emptyTitle}>All caught up</Text>
            <Text style={s.emptyText}>No pending approvals right now.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: 16, gap: 12 },
  card: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  thumbnail: { width: 70, height: 70, borderRadius: 8 },
  thumbnailPlaceholder: {
    backgroundColor: colors.surfaceElevated, justifyContent: 'center', alignItems: 'center',
  },
  cardInfo: { flex: 1, justifyContent: 'center' },
  uploaderName: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  tattooTitle: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  date: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 8,
  },
  rejectBtn: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.error,
  },
  approveBtn: { backgroundColor: colors.accent },
  rejectText: { color: colors.error, fontSize: 14, fontWeight: '600' },
  approveText: { color: colors.background, fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '600' },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});

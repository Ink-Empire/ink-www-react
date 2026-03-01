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
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { tattooService } from '../../lib/services';
import { clearTattooCache } from '../../lib/tattooCache';
import { usePendingApprovals } from '@inkedin/shared/hooks';
import { useSnackbar } from '../contexts/SnackbarContext';
import type { PendingTattoo } from '@inkedin/shared/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_PADDING = 16;
const LIST_PADDING = 16;
const IMAGE_SIZE = SCREEN_WIDTH - (LIST_PADDING * 2) - (CARD_PADDING * 2);

export default function PendingApprovalsScreen({ navigation }: any) {
  const { pendingTattoos, loading, refetch, removeTattoo } = usePendingApprovals(api);
  const { showSnackbar } = useSnackbar();
  const [respondingId, setRespondingId] = useState<number | null>(null);

  const handleRespond = async (tattoo: PendingTattoo, action: 'approve' | 'reject') => {
    const confirmMessage = action === 'approve'
      ? 'Accept this tag? The tattoo will appear in the main feed and on your profile.'
      : 'Decline this tag? The tattoo will remain on the user\'s profile only.';

    Alert.alert(
      action === 'approve' ? 'Accept Tag' : 'Decline Tag',
      confirmMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'approve' ? 'Accept' : 'Decline',
          style: action === 'reject' ? 'destructive' : 'default',
          onPress: async () => {
            setRespondingId(tattoo.id);
            try {
              await tattooService.respondToTag(tattoo.id, action);
              removeTattoo(tattoo.id);
              clearTattooCache();
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
        <View style={s.topBar}>
          <TouchableOpacity
            style={s.rejectBtn}
            onPress={() => handleRespond(item, 'reject')}
            disabled={isResponding}
          >
            {isResponding ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <MaterialIcons name="close" size={14} color={colors.error} />
                <Text style={s.rejectText}>Decline</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={s.approveBtn}
            onPress={() => handleRespond(item, 'approve')}
            disabled={isResponding}
          >
            {isResponding ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <>
                <MaterialIcons name="check" size={14} color={colors.background} />
                <Text style={s.approveText}>Accept tag?</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {imageUri ? (
          <Image source={{ uri: imageUri }} style={s.image} />
        ) : (
          <View style={[s.image, s.imagePlaceholder]}>
            <MaterialIcons name="image" size={48} color={colors.textMuted} />
          </View>
        )}

        <View style={s.footer}>
          <View style={s.footerLeft}>
            <Text style={s.uploaderName}>{item.uploader?.name ?? 'Unknown user'}</Text>
            {item.description && (
              <Text style={s.description} numberOfLines={3}>{item.description}</Text>
            )}
          </View>
          {item.created_at && (
            <Text style={s.date}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          )}
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
  listContent: { padding: LIST_PADDING, gap: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: CARD_PADDING,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.error,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
  rejectText: { color: colors.error, fontSize: 12, fontWeight: '600' },
  approveText: { color: colors.background, fontSize: 12, fontWeight: '600' },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 8,
  },
  imagePlaceholder: {
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  footerLeft: { flex: 1, marginRight: 8 },
  uploaderName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  description: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  date: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '600' },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});

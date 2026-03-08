import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { bulkUploadService } from '../../lib/services';
import { uploadImagesToS3, type ImageFile, type UploadProgress } from '../../lib/s3Upload';
import { api } from '../../lib/api';
import { useSnackbar } from '../contexts/SnackbarContext';

const screenWidth = Dimensions.get('window').width;
const GRID_COLUMNS = 3;
const GRID_GAP = 4;
const THUMB_SIZE = (screenWidth - 32 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

interface Props {
  route: { params: { images: ImageFile[] } };
  navigation: any;
}

export default function BulkUploadConfirmScreen({ route, navigation }: Props) {
  const { images } = route.params;
  const [aiTag, setAiTag] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const { showSnackbar } = useSnackbar();

  const handleUpload = useCallback(async () => {
    setUploading(true);

    try {
      const uploadedImages = await uploadImagesToS3(
        api,
        images,
        'tattoo',
        (progress) => setUploadProgress(progress),
      );

      const imageIds = uploadedImages.map(img => img.id);

      await bulkUploadService.uploadAlbum(imageIds, aiTag);

      setUploadedCount(images.length);
      setUploadComplete(true);
    } catch (err: any) {
      console.error('Bulk upload error:', err);
      showSnackbar(err?.message || 'Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }, [images, aiTag, navigation, showSnackbar]);

  const navigateToDrafts = useCallback(() => {
    navigation.getParent()?.navigate('ProfileTab', { screen: 'Drafts' });
  }, [navigation]);

  const progressText = uploadProgress
    ? uploadProgress.current || `${uploadProgress.completed}/${uploadProgress.total}`
    : '';

  if (uploadComplete) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <MaterialIcons name="check-circle" size={64} color={colors.success} />
          <Text style={styles.successTitle}>{uploadedCount} photos uploaded</Text>
          <Text style={styles.successSubtext}>
            {aiTag
              ? "We're analyzing your photos for style and tag suggestions. We'll notify you when they're ready to review."
              : 'Your photos are ready to review. Add details like style and placement, then publish to your portfolio.'}
          </Text>
          <TouchableOpacity style={styles.viewDraftsBtn} onPress={navigateToDrafts}>
            <Text style={styles.viewDraftsBtnText}>View Drafts</Text>
            <MaterialIcons name="arrow-forward" size={18} color={colors.background} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>{images.length} photos selected</Text>

        <View style={styles.grid}>
          {images.map((img, index) => (
            <Image
              key={img.uri}
              source={{ uri: img.uri }}
              style={styles.thumbnail}
            />
          ))}
        </View>

        <View style={styles.aiToggleRow}>
          <View style={styles.aiToggleLabel}>
            <MaterialIcons name="auto-awesome" size={20} color={colors.aiSuggestion} />
            <Text style={styles.aiToggleText}>Allow suggested styles and tags</Text>
          </View>
          <Switch
            value={aiTag}
            onValueChange={setAiTag}
            trackColor={{ false: colors.border, true: colors.accentDim }}
            thumbColor={aiTag ? colors.accent : colors.textMuted}
          />
        </View>
        {aiTag && (
          <Text style={styles.aiHint}>
            Each photo will be analyzed to suggest styles and tags. You can review and edit before publishing.
          </Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          disabled={uploading}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <View style={styles.uploadingRow}>
              <ActivityIndicator size="small" color={colors.background} />
              <Text style={styles.uploadBtnText}>{progressText}</Text>
            </View>
          ) : (
            <Text style={styles.uploadBtnText}>Upload All</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  header: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  thumbnail: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
  },
  aiToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  aiToggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  aiToggleText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  aiHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  uploadBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtnDisabled: {
    opacity: 0.7,
  },
  uploadBtnText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  successTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  successSubtext: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  viewDraftsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    justifyContent: 'center',
  },
  viewDraftsBtnText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  doneBtn: {
    paddingVertical: 12,
  },
  doneBtnText: {
    color: colors.textMuted,
    fontSize: 15,
  },
});

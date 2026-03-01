import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import ImageCropPicker from 'react-native-image-crop-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { messageService, tattooService } from '../../lib/services';
import { uploadImagesToS3, type ImageFile, type UploadProgress } from '../../lib/s3Upload';
import { clearTattooCache } from '../../lib/tattooCache';
import { useSnackbar } from '../contexts/SnackbarContext';

const MAX_IMAGES = 5;
const screenWidth = Dimensions.get('window').width;

export default function ClientUploadScreen({ navigation }: any) {
  const [step, setStep] = useState(0);

  // Step 0: Images
  const [images, setImages] = useState<ImageFile[]>([]);

  // Step 1: Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Artist tag
  const [artistSearchQuery, setArtistSearchQuery] = useState('');
  const [artistSearchResults, setArtistSearchResults] = useState<any[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [searchingArtists, setSearchingArtists] = useState(false);

  // Publishing state
  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadedImageIds, setUploadedImageIds] = useState<number[]>([]);

  const { showSnackbar } = useSnackbar();

  // -- Image handling --

  const handleAddPhotos = useCallback(async () => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      showSnackbar(`Maximum ${MAX_IMAGES} images allowed`, 'error');
      return;
    }
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
      setImages(prev => [...prev, ...newImages].slice(0, MAX_IMAGES));
    } catch {
      // User cancelled
    }
  }, [images.length, showSnackbar]);

  const handleTakePhoto = useCallback(async () => {
    if (images.length >= MAX_IMAGES) {
      showSnackbar(`Maximum ${MAX_IMAGES} images allowed`, 'error');
      return;
    }
    try {
      const image = await ImageCropPicker.openCamera({
        mediaType: 'photo',
        compressImageQuality: 0.8,
        forceJpg: true,
      });
      setImages(prev => [
        ...prev,
        { uri: image.path, type: image.mime || 'image/jpeg', name: image.filename || `photo_${Date.now()}.jpg` },
      ].slice(0, MAX_IMAGES));
    } catch {
      // User cancelled
    }
  }, [images.length, showSnackbar]);

  const handleRemoveImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // -- Artist search --

  const searchArtists = useCallback(async (query: string) => {
    setArtistSearchQuery(query);
    if (query.length < 2) {
      setArtistSearchResults([]);
      return;
    }
    setSearchingArtists(true);
    try {
      const response = await messageService.searchUsers(query, 2);
      setArtistSearchResults(response.users || []);
    } catch {
      setArtistSearchResults([]);
    } finally {
      setSearchingArtists(false);
    }
  }, []);

  const selectArtist = useCallback((artist: any) => {
    setSelectedArtist(artist);
    setArtistSearchQuery('');
    setArtistSearchResults([]);
  }, []);

  const clearArtist = useCallback(() => {
    setSelectedArtist(null);
  }, []);

  // -- Navigation --

  const canProceed = step === 0
    ? images.length > 0
    : step === 1
    ? true
    : true;

  const handleNext = () => {
    if (step === 0 && uploadedImageIds.length === 0) {
      uploadImages();
    }
    if (step < 2) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const uploadImages = async () => {
    try {
      const uploaded = await uploadImagesToS3(api, images, 'tattoo', setUploadProgress);
      setUploadedImageIds(uploaded.map(img => img.id));
    } catch (err: any) {
      console.error('Image upload failed:', err);
    } finally {
      setUploadProgress(null);
    }
  };

  // -- Publish --

  const handlePublish = async () => {
    setPublishing(true);
    setUploadProgress(null);

    try {
      let imageIds: number[];
      if (uploadedImageIds.length > 0) {
        imageIds = uploadedImageIds;
      } else {
        const uploadedImages = await uploadImagesToS3(api, images, 'tattoo', setUploadProgress);
        imageIds = uploadedImages.map(img => img.id);
      }

      const tattooData: {
        image_ids: number[];
        title?: string;
        description?: string;
        tagged_artist_id?: number;
      } = {
        image_ids: imageIds,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
      };

      if (selectedArtist) {
        tattooData.tagged_artist_id = selectedArtist.id;
      }

      await tattooService.clientUpload(tattooData);

      clearTattooCache();

      // Reset form
      setStep(0);
      setImages([]);
      setTitle('');
      setDescription('');
      setSelectedArtist(null);
      setUploadedImageIds([]);

      const message = selectedArtist
        ? 'Your tattoo has been submitted! The artist will be notified for approval.'
        : 'Your tattoo has been added to your profile!';
      showSnackbar(message);
      navigation.navigate('HomeTab');
    } catch (err: any) {
      console.error('Tattoo publish failed:', err);
      showSnackbar(err.message || 'Failed to publish. Please try again.', 'error');
    } finally {
      setPublishing(false);
      setUploadProgress(null);
    }
  };

  // -- Render steps --

  const renderStep0 = () => (
    <ScrollView style={s.stepContent} showsVerticalScrollIndicator={false} keyboardDismissMode="on-drag">
      <Text style={s.stepTitle}>Add Photos</Text>
      <Text style={s.stepSubtitle}>{images.length}/{MAX_IMAGES} images</Text>

      {images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.imageStrip}>
          {images.map((img, index) => (
            <View key={img.uri} style={s.imagePreviewWrap}>
              <Image source={{ uri: img.uri }} style={s.imagePreview} />
              {index === 0 && (
                <View style={s.primaryBadge}>
                  <Text style={s.primaryBadgeText}>Primary</Text>
                </View>
              )}
              <TouchableOpacity style={s.removeImageBtn} onPress={() => handleRemoveImage(index)}>
                <MaterialIcons name="close" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={s.imageActions}>
        <TouchableOpacity style={s.imageActionBtn} onPress={handleAddPhotos}>
          <MaterialIcons name="photo-library" size={28} color={colors.accent} />
          <Text style={s.imageActionText}>Photo Library</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.imageActionBtn} onPress={handleTakePhoto}>
          <MaterialIcons name="camera-alt" size={28} color={colors.accent} />
          <Text style={s.imageActionText}>Take Photo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStep1 = () => (
    <ScrollView style={s.stepContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <Text style={s.stepTitle}>Details</Text>

      <Text style={s.fieldLabel}>Title</Text>
      <TextInput
        style={s.textInput}
        value={title}
        onChangeText={setTitle}
        placeholder="Name your tattoo (optional)"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={s.fieldLabel}>Description</Text>
      <TextInput
        style={[s.textInput, s.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Tell the story behind this tattoo..."
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={3}
      />

      <Text style={s.fieldLabel}>Artist</Text>
      {selectedArtist ? (
        <View style={s.selectedArtistRow}>
          {selectedArtist.image?.uri ? (
            <Image source={{ uri: selectedArtist.image.uri }} style={s.artistAvatar} />
          ) : (
            <View style={[s.artistAvatar, s.artistAvatarPlaceholder]}>
              <MaterialIcons name="person" size={20} color={colors.textMuted} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.selectedArtistName}>
              {selectedArtist.name}
            </Text>
            <Text style={s.selectedArtistUsername}>
              @{selectedArtist.username}
            </Text>
          </View>
          <TouchableOpacity onPress={clearArtist}>
            <MaterialIcons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <TextInput
            style={s.textInput}
            value={artistSearchQuery}
            onChangeText={searchArtists}
            placeholder="Search for the artist (optional)"
            placeholderTextColor={colors.textMuted}
          />
          {searchingArtists && (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 8 }} />
          )}
          {artistSearchResults.length > 0 && (
            <View style={s.artistResults}>
              {artistSearchResults.map((artist) => (
                <TouchableOpacity
                  key={artist.id}
                  style={s.artistResultRow}
                  onPress={() => selectArtist(artist)}
                >
                  {artist.image?.uri ? (
                    <Image source={{ uri: artist.image.uri }} style={s.artistResultAvatar} />
                  ) : (
                    <View style={[s.artistResultAvatar, s.artistAvatarPlaceholder]}>
                      <MaterialIcons name="person" size={16} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={s.artistResultName}>
                      {artist.name}
                    </Text>
                    <Text style={s.artistResultUsername}>
                      @{artist.username}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {selectedArtist && (
        <View style={s.infoNotice}>
          <MaterialIcons name="info-outline" size={16} color={colors.accent} />
          <Text style={s.infoNoticeText}>
            The artist will be notified and must approve before this appears in the main feed.
          </Text>
        </View>
      )}

    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={s.stepContent} showsVerticalScrollIndicator={false} keyboardDismissMode="on-drag">
      <Text style={s.stepTitle}>Review</Text>

      {images.length > 0 && (
        <>
          <Image source={{ uri: images[0].uri }} style={s.reviewImage} resizeMode="cover" />
          {images.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.reviewThumbs}>
              {images.slice(1).map(img => (
                <Image key={img.uri} source={{ uri: img.uri }} style={s.reviewThumb} />
              ))}
            </ScrollView>
          )}
        </>
      )}

      {title ? (
        <View style={s.reviewSection}>
          <Text style={s.reviewLabel}>Title</Text>
          <Text style={s.reviewValue}>{title}</Text>
        </View>
      ) : null}

      {description ? (
        <View style={s.reviewSection}>
          <Text style={s.reviewLabel}>Description</Text>
          <Text style={s.reviewValue}>{description}</Text>
        </View>
      ) : null}

      {selectedArtist && (
        <View style={s.reviewSection}>
          <Text style={s.reviewLabel}>Artist</Text>
          <Text style={s.reviewValue}>@{selectedArtist.username}</Text>
        </View>
      )}

      <View style={s.visibilityInfo}>
        <MaterialIcons name="info-outline" size={16} color={colors.textMuted} />
        <Text style={s.visibilityText}>
          {selectedArtist
            ? 'This tattoo will appear on your profile immediately and in the main feed after the artist approves.'
            : 'This tattoo will be visible on your profile page.'}
        </Text>
      </View>
    </ScrollView>
  );

  const stepRenderers = [renderStep0, renderStep1, renderStep2];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.stepBar}>
        {['Images', 'Details', 'Review'].map((label, i) => (
          <View key={label} style={[s.stepDot, i <= step && s.stepDotActive]}>
            <Text style={[s.stepDotText, i <= step && s.stepDotTextActive]}>{label}</Text>
          </View>
        ))}
      </View>

      <KeyboardAvoidingView
        style={s.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.body}>
          {stepRenderers[step]()}
        </View>

        <View style={s.bottomBar}>
          {step > 0 ? (
            <TouchableOpacity style={s.backButton} onPress={handleBack}>
              <Text style={s.backButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.backButton} />
          )}

          {step < 2 ? (
            <TouchableOpacity
              style={[s.nextButton, !canProceed && s.nextButtonDisabled]}
              onPress={handleNext}
              disabled={!canProceed}
            >
              <Text style={s.nextButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.publishButton} onPress={handlePublish}>
              <Text style={s.publishButtonText}>Share</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {publishing && (
        <View style={s.overlay}>
          <View style={s.overlayCard}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={s.overlayText}>
              {uploadProgress?.current || 'Sharing your tattoo...'}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  stepBar: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingVertical: 16, paddingHorizontal: 12 },
  stepDot: { alignItems: 'center' },
  stepDotActive: {},
  stepDotText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  stepDotTextActive: { color: colors.accent },
  body: { flex: 1 },
  stepContent: { flex: 1, paddingHorizontal: 20 },
  stepTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  stepSubtitle: { color: colors.textMuted, fontSize: 14, marginBottom: 16 },

  imageStrip: { marginBottom: 20 },
  imagePreviewWrap: {
    width: screenWidth * 0.55, height: screenWidth * 0.55,
    marginRight: 12, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.surfaceElevated,
  },
  imagePreview: { width: '100%', height: '100%' },
  primaryBadge: {
    position: 'absolute', top: 8, left: 8, backgroundColor: colors.accent,
    borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3,
  },
  primaryBadgeText: { color: colors.background, fontSize: 11, fontWeight: '700' },
  removeImageBtn: {
    position: 'absolute', top: 8, right: 8, width: 28, height: 28,
    borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center',
  },
  imageActions: { flexDirection: 'row', gap: 12 },
  imageActionBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 24,
    backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1,
    borderColor: colors.border, borderStyle: 'dashed',
  },
  imageActionText: { color: colors.accent, fontSize: 13, marginTop: 8, fontWeight: '600' },

  fieldLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  textInput: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, color: colors.textPrimary, fontSize: 15,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },

  selectedArtistRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: 8, padding: 12, borderWidth: 1, borderColor: colors.inputBorder, gap: 10,
  },
  artistAvatar: { width: 36, height: 36, borderRadius: 18 },
  artistAvatarPlaceholder: {
    backgroundColor: colors.surfaceElevated, justifyContent: 'center', alignItems: 'center',
  },
  selectedArtistName: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  selectedArtistUsername: { color: colors.textMuted, fontSize: 13, marginTop: 1 },

  artistResults: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 8, marginTop: 4, overflow: 'hidden',
  },
  artistResultRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, gap: 10,
  },
  artistResultAvatar: { width: 32, height: 32, borderRadius: 16 },
  artistResultName: { color: colors.textPrimary, fontSize: 15 },
  artistResultUsername: { color: colors.textMuted, fontSize: 13, marginTop: 1 },

  infoNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: colors.accentDim, borderRadius: 8, padding: 12, marginTop: 12,
  },
  infoNoticeText: { flex: 1, color: colors.accent, fontSize: 13, lineHeight: 18 },

  reviewImage: {
    width: '100%', height: 250, borderRadius: 12,
    backgroundColor: colors.surfaceElevated, marginBottom: 8,
  },
  reviewThumbs: { marginBottom: 16 },
  reviewThumb: { width: 60, height: 60, borderRadius: 8, marginRight: 8, backgroundColor: colors.surfaceElevated },
  reviewSection: { marginTop: 16 },
  reviewLabel: {
    color: colors.textMuted, fontSize: 12, fontWeight: '600',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6,
  },
  reviewValue: { color: colors.textPrimary, fontSize: 15, lineHeight: 22 },
  visibilityInfo: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginTop: 24, backgroundColor: colors.surface, borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: colors.border,
  },
  visibilityText: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 18 },

  bottomBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border,
  },
  backButton: { paddingVertical: 14, paddingHorizontal: 24, minWidth: 90 },
  backButtonText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
  nextButton: {
    backgroundColor: colors.accent, paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 10, minWidth: 110, alignItems: 'center',
  },
  nextButtonDisabled: { opacity: 0.4 },
  nextButtonText: { color: colors.background, fontSize: 16, fontWeight: '700' },
  publishButton: {
    backgroundColor: colors.accent, paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 10, minWidth: 110, alignItems: 'center',
  },
  publishButtonText: { color: colors.background, fontSize: 16, fontWeight: '700' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center',
  },
  overlayCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 32,
    alignItems: 'center', minWidth: 200,
  },
  overlayText: { color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginTop: 16 },
});

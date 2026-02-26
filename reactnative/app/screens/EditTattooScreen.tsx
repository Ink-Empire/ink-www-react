import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import ImageCropPicker from 'react-native-image-crop-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { tattooService, tagService } from '../../lib/services';
import { uploadImagesToS3, type ImageFile, type UploadProgress } from '../../lib/s3Upload';
import type { AiTagSuggestion } from '@inkedin/shared/services';
import { useTattoo, useStyles, useTags, usePlacements } from '@inkedin/shared/hooks';
import { useSnackbar } from '../contexts/SnackbarContext';
import LoadingScreen from '../components/common/LoadingScreen';
import ErrorView from '../components/common/ErrorView';
import Button from '../components/common/Button';
import MultiSelectPicker from '../components/common/MultiSelectPicker';

const MAX_IMAGES = 5;
const screenWidth = Dimensions.get('window').width;
const IMAGE_SIZE = screenWidth * 0.28;

interface ExistingImage {
  id: number;
  uri: string;
}

export default function EditTattooScreen({ navigation, route }: any) {
  const { id } = route.params;
  const { tattoo, loading: tattooLoading, error: tattooError } = useTattoo(api, id);
  const { showSnackbar } = useSnackbar();

  const { styles: stylesList } = useStyles(api);
  const { tags: tagsList } = useTags(api);
  const { placements } = usePlacements(api);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [placement, setPlacement] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  // Image state
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
  const [newImages, setNewImages] = useState<ImageFile[]>([]);

  // UI state
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [showPlacementPicker, setShowPlacementPicker] = useState(false);
  const [showStylesPicker, setShowStylesPicker] = useState(false);
  const [showTagsPicker, setShowTagsPicker] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // AI tag suggestions
  const [aiSuggestions, setAiSuggestions] = useState<AiTagSuggestion[]>([]);
  const [loadingAiSuggestions, setLoadingAiSuggestions] = useState(false);
  const [addingAiTag, setAddingAiTag] = useState<string | null>(null);

  // Populate form when tattoo data loads (wait for tagsList to resolve string tags)
  useEffect(() => {
    if (!tattoo || initialized || tagsList.length === 0) return;

    setTitle(tattoo.title || '');
    setDescription(tattoo.description || '');
    setPlacement(tattoo.placement || '');

    if (tattoo.styles && Array.isArray(tattoo.styles)) {
      setSelectedStyles(tattoo.styles.map((s: any) => s.id).filter(Boolean));
    }
    if (tattoo.tags && Array.isArray(tattoo.tags)) {
      // Tags from ES are stored as string names, not objects with ids
      // We need to resolve names to IDs via tagsList
      const tagIds = tattoo.tags
        .map((t: any) => {
          if (typeof t === 'object' && t.id) return t.id;
          // String tag name — look up ID from tagsList
          const name = typeof t === 'string' ? t : t?.name;
          if (!name) return null;
          const match = tagsList.find(
            (tl: any) => tl.name.toLowerCase() === name.toLowerCase(),
          );
          return match?.id || null;
        })
        .filter(Boolean);
      setSelectedTags(tagIds);
    }

    const imgs: ExistingImage[] = [];
    if (tattoo.images && Array.isArray(tattoo.images)) {
      tattoo.images.forEach((img: any) => {
        const uri = typeof img === 'string' ? img : img?.uri;
        const imgId = typeof img === 'object' ? img?.id : undefined;
        if (uri && imgId) imgs.push({ id: imgId, uri });
      });
    }
    if (imgs.length === 0 && tattoo.primary_image) {
      const pi = tattoo.primary_image as any;
      if (pi.id && pi.uri) imgs.push({ id: pi.id, uri: pi.uri });
    }
    setExistingImages(imgs);
    setInitialized(true);
  }, [tattoo, initialized, tagsList]);

  // Build name lookups that include the tattoo's own tags/styles as fallback
  const tagNameMap = useMemo(() => {
    const map = new Map<number, string>();
    tagsList.forEach((t: any) => { if (t.id) map.set(t.id, t.name); });
    // Also resolve string tags from ES by matching against tagsList
    if (tattoo?.tags && Array.isArray(tattoo.tags)) {
      tattoo.tags.forEach((t: any) => {
        if (typeof t === 'object' && t.id) {
          map.set(t.id, t.name);
        } else if (typeof t === 'string') {
          const match = tagsList.find(
            (tl: any) => tl.name.toLowerCase() === t.toLowerCase(),
          );
          if (match) map.set(match.id, match.name);
        }
      });
    }
    return map;
  }, [tagsList, tattoo]);

  const styleNameMap = useMemo(() => {
    const map = new Map<number, string>();
    if (tattoo?.styles && Array.isArray(tattoo.styles)) {
      tattoo.styles.forEach((s: any) => { if (s.id) map.set(s.id, s.name); });
    }
    stylesList.forEach((s: any) => { if (s.id) map.set(s.id, s.name); });
    return map;
  }, [stylesList, tattoo]);

  const visibleExistingImages = useMemo(
    () => existingImages.filter(img => !deletedImageIds.includes(img.id)),
    [existingImages, deletedImageIds],
  );

  const totalImages = visibleExistingImages.length + newImages.length;

  // Image handlers
  const handleRemoveExisting = useCallback((imageId: number) => {
    setDeletedImageIds(prev => [...prev, imageId]);
  }, []);

  const handleRemoveNew = useCallback((index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddPhotos = useCallback(async () => {
    const remaining = MAX_IMAGES - totalImages;
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
      const imgs: ImageFile[] = results.map((img) => ({
        uri: img.path,
        type: img.mime || 'image/jpeg',
        name: img.filename || `photo_${Date.now()}.jpg`,
      }));
      setNewImages(prev => [...prev, ...imgs].slice(0, MAX_IMAGES - visibleExistingImages.length));
    } catch {
      // User cancelled
    }
  }, [totalImages, visibleExistingImages.length, showSnackbar]);

  const handleTakePhoto = useCallback(async () => {
    if (totalImages >= MAX_IMAGES) {
      showSnackbar(`Maximum ${MAX_IMAGES} images allowed`, 'error');
      return;
    }
    try {
      const image = await ImageCropPicker.openCamera({
        mediaType: 'photo',
        compressImageQuality: 0.8,
        forceJpg: true,
      });
      setNewImages(prev => [
        ...prev,
        { uri: image.path, type: image.mime || 'image/jpeg', name: image.filename || `photo_${Date.now()}.jpg` },
      ]);
    } catch {
      // User cancelled
    }
  }, [totalImages, showSnackbar]);

  const handleAddImage = useCallback(() => {
    Alert.alert('Add Photo', undefined, [
      { text: 'Photo Library', onPress: handleAddPhotos },
      { text: 'Take Photo', onPress: handleTakePhoto },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [handleAddPhotos, handleTakePhoto]);

  // Style/tag toggles
  const toggleStyle = useCallback((styleId: number) => {
    setSelectedStyles(prev =>
      prev.includes(styleId) ? prev.filter(s => s !== styleId) : [...prev, styleId],
    );
  }, []);

  const toggleTag = useCallback((tagId: number) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId],
    );
  }, []);

  // Fetch AI tag suggestions from existing images
  const fetchAiSuggestions = useCallback(async () => {
    const imageUrls = visibleExistingImages.map(img => img.uri).filter(Boolean);
    if (imageUrls.length === 0) return;

    setLoadingAiSuggestions(true);
    try {
      const response = await tagService.suggest(imageUrls);
      if (response.success && response.data) {
        const suggestions = response.data.filter(
          tag => !selectedTags.includes(tag.id as number),
        );
        setAiSuggestions(suggestions);
      }
    } catch {
      // Don't block the flow if AI suggestions fail
    } finally {
      setLoadingAiSuggestions(false);
    }
  }, [visibleExistingImages, selectedTags]);

  // Add an AI-suggested tag
  const handleAddAiSuggestion = useCallback(async (tag: AiTagSuggestion) => {
    let tagId = tag.id;

    if (tagId === null || tag.is_new_suggestion) {
      setAddingAiTag(tag.name);
      try {
        const response = await tagService.createFromAi(tag.name);
        if (response.success && response.data) {
          tagId = response.data.id;
          tagNameMap.set(response.data.id, response.data.name);
        } else {
          setAddingAiTag(null);
          return;
        }
      } catch {
        setAddingAiTag(null);
        return;
      }
      setAddingAiTag(null);
    }

    if (tagId) {
      setSelectedTags(prev => prev.includes(tagId as number) ? prev : [...prev, tagId as number]);
      if (tag.name) tagNameMap.set(tagId as number, tag.name);
      setAiSuggestions(prev => prev.filter(t => t.name !== tag.name));
    }
  }, [tagNameMap]);

  // Create a new tag from the picker
  const handleCreateTag = useCallback(async (name: string) => {
    try {
      const response = await tagService.create(name);
      if (response.success && response.data) {
        const newTag = response.data;
        tagNameMap.set(newTag.id, newTag.name);
        return { id: newTag.id, name: newTag.name };
      }
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to create tag', 'error');
    }
    return null;
  }, [tagNameMap, showSnackbar]);

  // Save
  const handleSave = async () => {
    if (!title.trim()) {
      showSnackbar('Title is required', 'error');
      return;
    }

    setSaving(true);
    setUploadProgress(null);

    try {
      let newImageIds: number[] = [];
      if (newImages.length > 0) {
        const uploaded = await uploadImagesToS3(api, newImages, 'tattoo', setUploadProgress);
        newImageIds = uploaded.map(img => img.id);
      }

      const keepImageIds = visibleExistingImages.map(img => img.id);
      const allImageIds = [...keepImageIds, ...newImageIds];

      const updateData: Record<string, any> = {
        title: title.trim(),
        description: description.trim(),
        placement,
        styles: selectedStyles.filter(Boolean),
        tag_ids: selectedTags.filter(Boolean),
        image_ids: allImageIds.filter(Boolean),
      };

      if (deletedImageIds.length > 0) {
        updateData.deleted_image_ids = deletedImageIds.filter(Boolean);
      }

      await tattooService.update(id, updateData);
      showSnackbar('Tattoo updated');
      navigation.goBack();
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to save changes', 'error');
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  if (tattooLoading || !initialized) return <LoadingScreen />;
  if (tattooError || !tattoo) return <ErrorView message={tattooError?.message || 'Tattoo not found'} />;

  return (
    <SafeAreaView style={formStyles.container}>
      <KeyboardAvoidingView
        style={formStyles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        style={formStyles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={formStyles.scrollContent}
      >
        {/* Images section */}
        <Text style={formStyles.sectionTitle}>Photos</Text>
        <Text style={formStyles.sectionSubtitle}>{totalImages}/{MAX_IMAGES} images</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled style={formStyles.imageStrip}>
          {visibleExistingImages.map(img => (
            <View key={`existing-${img.id}`} style={formStyles.imageWrap}>
              <Image source={{ uri: img.uri }} style={formStyles.imageThumb} />
              <TouchableOpacity
                style={formStyles.removeImageBtn}
                onPress={() => handleRemoveExisting(img.id)}
              >
                <MaterialIcons name="close" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          ))}
          {newImages.map((img, index) => (
            <View key={`new-${img.uri}`} style={formStyles.imageWrap}>
              <Image source={{ uri: img.uri }} style={formStyles.imageThumb} />
              <View style={formStyles.newBadge}>
                <Text style={formStyles.newBadgeText}>New</Text>
              </View>
              <TouchableOpacity
                style={formStyles.removeImageBtn}
                onPress={() => handleRemoveNew(index)}
              >
                <MaterialIcons name="close" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          ))}
          {totalImages < MAX_IMAGES && (
            <TouchableOpacity style={formStyles.addImageBtn} onPress={handleAddImage}>
              <MaterialIcons name="add-photo-alternate" size={28} color={colors.accent} />
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Title */}
        <Text style={formStyles.fieldLabel}>Title *</Text>
        <TextInput
          style={formStyles.textInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Name your tattoo"
          placeholderTextColor={colors.textMuted}
        />

        {/* Description */}
        <Text style={formStyles.fieldLabel}>Description</Text>
        <TextInput
          style={[formStyles.textInput, formStyles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Tell the story behind this tattoo..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
        />

        {/* Placement */}
        <Text style={formStyles.fieldLabel}>Placement</Text>
        <TouchableOpacity
          style={formStyles.pickerButton}
          onPress={() => setShowPlacementPicker(true)}
        >
          <Text style={placement ? formStyles.pickerText : formStyles.pickerPlaceholder}>
            {placement || 'Select placement'}
          </Text>
          <MaterialIcons name="expand-more" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Styles */}
        <Text style={formStyles.fieldLabel}>Styles</Text>
        <TouchableOpacity
          style={formStyles.pickerButton}
          onPress={() => setShowStylesPicker(true)}
        >
          <Text style={selectedStyles.length > 0 ? formStyles.pickerText : formStyles.pickerPlaceholder}>
            {selectedStyles.length > 0 ? `${selectedStyles.length} selected` : 'Select styles'}
          </Text>
          <MaterialIcons name="expand-more" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {selectedStyles.length > 0 && (
          <View style={formStyles.selectedChips}>
            {selectedStyles.map(id => {
              const name = styleNameMap.get(id);
              if (!name) return null;
              return (
                <TouchableOpacity
                  key={id}
                  style={formStyles.selectedChip}
                  onPress={() => toggleStyle(id)}
                >
                  <Text style={formStyles.selectedChipText}>{name}</Text>
                  <MaterialIcons name="close" size={14} color={colors.accent} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Tags */}
        <Text style={formStyles.fieldLabel}>Tags</Text>
        <TouchableOpacity
          style={formStyles.pickerButton}
          onPress={() => setShowTagsPicker(true)}
        >
          <Text style={selectedTags.length > 0 ? formStyles.pickerText : formStyles.pickerPlaceholder}>
            {selectedTags.length > 0 ? `${selectedTags.length} selected` : 'Select tags'}
          </Text>
          <MaterialIcons name="expand-more" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {selectedTags.length > 0 && (
          <View style={formStyles.selectedChips}>
            {selectedTags.map(id => {
              const name = tagNameMap.get(id);
              if (!name) return null;
              return (
                <TouchableOpacity
                  key={id}
                  style={formStyles.selectedTagChip}
                  onPress={() => toggleTag(id)}
                >
                  <Text style={formStyles.selectedTagChipText}>{name}</Text>
                  <MaterialIcons name="close" size={14} color={colors.tag} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* AI Tag Suggestions */}
        {(loadingAiSuggestions || aiSuggestions.length > 0) && (
          <View style={formStyles.aiSection}>
            <View style={formStyles.aiHeader}>
              <MaterialIcons name="auto-awesome" size={16} color={colors.aiSuggestion} />
              <Text style={formStyles.aiHeaderText}>AI SUGGESTIONS</Text>
              {loadingAiSuggestions && (
                <ActivityIndicator size="small" color={colors.aiSuggestion} />
              )}
            </View>
            {aiSuggestions.length > 0 ? (
              <View style={formStyles.aiChips}>
                {aiSuggestions.map(tag => {
                  const isNew = tag.id === null || tag.is_new_suggestion;
                  const isCreating = addingAiTag === tag.name;
                  return (
                    <TouchableOpacity
                      key={tag.name}
                      style={[formStyles.aiChip, isNew && formStyles.aiChipNew]}
                      onPress={() => !isCreating && handleAddAiSuggestion(tag)}
                      disabled={isCreating}
                      activeOpacity={0.7}
                    >
                      {isCreating ? (
                        <ActivityIndicator size={12} color={colors.aiSuggestion} />
                      ) : (
                        <MaterialIcons name="add" size={14} color={colors.aiSuggestion} />
                      )}
                      <Text style={formStyles.aiChipText}>{tag.name}</Text>
                      {isNew && !isCreating && (
                        <Text style={formStyles.aiChipNewLabel}>NEW</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : loadingAiSuggestions ? (
              <Text style={formStyles.aiLoadingText}>Analyzing your images...</Text>
            ) : null}
          </View>
        )}

        {!loadingAiSuggestions && aiSuggestions.length === 0 && visibleExistingImages.length > 0 && (
          <TouchableOpacity style={formStyles.aiSuggestButton} onPress={fetchAiSuggestions}>
            <MaterialIcons name="auto-awesome" size={16} color={colors.aiSuggestion} />
            <Text style={formStyles.aiSuggestButtonText}>Get AI tag suggestions</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* Bottom bar */}
      <View style={formStyles.bottomBar}>
        <TouchableOpacity style={formStyles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={formStyles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Button
          title="Save"
          onPress={handleSave}
          disabled={!title.trim() || saving}
          loading={saving}
          style={formStyles.saveBtn}
        />
      </View>
      </KeyboardAvoidingView>

      {/* Placement picker modal */}
      <PickerModal
        visible={showPlacementPicker}
        title="Select Placement"
        options={placements.map(p => p.name)}
        selected={placement}
        onSelect={(val) => { setPlacement(val); setShowPlacementPicker(false); }}
        onClose={() => setShowPlacementPicker(false)}
      />

      {/* Styles picker modal */}
      <MultiSelectPicker
        visible={showStylesPicker}
        title="Select Styles"
        options={stylesList}
        selected={selectedStyles}
        onToggle={toggleStyle}
        onClose={() => setShowStylesPicker(false)}
        searchPlaceholder="Filter styles..."
      />

      {/* Tags picker modal */}
      <MultiSelectPicker
        visible={showTagsPicker}
        title="Select Tags"
        options={tagsList}
        selected={selectedTags}
        onToggle={toggleTag}
        onClose={() => setShowTagsPicker(false)}
        searchPlaceholder="Search tags..."
        initialDisplayCount={30}
        onCreateNew={handleCreateTag}
      />

      {/* Saving overlay */}
      {saving && (
        <View style={formStyles.overlay}>
          <View style={formStyles.overlayCard}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={formStyles.overlayText}>
              {uploadProgress?.current || 'Saving...'}
            </Text>
            {uploadProgress && uploadProgress.total > 0 && (
              <Text style={formStyles.overlaySubtext}>
                {uploadProgress.completed}/{uploadProgress.total}
              </Text>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function PickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (val: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={pickerStyles.container}>
        <View style={pickerStyles.header}>
          <Text style={pickerStyles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView>
          {options.map(option => (
            <TouchableOpacity
              key={option}
              style={[
                pickerStyles.option,
                selected === option && pickerStyles.optionSelected,
              ]}
              onPress={() => onSelect(option)}
            >
              <Text
                style={[
                  pickerStyles.optionText,
                  selected === option && pickerStyles.optionTextSelected,
                ]}
              >
                {option}
              </Text>
              {selected === option && (
                <MaterialIcons name="check" size={20} color={colors.accent} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// -- Styles --

const formStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 12,
  },

  // Image strip
  imageStrip: {
    marginBottom: 16,
  },
  imageWrap: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    marginRight: 10,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
  },
  imageThumb: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.accent,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newBadgeText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: '700',
  },
  addImageBtn: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },

  // Form fields
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginBottom: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedChipText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  selectedTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tagDim,
    borderWidth: 1,
    borderColor: colors.tag,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTagChipText: {
    color: colors.tag,
    fontSize: 13,
    fontWeight: '600',
  },
  // Picker button
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  pickerText: {
    color: colors.textPrimary,
    fontSize: 15,
  },
  pickerPlaceholder: {
    color: colors.textMuted,
    fontSize: 15,
  },

  // AI suggestions
  aiSection: {
    marginTop: 12,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  aiHeaderText: {
    color: colors.aiSuggestion,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  aiChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  aiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.aiSuggestion,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  aiChipNew: {
    borderStyle: 'dashed',
  },
  aiChipText: {
    color: colors.aiSuggestion,
    fontSize: 13,
  },
  aiChipNewLabel: {
    color: colors.aiSuggestion,
    fontSize: 9,
    opacity: 0.7,
  },
  aiLoadingText: {
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  aiSuggestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
  },
  aiSuggestButtonText: {
    color: colors.aiSuggestion,
    fontSize: 13,
    fontWeight: '600',
  },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveBtn: {
    minWidth: 110,
  },

  // Saving overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
  },
  overlayText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  overlaySubtext: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
});

const pickerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.accentDim,
  },
  optionText: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  optionTextSelected: {
    color: colors.accent,
    fontWeight: '600',
  },
});

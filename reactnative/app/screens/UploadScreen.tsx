import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import ImageCropPicker from 'react-native-image-crop-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { tagService } from '../../lib/services';
import { uploadImagesToS3, type ImageFile, type UploadProgress } from '../../lib/s3Upload';
import { useStyles, useTags, usePlacements } from '@inkedin/shared/hooks';
import type { AiTagSuggestion } from '@inkedin/shared/services';
import { useSnackbar } from '../contexts/SnackbarContext';
import StepIndicator from '../components/upload/StepIndicator';
import StyleTag from '../components/common/StyleTag';
import MultiSelectPicker from '../components/common/MultiSelectPicker';

const MAX_IMAGES = 5;
const screenWidth = Dimensions.get('window').width;

const SIZE_OPTIONS = [
  'Tiny (< 2 inches)',
  'Small (2-4 inches)',
  'Medium (4-6 inches)',
  'Large (6-10 inches)',
  'Extra Large (10+ inches)',
  'Full Sleeve',
  'Half Sleeve',
  'Full Back',
];

export default function UploadScreen({ navigation }: any) {
  const [step, setStep] = useState(0);

  // Step 1: Images
  const [images, setImages] = useState<ImageFile[]>([]);

  // Step 2: Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<number[]>([]);

  // Step 3: Tags & Info
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [placement, setPlacement] = useState('');
  const [size, setSize] = useState('');
  const [hours, setHours] = useState('');

  // Step 4: Review
  const [isPublic, setIsPublic] = useState(true);

  // Publishing state
  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  // Snackbar
  const { showSnackbar } = useSnackbar();

  // Data hooks
  const { styles: stylesList } = useStyles(api);
  const { tags: tagsList } = useTags(api);
  const { placements } = usePlacements(api);

  // Pickers expanded state
  const [showPlacementPicker, setShowPlacementPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showStylesPicker, setShowStylesPicker] = useState(false);
  const [showTagsPicker, setShowTagsPicker] = useState(false);

  // AI tag suggestions
  const [uploadedImageIds, setUploadedImageIds] = useState<number[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AiTagSuggestion[]>([]);
  const [loadingAiSuggestions, setLoadingAiSuggestions] = useState(false);
  const [addingAiTag, setAddingAiTag] = useState<string | null>(null);
  const [tagNameMap] = useState(() => new Map<number, string>());

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

  // -- Style/tag toggles --

  const toggleStyle = useCallback((id: number) => {
    setSelectedStyles(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    );
  }, []);

  const toggleTag = useCallback((id: number) => {
    setSelectedTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id],
    );
  }, []);

  // -- AI tag suggestions --

  const uploadAndFetchSuggestions = useCallback(async () => {
    setLoadingAiSuggestions(true);
    try {
      const uploaded = await uploadImagesToS3(api, images, 'tattoo', setUploadProgress);
      const ids = uploaded.map(img => img.id);
      const urls = uploaded.map(img => img.uri);
      setUploadedImageIds(ids);
      setUploadedImageUrls(urls);

      const response = await tagService.suggest(urls);
      if (response.success && response.data) {
        setAiSuggestions(response.data.filter(
          tag => !selectedTags.includes(tag.id as number),
        ));
      }
    } catch {
      // Don't block the flow
    } finally {
      setLoadingAiSuggestions(false);
      setUploadProgress(null);
    }
  }, [images, selectedTags]);

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

  // -- Navigation --

  const canProceed = step === 0
    ? images.length > 0
    : step === 1
    ? title.trim().length > 0
    : true;

  const handleNext = () => {
    // Upload images + fetch AI suggestions when moving from step 0 to step 1
    if (step === 0 && uploadedImageIds.length === 0) {
      uploadAndFetchSuggestions();
    }
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  // -- Publish --

  const handlePublish = async () => {
    setPublishing(true);
    setUploadProgress(null);

    try {
      // Use already-uploaded images if available, otherwise upload now
      let imageIds: number[];
      if (uploadedImageIds.length > 0) {
        imageIds = uploadedImageIds;
      } else {
        const uploadedImages = await uploadImagesToS3(api, images, 'tattoo', setUploadProgress);
        imageIds = uploadedImages.map(img => img.id);
      }

      // Create tattoo
      const tattooData: Record<string, any> = {
        image_ids: imageIds,
        title: title.trim(),
        description: description.trim() || title.trim(),
        is_public: isPublic ? '1' : '0',
      };

      if (selectedStyles.length > 0) {
        tattooData.style_ids = JSON.stringify(selectedStyles);
        tattooData.primary_style_id = selectedStyles[0].toString();
      }
      if (selectedTags.length > 0) {
        tattooData.tag_ids = JSON.stringify(selectedTags.map(id => id));
      }
      if (placement) tattooData.placement = placement;
      if (size) tattooData.size = size;
      if (hours) tattooData.hours_to_complete = hours;

      await api.post('/tattoos/create', tattooData, { requiresAuth: true });

      // Reset form
      setStep(0);
      setImages([]);
      setTitle('');
      setDescription('');
      setSelectedStyles([]);
      setSelectedTags([]);
      setPlacement('');
      setSize('');
      setHours('');
      setIsPublic(true);
      setUploadedImageIds([]);
      setUploadedImageUrls([]);
      setAiSuggestions([]);
      setLoadingAiSuggestions(false);

      showSnackbar('Your tattoo has been published! It will appear in search shortly.');
      navigation.navigate('HomeTab');
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to publish. Please try again.', 'error');
    } finally {
      setPublishing(false);
      setUploadProgress(null);
    }
  };

  // -- Helper: get names by IDs --

  const getStyleNames = () =>
    stylesList.filter(s => selectedStyles.includes(s.id)).map(s => s.name);

  const getTagNames = () =>
    tagsList.filter(t => selectedTags.includes(t.id)).map(t => t.name);

  // -- Render steps --

  const renderStep0 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Add Photos</Text>
      <Text style={styles.stepSubtitle}>{images.length}/{MAX_IMAGES} images</Text>

      {images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageStrip}>
          {images.map((img, index) => (
            <View key={img.uri} style={styles.imagePreviewWrap}>
              <Image source={{ uri: img.uri }} style={styles.imagePreview} />
              {index === 0 && (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>Primary</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => handleRemoveImage(index)}
              >
                <MaterialIcons name="close" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.imageActions}>
        <TouchableOpacity style={styles.imageActionBtn} onPress={handleAddPhotos}>
          <MaterialIcons name="photo-library" size={28} color={colors.accent} />
          <Text style={styles.imageActionText}>Photo Library</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.imageActionBtn} onPress={handleTakePhoto}>
          <MaterialIcons name="camera-alt" size={28} color={colors.accent} />
          <Text style={styles.imageActionText}>Take Photo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStep1 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepTitle}>Details</Text>

      <Text style={styles.fieldLabel}>Title *</Text>
      <TextInput
        style={styles.textInput}
        value={title}
        onChangeText={setTitle}
        placeholder="Name your tattoo"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={styles.fieldLabel}>Description</Text>
      <TextInput
        style={[styles.textInput, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Tell the story behind this tattoo..."
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.fieldLabel}>Styles</Text>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setShowStylesPicker(true)}
      >
        <Text style={selectedStyles.length > 0 ? styles.pickerText : styles.pickerPlaceholder}>
          {selectedStyles.length > 0 ? `${selectedStyles.length} selected` : 'Select styles'}
        </Text>
        <MaterialIcons name="expand-more" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      {selectedStyles.length > 0 && (
        <View style={styles.selectedChips}>
          {stylesList
            .filter(s => selectedStyles.includes(s.id))
            .map(style => (
              <TouchableOpacity
                key={style.id}
                style={styles.selectedChip}
                onPress={() => toggleStyle(style.id)}
              >
                <Text style={styles.selectedChipText}>{style.name}</Text>
                <MaterialIcons name="close" size={14} color={colors.accent} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            ))}
        </View>
      )}
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepTitle}>Tags & Info</Text>

      <Text style={styles.fieldLabel}>Tags</Text>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setShowTagsPicker(true)}
      >
        <Text style={selectedTags.length > 0 ? styles.pickerText : styles.pickerPlaceholder}>
          {selectedTags.length > 0 ? `${selectedTags.length} selected` : 'Select tags'}
        </Text>
        <MaterialIcons name="expand-more" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      {selectedTags.length > 0 && (
        <View style={styles.selectedChips}>
          {selectedTags.map(id => {
            const tag = tagsList.find((t: any) => t.id === id);
            const name = tag?.name || tagNameMap.get(id);
            if (!name) return null;
            return (
              <TouchableOpacity
                key={id}
                style={styles.selectedTagChip}
                onPress={() => toggleTag(id)}
              >
                <Text style={styles.selectedTagChipText}>{name}</Text>
                <MaterialIcons name="close" size={14} color={colors.tag} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* AI Tag Suggestions */}
      {(loadingAiSuggestions || aiSuggestions.length > 0) && (
        <View style={styles.aiSection}>
          <View style={styles.aiHeader}>
            <MaterialIcons name="auto-awesome" size={16} color={colors.aiSuggestion} />
            <Text style={styles.aiHeaderText}>AI SUGGESTIONS</Text>
            {loadingAiSuggestions && (
              <ActivityIndicator size="small" color={colors.aiSuggestion} />
            )}
          </View>
          {aiSuggestions.length > 0 ? (
            <View style={styles.aiChips}>
              {aiSuggestions.map(tag => {
                const isNew = tag.id === null || tag.is_new_suggestion;
                const isCreating = addingAiTag === tag.name;
                return (
                  <TouchableOpacity
                    key={tag.name}
                    style={[styles.aiChip, isNew && styles.aiChipNew]}
                    onPress={() => !isCreating && handleAddAiSuggestion(tag)}
                    disabled={isCreating}
                    activeOpacity={0.7}
                  >
                    {isCreating ? (
                      <ActivityIndicator size={12} color={colors.aiSuggestion} />
                    ) : (
                      <MaterialIcons name="add" size={14} color={colors.aiSuggestion} />
                    )}
                    <Text style={styles.aiChipText}>{tag.name}</Text>
                    {isNew && !isCreating && (
                      <Text style={styles.aiChipNewLabel}>NEW</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : loadingAiSuggestions ? (
            <Text style={styles.aiLoadingText}>Analyzing your images...</Text>
          ) : null}
        </View>
      )}

      <Text style={styles.fieldLabel}>Placement</Text>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setShowPlacementPicker(true)}
      >
        <Text style={placement ? styles.pickerText : styles.pickerPlaceholder}>
          {placement || 'Select placement'}
        </Text>
        <MaterialIcons name="expand-more" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <Text style={styles.fieldLabel}>Size</Text>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setShowSizePicker(true)}
      >
        <Text style={size ? styles.pickerText : styles.pickerPlaceholder}>
          {size || 'Select size'}
        </Text>
        <MaterialIcons name="expand-more" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <Text style={styles.fieldLabel}>Hours to Complete</Text>
      <TextInput
        style={styles.textInput}
        value={hours}
        onChangeText={setHours}
        placeholder="e.g. 2"
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
      />

      {/* Placement picker modal */}
      <PickerModal
        visible={showPlacementPicker}
        title="Select Placement"
        options={placements.map(p => p.name)}
        selected={placement}
        onSelect={(val) => { setPlacement(val); setShowPlacementPicker(false); }}
        onClose={() => setShowPlacementPicker(false)}
      />

      {/* Size picker modal */}
      <PickerModal
        visible={showSizePicker}
        title="Select Size"
        options={SIZE_OPTIONS}
        selected={size}
        onSelect={(val) => { setSize(val); setShowSizePicker(false); }}
        onClose={() => setShowSizePicker(false)}
      />
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Review</Text>

      {images.length > 0 && (
        <>
          <Image source={{ uri: images[0].uri }} style={styles.reviewImage} resizeMode="cover" />
          {images.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewThumbs}>
              {images.slice(1).map(img => (
                <Image key={img.uri} source={{ uri: img.uri }} style={styles.reviewThumb} />
              ))}
            </ScrollView>
          )}
        </>
      )}

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Title</Text>
        <Text style={styles.reviewValue}>{title}</Text>
      </View>

      {description ? (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Description</Text>
          <Text style={styles.reviewValue}>{description}</Text>
        </View>
      ) : null}

      {selectedStyles.length > 0 && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Styles</Text>
          <View style={styles.chipGrid}>
            {getStyleNames().map(name => (
              <StyleTag key={name} label={name} />
            ))}
          </View>
        </View>
      )}

      {selectedTags.length > 0 && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Tags</Text>
          <View style={styles.chipGrid}>
            {getTagNames().map(name => (
              <StyleTag key={name} label={name} />
            ))}
          </View>
        </View>
      )}

      {(placement || size || hours) && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Details</Text>
          {placement ? <Text style={styles.reviewDetail}>Placement: {placement}</Text> : null}
          {size ? <Text style={styles.reviewDetail}>Size: {size}</Text> : null}
          {hours ? <Text style={styles.reviewDetail}>Duration: {hours} hours</Text> : null}
        </View>
      )}

      <View style={styles.visibilityRow}>
        <View>
          <Text style={styles.visibilityLabel}>{isPublic ? 'Public' : 'Unlisted'}</Text>
          <Text style={styles.visibilityHint}>
            {isPublic ? 'Visible to everyone' : 'Only visible via direct link'}
          </Text>
        </View>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          trackColor={{ false: colors.border, true: colors.accentDark }}
          thumbColor={isPublic ? colors.accent : colors.textMuted}
        />
      </View>
    </ScrollView>
  );

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3];

  return (
    <SafeAreaView style={styles.container}>
      <StepIndicator currentStep={step} />

      <View style={styles.body}>
        {stepRenderers[step]()}
      </View>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}

        {step < 3 ? (
          <TouchableOpacity
            style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canProceed}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.publishButton} onPress={handlePublish}>
            <Text style={styles.publishButtonText}>Publish</Text>
          </TouchableOpacity>
        )}
      </View>

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

      {/* Publishing overlay */}
      {publishing && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.overlayText}>
              {uploadProgress?.current || 'Publishing...'}
            </Text>
            {uploadProgress && uploadProgress.total > 0 && (
              <Text style={styles.overlaySubtext}>
                {uploadProgress.completed}/{uploadProgress.total}
              </Text>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// -- Picker modal sub-component --

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 16,
  },

  // Step 1: Images
  imageStrip: {
    marginBottom: 20,
  },
  imagePreviewWrap: {
    width: screenWidth * 0.55,
    height: screenWidth * 0.55,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.accent,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  primaryBadgeText: {
    color: colors.background,
    fontSize: 11,
    fontWeight: '700',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  imageActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  imageActionText: {
    color: colors.accent,
    fontSize: 13,
    marginTop: 8,
    fontWeight: '600',
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
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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

  // Review step
  reviewImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    marginBottom: 8,
  },
  reviewThumbs: {
    marginBottom: 16,
  },
  reviewThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: colors.surfaceElevated,
  },
  reviewSection: {
    marginTop: 16,
  },
  reviewLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  reviewValue: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  reviewDetail: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  visibilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  visibilityLabel: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  visibilityHint: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    minWidth: 90,
  },
  backButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    minWidth: 110,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  nextButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  publishButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    minWidth: 110,
    alignItems: 'center',
  },
  publishButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },

  // Publishing overlay
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

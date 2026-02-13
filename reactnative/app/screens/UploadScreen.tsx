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
import { uploadImagesToS3, type ImageFile, type UploadProgress } from '../../lib/s3Upload';
import { useStyles, useTags, usePlacements } from '@inkedin/shared/hooks';
import { useSnackbar } from '../contexts/SnackbarContext';
import StepIndicator from '../components/upload/StepIndicator';
import StyleTag from '../components/common/StyleTag';

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

  // Search/filter state
  const [styleSearch, setStyleSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');

  // Pickers expanded state
  const [showPlacementPicker, setShowPlacementPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);

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

  // -- Navigation --

  const canProceed = step === 0
    ? images.length > 0
    : step === 1
    ? title.trim().length > 0
    : true;

  const handleNext = () => {
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
      // Upload images to S3
      const uploadedImages = await uploadImagesToS3(api, images, 'tattoo', setUploadProgress);
      const imageIds = uploadedImages.map(img => img.id);

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

  const filteredStyles = styleSearch
    ? stylesList.filter(s => s.name.toLowerCase().includes(styleSearch.toLowerCase()))
    : stylesList;

  const renderStep1 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
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

      <Text style={styles.fieldLabel}>
        Styles{selectedStyles.length > 0 ? ` (${selectedStyles.length})` : ''}
      </Text>

      {/* Selected styles as chips */}
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

      <TextInput
        style={styles.filterInput}
        value={styleSearch}
        onChangeText={setStyleSearch}
        placeholder="Filter styles..."
        placeholderTextColor={colors.textMuted}
      />

      {filteredStyles.map(style => (
        <CheckboxRow
          key={style.id}
          label={style.name}
          checked={selectedStyles.includes(style.id)}
          onToggle={() => toggleStyle(style.id)}
        />
      ))}
      {filteredStyles.length === 0 && (
        <Text style={styles.emptyText}>No styles match</Text>
      )}
    </ScrollView>
  );

  const filteredTags = tagSearch
    ? tagsList.filter((t: any) => t.name.toLowerCase().includes(tagSearch.toLowerCase()))
    : tagsList.slice(0, 30);

  const renderStep2 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Tags & Info</Text>

      <Text style={styles.fieldLabel}>
        Tags{selectedTags.length > 0 ? ` (${selectedTags.length})` : ''}
      </Text>

      {/* Selected tags as chips */}
      {selectedTags.length > 0 && (
        <View style={styles.selectedChips}>
          {tagsList
            .filter((t: any) => selectedTags.includes(t.id))
            .map((tag: any) => (
              <TouchableOpacity
                key={tag.id}
                style={styles.selectedChip}
                onPress={() => toggleTag(tag.id)}
              >
                <Text style={styles.selectedChipText}>{tag.name}</Text>
                <MaterialIcons name="close" size={14} color={colors.accent} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            ))}
        </View>
      )}

      <TextInput
        style={styles.filterInput}
        value={tagSearch}
        onChangeText={setTagSearch}
        placeholder="Search tags..."
        placeholderTextColor={colors.textMuted}
      />

      {filteredTags.map((tag: any) => (
        <CheckboxRow
          key={tag.id}
          label={tag.name}
          checked={selectedTags.includes(tag.id)}
          onToggle={() => toggleTag(tag.id)}
        />
      ))}
      {filteredTags.length === 0 && (
        <Text style={styles.emptyText}>No tags match</Text>
      )}
      {!tagSearch && tagsList.length > 30 && (
        <Text style={styles.hintText}>Type to search more tags...</Text>
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

// -- Sub-components --

function CheckboxRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity style={checkStyles.row} onPress={onToggle} activeOpacity={0.7}>
      <View style={[checkStyles.box, checked && checkStyles.boxChecked]}>
        {checked && <MaterialIcons name="check" size={16} color={colors.background} />}
      </View>
      <Text style={[checkStyles.label, checked && checkStyles.labelChecked]}>{label}</Text>
    </TouchableOpacity>
  );
}

const checkStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  labelChecked: {
    color: colors.accent,
  },
});

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
  filterInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 4,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    paddingVertical: 12,
  },
  hintText: {
    color: colors.textMuted,
    fontSize: 13,
    paddingVertical: 8,
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

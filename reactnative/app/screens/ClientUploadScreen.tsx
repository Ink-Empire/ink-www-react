import React, { useState, useCallback, useEffect, useRef, type RefObject } from 'react';
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
  Alert,
  Linking,
} from 'react-native';
import ImageCropPicker from 'react-native-image-crop-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { messageService, tattooService, tagService, styleService, userService } from '../../lib/services';
import { uploadImagesToS3, type ImageFile, type UploadProgress } from '../../lib/s3Upload';
import { clearTattooCache } from '../../lib/tattooCache';
import { useSnackbar } from '../contexts/SnackbarContext';
import LocationAutocomplete from '../components/common/LocationAutocomplete';
import StudioAutocomplete, { StudioOption } from '../components/common/StudioAutocomplete';
import MultiSelectPicker from '../components/common/MultiSelectPicker';
import { useStyles, useTags } from '@inkedin/shared/hooks';
import type { AiTagSuggestion } from '@inkedin/shared/services/tagService';

const MAX_IMAGES = 5;
const screenWidth = Dimensions.get('window').width;

export default function ClientUploadScreen({ navigation }: any) {
  const [step, setStep] = useState(0);

  // Step 0: Images
  const [images, setImages] = useState<ImageFile[]>([]);

  // Step 1: Styles & Tags
  const [selectedStyleIds, setSelectedStyleIds] = useState<number[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  // Step 2: Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Artist search (InkedIn mode)
  const [artistSearchQuery, setArtistSearchQuery] = useState('');
  const [artistSearchResults, setArtistSearchResults] = useState<any[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [searchingArtists, setSearchingArtists] = useState(false);

  // Artist attribution (manual mode)
  const [artistMode, setArtistMode] = useState<'search' | 'manual'>('search');
  const [attributedArtistName, setAttributedArtistName] = useState('');
  const [selectedStudio, setSelectedStudio] = useState<StudioOption | null>(null);
  const [attributedLocation, setAttributedLocation] = useState('');
  const [attributedLocationLatLong, setAttributedLocationLatLong] = useState('');
  const [artistInviteEmail, setArtistInviteEmail] = useState('');
  const [artistInvitePhone, setArtistInvitePhone] = useState('');
  const [inviteMethod, setInviteMethod] = useState<'email' | 'phone'>('email');
  const [emailExistsOnPlatform, setEmailExistsOnPlatform] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Publishing state
  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadedImageIds, setUploadedImageIds] = useState<number[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);

  // AI suggestions
  const [aiStyleSuggestions, setAiStyleSuggestions] = useState<{ id: number; name: string }[]>([]);
  const [aiTagSuggestions, setAiTagSuggestions] = useState<AiTagSuggestion[]>([]);
  const allAiTagSuggestionsRef = useRef<AiTagSuggestion[]>([]);
  const [loadingAiSuggestions, setLoadingAiSuggestions] = useState(false);
  const [addingAiTag, setAddingAiTag] = useState<string | null>(null);
  const [createdTags, setCreatedTags] = useState<{ id: number; name: string }[]>([]);
  const [tagNameMap] = useState(() => new Map<number, string>());
  const [showTagsPicker, setShowTagsPicker] = useState(false);

  const { showSnackbar } = useSnackbar();
  const { styles: stylesList } = useStyles(api);
  const { tags: tagsList } = useTags(api);

  // Refs
  const detailsScrollRef = useRef<ScrollView>(null);

  // Debounced email availability check for invite flow
  const emailTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const email = artistInviteEmail.trim();
    if (!email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      setEmailExistsOnPlatform(false);
      setCheckingEmail(false);
      return;
    }

    setCheckingEmail(true);
    if (emailTimerRef.current) clearTimeout(emailTimerRef.current);
    emailTimerRef.current = setTimeout(async () => {
      try {
        const response = await userService.checkEmailAvailability(email);
        const exists = !response.available;
        setEmailExistsOnPlatform(exists);
        if (exists) {
          setTimeout(() => detailsScrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
      } catch {
        setEmailExistsOnPlatform(false);
      } finally {
        setCheckingEmail(false);
      }
    }, 500);

    return () => {
      if (emailTimerRef.current) clearTimeout(emailTimerRef.current);
    };
  }, [artistInviteEmail]);

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
    } catch (err: any) {
      if (err?.code === 'E_PICKER_CANCELLED') return;
      if (err?.code === 'E_NO_CAMERA_PERMISSION') {
        Alert.alert(
          'Camera Access Required',
          'Please enable camera access in Settings to take photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
      console.error('Camera error:', err);
      showSnackbar('Unable to open camera. Please try again.', 'error');
    }
  }, [images.length, showSnackbar]);

  const handleRemoveImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // -- Style/Tag toggling --

  const toggleStyle = (id: number) => {
    setSelectedStyleIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleTag = (id: number) => {
    setSelectedTagIds(prev => {
      if (prev.includes(id)) {
        // Removing — restore to AI suggestions using name matching
        const tagName = tagsList.find((t: any) => t.id === id)?.name || createdTags.find(t => t.id === id)?.name;
        if (tagName) {
          const aiTag = allAiTagSuggestionsRef.current.find(t => t.name === tagName);
          if (aiTag) {
            setAiTagSuggestions(suggestions => {
              if (suggestions.some(t => t.name === aiTag.name)) return suggestions;
              return [...suggestions, aiTag];
            });
          }
        }
        return prev.filter(t => t !== id);
      }
      return [...prev, id];
    });
  };

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
    : true;

  const fetchAiSuggestions = useCallback(async (imageUrls: string[]) => {
    setLoadingAiSuggestions(true);
    try {
      const [styleRes, tagRes] = await Promise.all([
        styleService.suggestStyles(imageUrls).catch((err: any) => {
          console.error('Style suggestion failed:', err);
          return null;
        }),
        tagService.suggest(imageUrls).catch((err: any) => {
          console.error('Tag suggestion failed:', err);
          return null;
        }),
      ]);

      if (styleRes?.success && styleRes.data) {
        setAiStyleSuggestions(styleRes.data.filter(
          (s: any) => !selectedStyleIds.includes(s.id)
        ));
      }
      if (tagRes?.success && tagRes.data) {
        allAiTagSuggestionsRef.current = tagRes.data;
        setAiTagSuggestions(tagRes.data.filter(
          (t: AiTagSuggestion) => t.id === null || !selectedTagIds.includes(t.id as number)
        ));
      }
    } catch {
      // Don't block the flow
    } finally {
      setLoadingAiSuggestions(false);
    }
  }, [selectedStyleIds, selectedTagIds]);

  const refetchAiSuggestions = useCallback(async () => {
    if (uploadedImageUrls.length === 0 || loadingAiSuggestions) return;
    fetchAiSuggestions(uploadedImageUrls);
  }, [uploadedImageUrls, loadingAiSuggestions, fetchAiSuggestions]);

  const handleAddAiStyleSuggestion = useCallback((style: { id: number; name: string }) => {
    setSelectedStyleIds(prev => prev.includes(style.id) ? prev : [...prev, style.id]);
    setAiStyleSuggestions(prev => prev.filter(s => s.id !== style.id));
  }, []);

  const handleAddAiTagSuggestion = useCallback(async (tag: AiTagSuggestion) => {
    let tagId = tag.id;

    if (tagId === null || tag.is_new_suggestion) {
      setAddingAiTag(tag.name);
      try {
        const response = await tagService.createFromAi(tag.name);
        if (response.success && response.data) {
          tagId = response.data.id;
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
      if (!tagsList.find((t: any) => t.id === tagId)) {
        setCreatedTags(prev => [...prev, { id: tagId as number, name: tag.name }]);
      }
      // Update the ref so restoration uses the real ID
      allAiTagSuggestionsRef.current = allAiTagSuggestionsRef.current.map(t =>
        t.name === tag.name ? { ...t, id: tagId as number, is_new_suggestion: false } : t
      );
      tagNameMap.set(tagId as number, tag.name);
      setSelectedTagIds(prev => prev.includes(tagId as number) ? prev : [...prev, tagId as number]);
      setAiTagSuggestions(prev => prev.filter(t => t.name !== tag.name));
    }
  }, [tagsList, tagNameMap]);

  const handleCreateTag = useCallback(async (name: string) => {
    try {
      const response = await tagService.create(name);
      if (response.success && response.data) {
        const newTag = response.data;
        tagNameMap.set(newTag.id, newTag.name);
        setCreatedTags(prev => [...prev, { id: newTag.id, name: newTag.name }]);
        return { id: newTag.id, name: newTag.name };
      }
      return null;
    } catch {
      return null;
    }
  }, [tagNameMap]);

  const handleNext = () => {
    if (step === 0 && uploadedImageIds.length === 0) {
      uploadAndFetchSuggestions();
    }
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const uploadImages = async () => {
    try {
      const uploaded = await uploadImagesToS3(api, images, 'tattoo', setUploadProgress);
      setUploadedImageIds(uploaded.map(img => img.id));
      setUploadedImageUrls(uploaded.map(img => img.uri));
    } catch (err: any) {
      console.error('Image upload failed:', err);
    } finally {
      setUploadProgress(null);
    }
  };

  const uploadAndFetchSuggestions = async () => {
    try {
      const uploaded = await uploadImagesToS3(api, images, 'tattoo', setUploadProgress);
      const ids = uploaded.map(img => img.id);
      const urls = uploaded.map(img => img.uri);
      setUploadedImageIds(ids);
      setUploadedImageUrls(urls);
      fetchAiSuggestions(urls);
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

      const tattooData: Record<string, any> = {
        image_ids: imageIds,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
      };

      if (selectedArtist && artistMode === 'search') {
        tattooData.tagged_artist_id = selectedArtist.id;
      }
      if (selectedStyleIds.length > 0) {
        tattooData.style_ids = JSON.stringify(selectedStyleIds);
      }
      if (selectedTagIds.length > 0) {
        tattooData.tag_ids = JSON.stringify(selectedTagIds);
      }
      if (selectedStudio) {
        tattooData.studio_id = selectedStudio.id;
        tattooData.attributed_studio_name = selectedStudio.name;
      }
      if (artistMode === 'manual') {
        if (attributedArtistName.trim()) tattooData.attributed_artist_name = attributedArtistName.trim();
        if (attributedLocation.trim()) tattooData.attributed_location = attributedLocation.trim();
        if (attributedLocationLatLong) tattooData.attributed_location_lat_long = attributedLocationLatLong;
        if (artistInviteEmail.trim()) tattooData.artist_invite_email = artistInviteEmail.trim();
        if (artistInvitePhone.trim()) tattooData.artist_invite_phone = artistInvitePhone.trim();
      }

      const response = await tattooService.clientUpload(tattooData);

      clearTattooCache();

      // If the user provided a phone number for the artist, open native SMS composer
      const invitationToken = (response as any)?.invitation_token;
      const phoneToText = artistInvitePhone.trim();
      const artistName = attributedArtistName.trim();

      // Reset form
      setStep(0);
      setImages([]);
      setSelectedStyleIds([]);
      setSelectedTagIds([]);
      setTitle('');
      setDescription('');
      setSelectedArtist(null);
      setArtistMode('search');
      setAttributedArtistName('');
      setSelectedStudio(null);
      setAttributedLocation('');
      setArtistInviteEmail('');
      setArtistInvitePhone('');
      setEmailExistsOnPlatform(false);
      setCheckingEmail(false);
      setUploadedImageIds([]);
      setUploadedImageUrls([]);
      setAiStyleSuggestions([]);
      setAiTagSuggestions([]);

      const message = selectedArtist && artistMode === 'search'
        ? 'Your tattoo has been submitted! The artist will be notified for approval.'
        : 'Your tattoo has been shared to the feed!';
      showSnackbar(message);
      navigation.navigate('HomeTab');

      // Open SMS composer after navigating (non-blocking)
      console.log('[ClientUpload] SMS check:', { phoneToText, invitationToken });
      if (phoneToText && invitationToken) {
        const claimUrl = `https://getinked.in/claim/${invitationToken}`;
        const smsBody = artistName
          ? `Hey ${artistName}! I just posted your tattoo work on InkedIn. Claim your profile and portfolio here: ${claimUrl}`
          : `Hey! I just posted your tattoo work on InkedIn. Claim your profile and portfolio here: ${claimUrl}`;
        const separator = Platform.OS === 'ios' ? '&' : '?';
        const smsUrl = `sms:${phoneToText}${separator}body=${encodeURIComponent(smsBody)}`;
        Linking.openURL(smsUrl).catch(() => {
          // SMS not available — invite email was sent as fallback
        });
      }
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
    <ScrollView style={s.stepContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={s.stepTitle}>Styles & Tags</Text>

      {/* Image preview strip */}
      {images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {images.map((img, i) => (
            <Image
              key={img.uri}
              source={{ uri: img.uri }}
              style={{
                width: 56,
                height: 56,
                borderRadius: 8,
                marginRight: 8,
                borderWidth: i === 0 ? 2 : 1,
                borderColor: i === 0 ? colors.accent : colors.border,
              }}
            />
          ))}
        </ScrollView>
      )}

      <Text style={s.stepHint}>
        To the best of your ability, select the styles and tags that describe this tattoo. No worries if you're not sure — every bit helps.
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
        <Text style={[s.fieldLabel, { marginTop: 0, marginBottom: 0 }]}>Styles</Text>
        {uploadedImageUrls.length > 0 && !loadingAiSuggestions && (
          <TouchableOpacity
            onPress={refetchAiSuggestions}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="refresh" size={14} color={colors.textMuted} />
            <Text style={{ fontSize: 12, color: colors.textMuted }}>Regenerate suggestions</Text>
          </TouchableOpacity>
        )}
      </View>
      {(loadingAiSuggestions || aiStyleSuggestions.length > 0) && (
        <View style={[s.aiSection, { marginBottom: 8 }]}>
          <View style={s.aiHeader}>
            <MaterialIcons name="auto-awesome" size={14} color={colors.aiSuggestion} />
            <Text style={s.aiHeaderText}>SUGGESTIONS</Text>
            {loadingAiSuggestions && aiStyleSuggestions.length === 0 && (
              <ActivityIndicator size="small" color={colors.aiSuggestion} />
            )}
          </View>
          {loadingAiSuggestions && aiStyleSuggestions.length === 0 && (
            <Text style={s.aiLoadingText}>Analyzing your images...</Text>
          )}
          {aiStyleSuggestions.length > 0 && (
            <View style={s.aiChips}>
              {aiStyleSuggestions.map(style => (
                <TouchableOpacity
                  key={style.id}
                  style={s.aiChip}
                  onPress={() => handleAddAiStyleSuggestion(style)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="add" size={14} color={colors.aiSuggestion} />
                  <Text style={s.aiChipText}>{style.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
      <View style={s.chipGrid}>
        {stylesList.map((style: any) => (
          <TouchableOpacity
            key={style.id}
            style={[s.chip, selectedStyleIds.includes(style.id) && s.chipSelected]}
            onPress={() => toggleStyle(style.id)}
          >
            <Text style={[s.chipText, selectedStyleIds.includes(style.id) && s.chipTextSelected]}>
              {style.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.fieldLabel}>Tags</Text>
      {(loadingAiSuggestions || aiTagSuggestions.length > 0) && (
        <View style={[s.aiSection, { marginBottom: 8 }]}>
          <View style={s.aiHeader}>
            <MaterialIcons name="auto-awesome" size={14} color={colors.aiSuggestion} />
            <Text style={s.aiHeaderText}>SUGGESTIONS</Text>
            {loadingAiSuggestions && aiTagSuggestions.length === 0 && (
              <ActivityIndicator size="small" color={colors.aiSuggestion} />
            )}
          </View>
          {loadingAiSuggestions && aiTagSuggestions.length === 0 && (
            <Text style={s.aiLoadingText}>Analyzing your images...</Text>
          )}
          {aiTagSuggestions.length > 0 && (
            <View style={s.aiChips}>
              {aiTagSuggestions.map(tag => {
                const isNew = tag.id === null || tag.is_new_suggestion;
                const isCreating = addingAiTag === tag.name;
                return (
                  <TouchableOpacity
                    key={tag.name}
                    style={[s.aiChip, isNew && s.aiChipNew]}
                    onPress={() => !isCreating && handleAddAiTagSuggestion(tag)}
                    disabled={isCreating}
                    activeOpacity={0.7}
                  >
                    {isCreating ? (
                      <ActivityIndicator size={12} color={colors.aiSuggestion} />
                    ) : (
                      <MaterialIcons name="add" size={14} color={colors.aiSuggestion} />
                    )}
                    <Text style={s.aiChipText}>{tag.name}</Text>
                    {isNew && !isCreating && (
                      <Text style={s.aiChipNewLabel}>NEW</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}
      {selectedTagIds.length > 0 && (
        <View style={s.chipGrid}>
          {selectedTagIds.map(id => {
            const tag = tagsList.find((t: any) => t.id === id) || createdTags.find(t => t.id === id);
            const name = tag?.name || tagNameMap.get(id);
            if (!name) return null;
            return (
              <TouchableOpacity key={id} style={s.tagChipSelected} onPress={() => toggleTag(id)}>
                <Text style={s.tagChipSelectedText}>{name}</Text>
                <MaterialIcons name="close" size={12} color={colors.tag} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      <TouchableOpacity
        style={s.pickerButton}
        onPress={() => setShowTagsPicker(true)}
      >
        <Text style={selectedTagIds.length > 0 ? s.pickerText : s.pickerPlaceholder}>
          {selectedTagIds.length > 0 ? `${selectedTagIds.length} selected` : 'Select tags'}
        </Text>
        <MaterialIcons name="expand-more" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView ref={detailsScrollRef} style={s.stepContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: 320 }}>
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

      {/* Artist mode toggle */}
      <View style={s.modeToggle}>
        <TouchableOpacity
          style={[s.modeToggleBtn, artistMode === 'search' && s.modeToggleBtnActive]}
          onPress={() => { setArtistMode('search'); clearArtist(); }}
        >
          <Text style={[s.modeToggleText, artistMode === 'search' && s.modeToggleTextActive]}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.modeToggleBtn, artistMode === 'manual' && s.modeToggleBtnActive]}
          onPress={() => { setArtistMode('manual'); clearArtist(); }}
        >
          <Text style={[s.modeToggleText, artistMode === 'manual' && s.modeToggleTextActive]}>Invite</Text>
        </TouchableOpacity>
      </View>

      {artistMode === 'search' && (
        <>
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
                <Text style={s.selectedArtistName}>{selectedArtist.name}</Text>
                <Text style={s.selectedArtistUsername}>@{selectedArtist.username}</Text>
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
                        <Text style={s.artistResultName}>{artist.name}</Text>
                        <Text style={s.artistResultUsername}>@{artist.username}</Text>
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
        </>
      )}

      {artistMode === 'manual' && (
        <View style={{ gap: 10 }}>
          <TextInput
            style={s.textInput}
            value={attributedArtistName}
            onChangeText={setAttributedArtistName}
            placeholder="Artist name"
            placeholderTextColor={colors.textMuted}
          />
          <LocationAutocomplete
            value={attributedLocation}
            onChange={(location, latLong) => {
              setAttributedLocation(location);
              setAttributedLocationLatLong(latLong || '');
            }}
            placeholder="City/Location (optional)"
          />
          {inviteMethod === 'email' ? (
            <>
              <View>
                <TextInput
                  style={s.textInput}
                  value={artistInviteEmail}
                  onChangeText={setArtistInviteEmail}
                  placeholder="Artist email (sends invite)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {checkingEmail && (
                  <ActivityIndicator size="small" color={colors.accent} style={{ position: 'absolute', right: 12, top: 14 }} />
                )}
              </View>
              {emailExistsOnPlatform ? (
                <View style={s.emailExistsBanner}>
                  <Text style={s.emailExistsText}>
                    This email belongs to an artist already on InkedIn. You can tag them directly instead of sending an invite.
                  </Text>
                  <TouchableOpacity
                    style={s.emailExistsButton}
                    onPress={() => {
                      const email = artistInviteEmail.trim();
                      setArtistMode('search');
                      setArtistInviteEmail('');
                      setEmailExistsOnPlatform(false);
                      setAttributedArtistName('');
                      setSelectedStudio(null);
                      setAttributedLocation('');
                      setAttributedLocationLatLong('');
                      searchArtists(email);
                    }}
                  >
                    <Text style={s.emailExistsButtonText}>Search instead</Text>
                  </TouchableOpacity>
                </View>
              ) : artistInviteEmail.trim() && !checkingEmail ? (
                <View style={s.infoNotice}>
                  <MaterialIcons name="info-outline" size={16} color={colors.accent} />
                  <Text style={s.infoNoticeText}>
                    An invitation email will be sent so the artist can claim this tattoo on InkedIn.
                  </Text>
                </View>
              ) : null}
              <TouchableOpacity onPress={() => { setInviteMethod('phone'); setArtistInviteEmail(''); setEmailExistsOnPlatform(false); }}>
                <Text style={s.inviteMethodToggle}>Rather send a text?</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                style={s.textInput}
                value={artistInvitePhone}
                onChangeText={setArtistInvitePhone}
                placeholder="Artist phone number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
              {artistInvitePhone.trim() ? (
                <View style={s.infoNotice}>
                  <MaterialIcons name="textsms" size={16} color={colors.accent} />
                  <Text style={s.infoNoticeText}>
                    After posting, your Messages app will open so you can text the artist a link to claim this tattoo.
                  </Text>
                </View>
              ) : null}
              <TouchableOpacity onPress={() => { setInviteMethod('email'); setArtistInvitePhone(''); }}>
                <Text style={s.inviteMethodToggle}>Rather send an email?</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      <Text style={s.fieldLabel}>Studio <Text style={{ fontSize: 12, fontWeight: '400', color: colors.textMuted }}>(try adding city for better results)</Text></Text>
      <StudioAutocomplete
        value={selectedStudio}
        onChange={(studio) => {
          setSelectedStudio(studio);
          if (studio?.location && !attributedLocation.trim()) {
            setAttributedLocation(studio.location);
          }
        }}
        label=""
        placeholder="Search for the studio"
        onFocus={() => {
          setTimeout(() => detailsScrollRef.current?.scrollToEnd({ animated: true }), 300);
        }}
      />
    </ScrollView>
  );

  const renderStep3 = () => (
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

      {selectedStyleIds.length > 0 && (
        <View style={s.reviewSection}>
          <Text style={s.reviewLabel}>Styles</Text>
          <View style={s.chipGrid}>
            {stylesList.filter((st: any) => selectedStyleIds.includes(st.id)).map((st: any) => (
              <View key={st.id} style={s.reviewChip}>
                <Text style={s.reviewChipText}>{st.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {selectedTagIds.length > 0 && (
        <View style={s.reviewSection}>
          <Text style={s.reviewLabel}>Tags</Text>
          <View style={s.chipGrid}>
            {[...tagsList, ...createdTags].filter((t: any) => selectedTagIds.includes(t.id)).map((t: any) => (
              <View key={t.id} style={s.reviewTagChip}>
                <Text style={s.reviewTagChipText}>{t.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {selectedArtist && artistMode === 'search' && (
        <View style={s.reviewSection}>
          <Text style={s.reviewLabel}>Artist</Text>
          <Text style={s.reviewValue}>@{selectedArtist.username}</Text>
        </View>
      )}

      {artistMode === 'manual' && attributedArtistName.trim() ? (
        <View style={s.reviewSection}>
          <Text style={s.reviewLabel}>Attributed Artist</Text>
          <Text style={s.reviewValue}>
            {attributedArtistName.trim()}
            {attributedLocation.trim() ? ` - ${attributedLocation.trim()}` : ''}
          </Text>
          {artistInvitePhone.trim() ? (
            <Text style={[s.reviewValue, { fontSize: 13, color: colors.textMuted, marginTop: 4 }]}>
              Text invite will be sent to {artistInvitePhone.trim()}
            </Text>
          ) : null}
        </View>
      ) : null}

      {selectedStudio && (
        <View style={s.reviewSection}>
          <Text style={s.reviewLabel}>Studio</Text>
          <Text style={s.reviewValue}>
            {selectedStudio.name}
            {selectedStudio.location ? ` - ${selectedStudio.location}` : ''}
          </Text>
        </View>
      )}

      <View style={s.visibilityInfo}>
        <MaterialIcons name="info-outline" size={16} color={colors.textMuted} />
        <Text style={s.visibilityText}>
          {selectedArtist && artistMode === 'search'
            ? 'This tattoo will appear on your profile immediately and in the main feed after the artist approves.'
            : 'This tattoo will be visible on the main feed immediately.'}
        </Text>
      </View>
    </ScrollView>
  );

  const stepRenderers = [renderStep0, renderStep2, renderStep1, renderStep3];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.stepBar}>
        {['Images', 'Details', 'Styles', 'Review'].map((label, i) => (
          <View key={label} style={[s.stepDot, i <= step && s.stepDotActive]}>
            <Text style={[s.stepDotText, i <= step && s.stepDotTextActive]}>{label}</Text>
          </View>
        ))}
      </View>

      <KeyboardAvoidingView
        style={s.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
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

          {step < 3 ? (
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

      <MultiSelectPicker
        visible={showTagsPicker}
        title="Select Tags"
        options={[...tagsList, ...createdTags.filter(ct => !tagsList.some((t: any) => t.id === ct.id))]}
        selected={selectedTagIds}
        onToggle={toggleTag}
        onClose={() => setShowTagsPicker(false)}
        searchPlaceholder="Search tags..."
        initialDisplayCount={30}
        onCreateNew={handleCreateTag}
      />

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
  stepHint: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 16 },

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
  pickerButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
  },
  pickerText: { color: colors.textPrimary, fontSize: 15 },
  pickerPlaceholder: { color: colors.textMuted, fontSize: 15 },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textSecondary, fontSize: 13 },
  chipTextSelected: { color: colors.background, fontWeight: '600' },
  tagChipSelected: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
    borderWidth: 1, borderColor: colors.tag, backgroundColor: `${colors.tag}20`,
  },
  tagChipSelectedText: { color: colors.tag, fontSize: 13 },

  // AI suggestions
  aiSection: {
    backgroundColor: colors.aiSuggestionDim,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${colors.aiSuggestion}30`,
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
  aiSubLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
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
    borderStyle: 'dashed' as any,
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
    fontStyle: 'italic' as any,
  },

  modeToggle: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeToggleBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 20, borderWidth: 1,
    borderColor: colors.border, alignItems: 'center',
  },
  modeToggleBtnActive: { borderColor: colors.accent, backgroundColor: colors.accent, borderWidth: 1 },
  modeToggleText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  modeToggleTextActive: { color: colors.background },

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

  emailExistsBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: `${colors.accent}15`, borderWidth: 1, borderColor: `${colors.accent}40`,
    borderRadius: 8, padding: 12, marginTop: 8,
  },
  emailExistsText: { flex: 1, color: colors.accent, fontSize: 13, lineHeight: 18 },
  emailExistsButton: {
    backgroundColor: colors.accent, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8,
  },
  emailExistsButtonText: { color: colors.background, fontSize: 13, fontWeight: '600' },

  inviteMethodToggle: { color: colors.accent, fontSize: 13, marginTop: 6 },

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
  reviewChip: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    backgroundColor: `${colors.accent}20`,
  },
  reviewChipText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  reviewTagChip: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    backgroundColor: `${colors.tag}20`,
  },
  reviewTagChipText: { color: colors.tag, fontSize: 12 },
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

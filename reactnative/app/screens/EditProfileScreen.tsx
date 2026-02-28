import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import ImageCropPicker from 'react-native-image-crop-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { uploadImagesToS3, type ImageFile } from '../../lib/s3Upload';
import { userService } from '../../lib/services';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useStyles } from '@inkedin/shared/hooks';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import StyleTag from '../components/common/StyleTag';
import LocationAutocomplete from '../components/common/LocationAutocomplete';
import Avatar from '../components/common/Avatar';

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'x', label: 'X (Twitter)' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'bluesky', label: 'Bluesky' },
];

export default function EditProfileScreen({ navigation }: any) {
  const { user, updateUser, refreshUser } = useAuth();
  const { showSnackbar } = useSnackbar();
  const { styles: allStyles } = useStyles(api);

  const u = user as any;
  const isArtist = u?.type === 'artist' || u?.type_id === 2;

  // Basic info state
  const [name, setName] = useState(u?.name || '');
  const [bio, setBio] = useState(u?.about || '');
  const [phone, setPhone] = useState(u?.phone || '');
  const [location, setLocation] = useState(u?.location || '');
  const [locationLatLong, setLocationLatLong] = useState(u?.location_lat_long || '');

  // Styles state
  const [selectedStyles, setSelectedStyles] = useState<number[]>(
    Array.isArray(u?.styles) ? u.styles : [],
  );
  const [stylesLoaded, setStylesLoaded] = useState(selectedStyles.length > 0);

  // Fetch authoritative styles from API on mount
  useEffect(() => {
    const load = async () => {
      try {
        const freshUser = await refreshUser();
        const styles = (freshUser as any)?.styles;
        if (Array.isArray(styles)) {
          setSelectedStyles(styles);
        }
      } finally {
        setStylesLoaded(true);
      }
    };
    load();
  }, []);

  // Social media state (artists only)
  const existingLinks: any[] = u?.social_media_links || [];
  const getLinkUsername = (platform: string): string => {
    const link = existingLinks.find((l: any) => l.platform === platform);
    return link?.username || '';
  };

  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({
    instagram: getLinkUsername('instagram'),
    facebook: getLinkUsername('facebook'),
    x: getLinkUsername('x'),
    tiktok: getLinkUsername('tiktok'),
    bluesky: getLinkUsername('bluesky'),
  });

  // Photo state
  const existingImageUri = typeof u?.image === 'string' && u.image ? u.image : u?.image?.uri;
  const [photoUri, setPhotoUri] = useState<string | null>(existingImageUri || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Form state
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePickImage = useCallback(async (source: 'library' | 'camera') => {
    const cropOptions = {
      mediaType: 'photo' as const,
      cropping: true,
      cropperCircleOverlay: true,
      width: 800,
      height: 800,
      compressImageQuality: 0.8,
    };

    try {
      const image = source === 'library'
        ? await ImageCropPicker.openPicker(cropOptions)
        : await ImageCropPicker.openCamera(cropOptions);

      const previousUri = photoUri;
      setPhotoUri(image.path);
      setUploadingPhoto(true);

      try {
        const imageFile: ImageFile = {
          uri: image.path,
          type: image.mime || 'image/jpeg',
          name: image.filename || `profile_${Date.now()}.jpg`,
        };
        const uploaded = await uploadImagesToS3(api, [imageFile], 'profile');
        await userService.uploadProfilePhoto(uploaded[0].id);
        await refreshUser();
        showSnackbar('Profile photo updated');
      } catch (err: any) {
        setPhotoUri(previousUri);
        showSnackbar(err.message || 'Failed to upload photo', 'error');
      } finally {
        setUploadingPhoto(false);
      }
    } catch {
      // User cancelled
    }
  }, [photoUri, refreshUser, showSnackbar]);

  const handleRemovePhoto = useCallback(async () => {
    setUploadingPhoto(true);
    try {
      await userService.deleteProfilePhoto();
      setPhotoUri(null);
      await refreshUser();
      showSnackbar('Profile photo removed');
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to remove photo', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  }, [refreshUser, showSnackbar]);

  const handleChangePhoto = useCallback(() => {
    const hasPhoto = !!photoUri;

    if (Platform.OS === 'ios') {
      const options = hasPhoto
        ? ['Choose from Library', 'Take Photo', 'Remove Photo', 'Cancel']
        : ['Choose from Library', 'Take Photo', 'Cancel'];
      const cancelIndex = options.length - 1;
      const destructiveIndex = hasPhoto ? 2 : undefined;

      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex, destructiveButtonIndex: destructiveIndex },
        (index) => {
          if (index === 0) handlePickImage('library');
          else if (index === 1) handlePickImage('camera');
          else if (hasPhoto && index === 2) handleRemovePhoto();
        },
      );
    } else {
      const buttons: any[] = [
        { text: 'Choose from Library', onPress: () => handlePickImage('library') },
        { text: 'Take Photo', onPress: () => handlePickImage('camera') },
      ];
      if (hasPhoto) {
        buttons.push({ text: 'Remove Photo', style: 'destructive', onPress: handleRemovePhoto });
      }
      buttons.push({ text: 'Cancel', style: 'cancel' });
      Alert.alert('Change Photo', undefined, buttons);
    }
  }, [photoUri, handlePickImage, handleRemovePhoto]);

  const toggleStyle = useCallback((id: number) => {
    setSelectedStyles(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    );
  }, []);

  const updateSocialLink = useCallback((platform: string, value: string) => {
    // Strip @ prefix if user includes it
    const cleaned = value.startsWith('@') ? value.slice(1) : value;
    setSocialLinks(prev => ({ ...prev, [platform]: cleaned }));
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);

    try {
      // Update basic info + styles (only include styles once loaded from API)
      const payload: any = {
        name: name.trim(),
        about: bio.trim(),
        phone: phone.trim(),
        location: location.trim(),
        location_lat_long: locationLatLong,
      };
      if (stylesLoaded) {
        payload.styles = selectedStyles;
      }
      await updateUser(payload);

      // Update social links (artists only)
      if (isArtist) {
        const links = SOCIAL_PLATFORMS
          .filter(p => socialLinks[p.key]?.trim())
          .map(p => ({
            platform: p.key,
            username: socialLinks[p.key].trim(),
          }));

        if (links.length > 0) {
          await api.post('/users/me/social-links', { links }, { requiresAuth: true });
        }
      }

      // Refresh user data to get the full updated object
      await refreshUser();

      showSnackbar('Profile updated');
      navigation.goBack();
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.7} disabled={uploadingPhoto}>
            <View style={styles.avatarWrapper}>
              <Avatar uri={photoUri} name={u?.name} size={100} />
              {uploadingPhoto && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator size="small" color={colors.accent} />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <MaterialIcons name="camera-alt" size={14} color={colors.textPrimary} />
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleChangePhoto} disabled={uploadingPhoto}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
          {photoUri && !uploadingPhoto && (
            <TouchableOpacity onPress={handleRemovePhoto}>
              <Text style={styles.removePhotoText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Basic Info */}
        <Text style={styles.sectionTitle}>Basic Info</Text>

        <Input
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          error={errors.name}
          autoCapitalize="words"
        />

        <Input
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Tell people about yourself..."
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />

        <Input
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone number"
          keyboardType="phone-pad"
        />

        <LocationAutocomplete
          value={location}
          onChange={(loc, latLong) => {
            setLocation(loc);
            setLocationLatLong(latLong);
          }}
        />

        {/* Styles */}
        <Text style={styles.sectionTitle}>{isArtist ? 'Styles' : 'Styles I Like'}</Text>

        {/* Show currently selected styles at top for easy deselect */}
        {selectedStyles.length > 0 && (
          <>
            <Text style={styles.sectionHint}>Your styles (tap to remove)</Text>
            <View style={styles.tagsContainer}>
              {allStyles
                .filter(s => selectedStyles.includes(s.id))
                .map(style => (
                  <StyleTag
                    key={style.id}
                    label={style.name}
                    selected
                    onPress={() => toggleStyle(style.id)}
                  />
                ))}
            </View>
          </>
        )}

        <Text style={styles.sectionHint}>
          {selectedStyles.length > 0 ? 'Add more styles' : isArtist ? 'Select the styles you specialize in' : 'Select styles you like'}
        </Text>
        <View style={styles.tagsContainer}>
          {allStyles
            .filter(s => !selectedStyles.includes(s.id))
            .map(style => (
              <StyleTag
                key={style.id}
                label={style.name}
                onPress={() => toggleStyle(style.id)}
              />
            ))}
        </View>

        {/* Social Media (Artists only) */}
        {isArtist && (
          <>
            <Text style={styles.sectionTitle}>Social Media</Text>
            <Text style={styles.sectionHint}>
              Add your social media usernames so clients can find you
            </Text>

            {SOCIAL_PLATFORMS.map(platform => (
              <Input
                key={platform.key}
                label={platform.label}
                value={socialLinks[platform.key]}
                onChangeText={(val: string) => updateSocialLink(platform.key, val)}
                placeholder={`@your${platform.key}handle`}
                autoCapitalize="none"
                autoCorrect={false}
              />
            ))}
          </>
        )}

        {/* Actions */}
        <View style={styles.buttons}>
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={styles.buttonHalf}
          />
          <Button
            title="Save"
            onPress={handleSave}
            loading={saving}
            style={styles.buttonHalf}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 52,
    padding: 2,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  removePhotoText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionHint: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 12,
    marginTop: -4,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 40,
  },
  buttonHalf: {
    flex: 1,
  },
});

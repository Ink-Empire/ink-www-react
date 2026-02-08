import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors } from '../../../lib/colors';
import { api } from '../../../lib/api';
import type { ImageFile } from '../../../lib/s3Upload';
import Input from '../common/Input';
import Button from '../common/Button';
import LocationAutocomplete from '../common/LocationAutocomplete';
import StudioAutocomplete from '../common/StudioAutocomplete';
import type { StudioOption } from '../common/StudioAutocomplete';

interface UserDetailsData {
  name: string;
  username: string;
  bio: string;
  location: string;
  locationLatLong: string;
  profileImage?: ImageFile;
  studioAffiliation?: {
    studioId: number;
    studioName: string;
    isNew: boolean;
    isClaimed: boolean;
  };
}

interface UserDetailsStepProps {
  onComplete: (details: UserDetailsData) => void;
  onBack: () => void;
  userType: 'client' | 'artist';
}

export default function UserDetailsStep({ onComplete, onBack, userType }: UserDetailsStepProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [locationLatLong, setLocationLatLong] = useState('');
  const [profileImage, setProfileImage] = useState<ImageFile | null>(null);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [studioAffiliation, setStudioAffiliation] = useState<StudioOption | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkingUsername, setCheckingUsername] = useState(false);

  const checkUsernameAvailability = useCallback(async (value: string) => {
    if (value.length < 3) return;
    setCheckingUsername(true);
    try {
      const response = await api.post<any>('/check-availability', { username: value });
      if (!response.available) {
        setErrors(prev => ({ ...prev, username: 'Username is already taken' }));
      } else {
        setErrors(prev => {
          const next = { ...prev };
          delete next.username;
          return next;
        });
      }
    } catch {
      // Ignore network errors during check
    } finally {
      setCheckingUsername(false);
    }
  }, []);

  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.uri) {
          setProfileImageUri(asset.uri);
          setProfileImage({
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || 'profile.jpg',
          });
        }
      }
    } catch {
      // User cancelled or error
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      newErrors.username = 'Only letters, numbers, periods, and underscores';
    } else if (username.length > 30) {
      newErrors.username = 'Username must be 30 characters or less';
    }
    if (userType === 'artist') {
      if (!bio.trim()) {
        newErrors.bio = 'Bio is required for artists';
      } else if (bio.trim().length < 10) {
        newErrors.bio = 'Bio must be at least 10 characters';
      } else if (bio.trim().length > 500) {
        newErrors.bio = 'Bio must be 500 characters or less';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;
    onComplete({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      bio: bio.trim(),
      location: location.trim(),
      locationLatLong,
      profileImage: profileImage || undefined,
      studioAffiliation: studioAffiliation ? {
        studioId: studioAffiliation.id,
        studioName: studioAffiliation.name,
        isNew: studioAffiliation.is_new,
        isClaimed: studioAffiliation.is_claimed,
      } : undefined,
    });
  };

  const title = userType === 'artist' ? 'Tell us about yourself' : 'Create your profile';

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        Let's set up your profile so others can get to know you better.
      </Text>

      <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage}>
        {profileImageUri ? (
          <Image source={{ uri: profileImageUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <MaterialIcons name="camera-alt" size={32} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.cameraOverlay}>
          <MaterialIcons name="add-a-photo" size={16} color={colors.textPrimary} />
        </View>
      </TouchableOpacity>
      <Text style={styles.avatarCaption}>Click to add a profile photo (optional)</Text>

      <Input
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Your full name"
        error={errors.name}
        autoCapitalize="words"
      />

      <Input
        label="Username"
        value={username}
        onChangeText={(text) => {
          setUsername(text.toLowerCase());
          if (text.length >= 3) checkUsernameAvailability(text.toLowerCase());
        }}
        placeholder="Choose a unique username"
        error={errors.username}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View>
        <Input
          label={userType === 'artist' ? 'Bio' : 'Bio (optional)'}
          value={bio}
          onChangeText={setBio}
          placeholder={
            userType === 'artist'
              ? 'Tell people about your tattoo style, experience, and what inspires your art...'
              : 'A little about yourself...'
          }
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
          error={errors.bio}
        />
        {userType === 'artist' && (
          <Text style={styles.charCount}>
            {bio.length}/500
          </Text>
        )}
      </View>

      <LocationAutocomplete
        value={location}
        onChange={(loc, latLong) => {
          setLocation(loc);
          setLocationLatLong(latLong);
        }}
      />

      {userType === 'artist' && (
        <View style={styles.studioSection}>
          <Text style={styles.studioTitle}>Studio Affiliation
            <Text style={styles.studioOptional}> (Optional)</Text>
          </Text>
          <Text style={styles.studioDescription}>
            Are you affiliated with a tattoo studio? Search to link your profile to an existing studio.
          </Text>

          {location.length > 0 && !locationLatLong && (
            <View style={styles.infoBox}>
              <MaterialIcons name="info-outline" size={16} color={colors.info} />
              <Text style={styles.infoText}>
                Please select your location from the dropdown above to see studios near you.
              </Text>
            </View>
          )}

          <StudioAutocomplete
            value={studioAffiliation}
            onChange={(studio) => setStudioAffiliation(studio)}
            label="Search for your studio"
            placeholder="Start typing studio name..."
            location={locationLatLong || undefined}
          />
          {studioAffiliation && (
            <View style={styles.studioConfirm}>
              <MaterialIcons name="store" size={18} color={colors.accent} />
              <Text style={styles.studioConfirmText}>
                You'll be linked to: <Text style={styles.studioName}>{studioAffiliation.name}</Text>
                {studioAffiliation.location ? (
                  <Text style={styles.studioLocation}> - {studioAffiliation.location}</Text>
                ) : null}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.buttons}>
        <Button title="Back" onPress={onBack} variant="secondary" style={styles.buttonHalf} />
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={checkingUsername}
          loading={checkingUsername}
          style={styles.buttonHalf}
        />
      </View>

      <Text style={styles.footer}>
        You can always update your profile information later in your settings.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.accent,
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCaption: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  charCount: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: -12,
    marginBottom: 8,
  },
  studioSection: {
    marginBottom: 8,
  },
  studioTitle: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  studioOptional: {
    fontWeight: 'normal',
    fontSize: 14,
    color: colors.textMuted,
  },
  studioDescription: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 149, 237, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  infoText: {
    color: colors.info,
    fontSize: 13,
    flex: 1,
  },
  studioConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentDim,
    borderRadius: 8,
    padding: 12,
    marginTop: -8,
  },
  studioConfirmText: {
    color: colors.textPrimary,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  studioName: {
    fontWeight: '700',
  },
  studioLocation: {
    color: colors.textSecondary,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  buttonHalf: {
    flex: 1,
  },
  footer: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 32,
  },
});

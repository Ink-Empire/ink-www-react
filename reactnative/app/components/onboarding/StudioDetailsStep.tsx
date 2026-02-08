import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
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
import PasswordRequirements, { allRequirementsMet } from './PasswordRequirements';

export interface StudioDetailsData {
  studioResult?: StudioOption;
  name: string;
  username: string;
  bio: string;
  email: string;
  phone: string;
  location: string;
  locationLatLong: string;
  studioPhoto?: ImageFile;
  password?: string;
  password_confirmation?: string;
}

interface StudioDetailsStepProps {
  onComplete: (data: StudioDetailsData) => void;
  onBack: () => void;
  isAuthenticated: boolean;
}

export default function StudioDetailsStep({ onComplete, onBack, isAuthenticated }: StudioDetailsStepProps) {
  const [mode, setMode] = useState<'search' | 'manual'>('search');
  const [studioResult, setStudioOption] = useState<StudioOption | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [locationLatLong, setLocationLatLong] = useState('');
  const [studioPhoto, setStudioPhoto] = useState<ImageFile | null>(null);
  const [studioPhotoUri, setStudioPhotoUri] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkingUsername, setCheckingUsername] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      // Ignore network errors
    } finally {
      setCheckingUsername(false);
    }
  }, []);

  const handlePickPhoto = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.uri) {
          setStudioPhotoUri(asset.uri);
          setStudioPhoto({
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || 'studio.jpg',
          });
        }
      }
    } catch {
      // User cancelled
    }
  };

  const handleStudioSelect = (result: StudioOption | null) => {
    setStudioOption(result);
    if (result) {
      setName(result.name);
      if (result.location) setLocation(result.location);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (mode === 'manual' || !studioResult) {
      if (!name.trim()) newErrors.name = 'Studio name is required';
      if (!username.trim()) {
        newErrors.username = 'Username is required';
      } else if (!/^[a-zA-Z0-9._]+$/.test(username)) {
        newErrors.username = 'Only letters, numbers, periods, and underscores';
      }
    }

    if (bio.trim().length > 0 && bio.trim().length < 10) {
      newErrors.bio = 'Bio must be at least 10 characters';
    } else if (bio.trim().length > 500) {
      newErrors.bio = 'Bio must be 500 characters or less';
    }

    if (!isAuthenticated) {
      if (!email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Please enter a valid email';
      }
      if (!password) {
        newErrors.password = 'Password is required';
      } else if (!allRequirementsMet(password)) {
        newErrors.password = 'Password does not meet all requirements';
      }
      if (password !== passwordConfirmation) {
        newErrors.passwordConfirmation = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onComplete({
      studioResult: studioResult || undefined,
      name: name.trim(),
      username: username.trim().toLowerCase(),
      bio: bio.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      location: location.trim(),
      locationLatLong,
      studioPhoto: studioPhoto || undefined,
      password: !isAuthenticated ? password : undefined,
      password_confirmation: !isAuthenticated ? passwordConfirmation : undefined,
    });
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Studio Details</Text>
      <Text style={styles.subtitle}>
        Tell us about your studio so clients can find you.
      </Text>

      {mode === 'search' && (
        <>
          <StudioAutocomplete
            value={studioResult}
            onChange={handleStudioSelect}
            label="Find your studio"
            placeholder="Search for your studio..."
          />

          {studioResult && (
            <View style={styles.selectedStudio}>
              <MaterialIcons name="store" size={20} color={colors.accent} />
              <Text style={styles.selectedStudioText}>
                {studioResult.name}
                {studioResult.location ? ` - ${studioResult.location}` : ''}
              </Text>
            </View>
          )}

          <TouchableOpacity onPress={() => setMode('manual')} style={styles.switchLink}>
            <Text style={styles.switchLinkText}>Or enter details manually</Text>
          </TouchableOpacity>
        </>
      )}

      {mode === 'manual' && (
        <>
          <TouchableOpacity onPress={() => setMode('search')} style={styles.switchLink}>
            <Text style={styles.switchLinkText}>Search for existing studio instead</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.photoContainer} onPress={handlePickPhoto}>
            {studioPhotoUri ? (
              <Image source={{ uri: studioPhotoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <MaterialIcons name="add-a-photo" size={32} color={colors.textMuted} />
                <Text style={styles.photoLabel}>Studio Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <Input
            label="Studio Name"
            value={name}
            onChangeText={setName}
            placeholder="Your studio name"
            error={errors.name}
          />

          <Input
            label="Studio Username"
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
              label="Bio (optional)"
              value={bio}
              onChangeText={setBio}
              placeholder="Tell people about your studio..."
              multiline
              numberOfLines={3}
              style={{ minHeight: 80, textAlignVertical: 'top' }}
              error={errors.bio}
            />
            <Text style={styles.charCount}>{bio.length}/500</Text>
          </View>

          <LocationAutocomplete
            value={location}
            onChange={(loc, latLong) => {
              setLocation(loc);
              setLocationLatLong(latLong);
            }}
          />

          <Input
            label="Studio Email (optional)"
            value={email}
            onChangeText={setEmail}
            placeholder="studio@example.com"
            error={errors.email}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Input
            label="Phone (optional)"
            value={phone}
            onChangeText={setPhone}
            placeholder="(555) 555-5555"
            keyboardType="phone-pad"
          />
        </>
      )}

      {!isAuthenticated && (
        <View style={styles.authSection}>
          <Text style={styles.authSectionTitle}>Create your account</Text>

          {mode === 'search' && (
            <>
              <Input
                label="Your Name"
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                error={errors.name}
                autoCapitalize="words"
              />
              <Input
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                error={errors.email}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </>
          )}

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a strong password"
            error={errors.password}
            secureTextEntry
          />

          <PasswordRequirements password={password} />

          <Input
            label="Confirm Password"
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
            placeholder="Confirm your password"
            error={errors.passwordConfirmation}
            secureTextEntry
          />
        </View>
      )}

      <View style={styles.buttons}>
        <Button title="Back" onPress={onBack} variant="secondary" style={styles.buttonHalf} />
        <Button
          title={studioResult?.id ? 'Claim Studio' : 'Create Studio'}
          onPress={handleSubmit}
          disabled={checkingUsername}
          loading={checkingUsername}
          style={styles.buttonHalf}
        />
      </View>

      <Text style={styles.footer}>
        You can always update your studio information later in your dashboard.
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
  selectedStudio: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentDim,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  selectedStudioText: {
    color: colors.textPrimary,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  switchLink: {
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLinkText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  photoContainer: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  charCount: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: -12,
    marginBottom: 8,
  },
  authSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 20,
    marginTop: 8,
  },
  authSectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
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

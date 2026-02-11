import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ImageCropPicker from 'react-native-image-crop-picker';
import { colors } from '../../../lib/colors';
import { api } from '../../../lib/api';
import type { ImageFile } from '../../../lib/s3Upload';
import Input from '../common/Input';
import Button from '../common/Button';
import LocationAutocomplete from '../common/LocationAutocomplete';
import StudioAutocomplete from '../common/StudioAutocomplete';
import type { StudioOption } from '../common/StudioAutocomplete';
import {
  fetchPlacesApiKey,
  getPlaceDetails,
} from '@inkedin/shared/services/googlePlacesService';
import PasswordRequirements, { allRequirementsMet } from './PasswordRequirements';

export interface StudioDetailsData {
  studioResult?: StudioOption;
  name: string;
  username: string;
  bio: string;
  email: string;
  accountEmail?: string;
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
  const [showForm, setShowForm] = useState(false);
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
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [accountEmail, setAccountEmail] = useState('');
  const [accountEmailStatus, setAccountEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accountEmailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkUsernameAvailability = useCallback((value: string) => {
    if (value.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const response = await api.post<any>('/studios/check-availability', { username: value });
        setUsernameAvailable(response.available);
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
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);
  }, []);

  const checkAccountEmailAvailability = useCallback((value: string) => {
    if (accountEmailDebounceRef.current) clearTimeout(accountEmailDebounceRef.current);

    if (!value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setAccountEmailStatus('idle');
      return;
    }

    setAccountEmailStatus('checking');
    accountEmailDebounceRef.current = setTimeout(async () => {
      try {
        const response = await api.post<any>('/check-availability', { email: value });
        if (response.available) {
          setAccountEmailStatus('available');
          setErrors(prev => {
            const next = { ...prev };
            delete next.accountEmail;
            return next;
          });
        } else {
          setAccountEmailStatus('taken');
          setErrors(prev => ({ ...prev, accountEmail: 'This email is already registered' }));
        }
      } catch {
        setAccountEmailStatus('idle');
      }
    }, 500);
  }, []);

  const handlePickPhoto = async () => {
    try {
      const image = await ImageCropPicker.openPicker({
        mediaType: 'photo',
        cropping: true,
        cropperCircleOverlay: true,
        width: 800,
        height: 800,
        compressImageQuality: 0.8,
      });

      setStudioPhotoUri(image.path);
      setStudioPhoto({
        uri: image.path,
        type: image.mime || 'image/jpeg',
        name: image.filename || 'studio.jpg',
      });
    } catch {
      // User cancelled
    }
  };

  const handleStudioSelect = async (result: StudioOption | null) => {
    setStudioOption(result);
    if (result) {
      // Prefill form fields from the selected studio
      setName(result.name);

      // Get structured location from Google Place details (City, State, Country)
      if (result.google_place_id) {
        const apiKey = await fetchPlacesApiKey(api);
        if (apiKey) {
          const details = await getPlaceDetails(result.google_place_id, apiKey);
          if (details) {
            const locationParts = [details.city, details.state, details.country].filter(Boolean);
            setLocation(locationParts.join(', '));
            if (details.lat && details.lng) {
              setLocationLatLong(`${details.lat},${details.lng}`);
            }
          }
        }
      } else if (result.location) {
        setLocation(result.location);
      }

      if (result.phone) setPhone(result.phone);

      // Clear any selection errors
      setErrors(prev => {
        const { googleStudio, ...rest } = prev;
        return rest;
      });

      // Reveal the full form
      setShowForm(true);
    }
  };

  const handleManualEntry = () => {
    setStudioOption(null);
    setShowForm(true);
  };

  const handleChangeStudio = () => {
    setStudioOption(null);
    setName('');
    setLocation('');
    setLocationLatLong('');
    setPhone('');
    setShowForm(false);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Studio name is required';
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      newErrors.username = 'Only letters, numbers, periods, and underscores';
    } else if (usernameAvailable === false) {
      newErrors.username = 'Username is already taken';
    }

    if (bio.trim().length > 0 && bio.trim().length < 10) {
      newErrors.bio = 'Bio must be at least 10 characters';
    } else if (bio.trim().length > 500) {
      newErrors.bio = 'Bio must be 500 characters or less';
    }

    if (!isAuthenticated) {
      if (!accountEmail.trim()) {
        newErrors.accountEmail = 'Account email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountEmail)) {
        newErrors.accountEmail = 'Please enter a valid email';
      } else if (accountEmailStatus === 'taken') {
        newErrors.accountEmail = 'This email is already registered';
      }
    }

    if (!isAuthenticated) {
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
      accountEmail: !isAuthenticated ? accountEmail.trim().toLowerCase() : undefined,
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

      {/* Studio Search - shown when form is not yet revealed */}
      {!showForm && (
        <>
          <StudioAutocomplete
            value={studioResult}
            onChange={handleStudioSelect}
            label="Find your studio"
            placeholder="Search for your studio..."
          />

          <TouchableOpacity onPress={handleManualEntry} style={styles.switchLink}>
            <Text style={styles.switchLinkText}>Or enter details manually</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Full form - shown after selecting a studio or clicking manual entry */}
      {showForm && (
        <>
          {/* Selected studio banner */}
          {studioResult && (
            <View style={styles.selectedStudio}>
              <MaterialIcons name="check-circle" size={20} color={colors.success} />
              <Text style={styles.selectedStudioText}>
                <Text style={styles.selectedStudioName}>{studioResult.name}</Text> found! Complete the details below.
              </Text>
              <TouchableOpacity onPress={handleChangeStudio}>
                <Text style={styles.changeLink}>Change</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Back to search link for manual entry */}
          {!studioResult && (
            <TouchableOpacity onPress={handleChangeStudio} style={styles.switchLink}>
              <Text style={styles.switchLinkText}>Search for existing studio instead</Text>
            </TouchableOpacity>
          )}

          {/* Studio Photo */}
          <TouchableOpacity style={styles.avatarContainer} onPress={handlePickPhoto}>
            {studioPhotoUri ? (
              <Image source={{ uri: studioPhotoUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialIcons name="camera-alt" size={32} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <MaterialIcons name="add-a-photo" size={16} color={colors.textPrimary} />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarCaption}>Tap to add a studio photo (optional)</Text>

          {/* Studio Name */}
          <Input
            label="Studio Name"
            value={name}
            onChangeText={setName}
            placeholder="Your studio name"
            error={errors.name}
          />

          {/* Studio Username */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Studio Username</Text>
            <View style={styles.usernameInputRow}>
              <TextInput
                style={[
                  styles.usernameInput,
                  errors.username ? styles.usernameInputError :
                  usernameAvailable === true ? styles.usernameInputSuccess : null,
                ]}
                value={username}
                onChangeText={(text) => {
                  const lower = text.replace(/\s/g, '').toLowerCase();
                  setUsername(lower);
                  setUsernameAvailable(null);
                  checkUsernameAvailability(lower);
                }}
                placeholder="Choose a unique username"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.usernameIndicator}>
                {checkingUsername && (
                  <ActivityIndicator size="small" color={colors.accent} />
                )}
                {!checkingUsername && usernameAvailable === true && (
                  <MaterialIcons name="check-circle" size={20} color={colors.success} />
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <MaterialIcons name="cancel" size={20} color={colors.error} />
                )}
              </View>
            </View>
            {errors.username ? (
              <Text style={styles.usernameError}>{errors.username}</Text>
            ) : usernameAvailable === true ? (
              <Text style={styles.usernameSuccess}>Username is available</Text>
            ) : (
              <Text style={styles.usernameHint}>This will be your studio's unique URL</Text>
            )}
          </View>

          {/* Bio */}
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

          {/* Location */}
          <LocationAutocomplete
            value={location}
            onChange={(loc, latLong) => {
              setLocation(loc);
              setLocationLatLong(latLong);
            }}
          />

          {/* Studio Email */}
          <Input
            label="Studio Contact Email"
            value={email}
            onChangeText={(text) => setEmail(text.replace(/\s/g, ''))}
            placeholder="studio@example.com"
            error={errors.email}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Text style={styles.fieldHint}>
            Public contact email for your studio. Can be any email address.
          </Text>

          {/* Phone */}
          <Input
            label="Phone (optional)"
            value={phone}
            onChangeText={setPhone}
            placeholder="(555) 555-5555"
            keyboardType="phone-pad"
          />
        </>
      )}

      {/* Account creation fields for new users */}
      {showForm && !isAuthenticated && (
        <View style={styles.authSection}>
          <Text style={styles.authSectionTitle}>Create your account</Text>

          <Input
            label="Account Email"
            value={accountEmail}
            onChangeText={(text) => {
              const trimmed = text.replace(/\s/g, '');
              setAccountEmail(trimmed);
              checkAccountEmailAvailability(trimmed);
            }}
            placeholder="your.email@example.com"
            error={errors.accountEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
          <Text style={styles.fieldHint}>
            Your personal login email. Can be the same as the studio email.
          </Text>

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
          disabled={!showForm || checkingUsername || usernameAvailable === false || (!isAuthenticated && (accountEmailStatus === 'taken' || accountEmailStatus === 'checking'))}
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
    color: colors.textSecondary,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    flexShrink: 1,
  },
  selectedStudioName: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  changeLink: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
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
    marginBottom: 16,
  },
  fieldHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 6,
  },
  usernameInputRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  usernameInput: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    color: colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingRight: 40,
    paddingVertical: 12,
  },
  usernameInputError: {
    borderColor: colors.error,
  },
  usernameInputSuccess: {
    borderColor: colors.success,
  },
  usernameIndicator: {
    position: 'absolute',
    right: 12,
    alignItems: 'center',
  },
  usernameError: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  usernameSuccess: {
    color: colors.success,
    fontSize: 12,
    marginTop: 4,
  },
  usernameHint: {
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

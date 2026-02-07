import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../../lib/colors';
import { api } from '../../../lib/api';
import Input from '../common/Input';
import Button from '../common/Button';
import LocationAutocomplete from '../common/LocationAutocomplete';

interface UserDetailsData {
  name: string;
  username: string;
  bio: string;
  location: string;
  locationLatLong: string;
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
    });
  };

  const title = userType === 'artist' ? 'Your Artist Profile' : 'Your Profile';

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Tell us about yourself</Text>

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
        placeholder="your_username"
        error={errors.username}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Input
        label={userType === 'artist' ? 'About You' : 'Bio (optional)'}
        value={bio}
        onChangeText={setBio}
        placeholder={userType === 'artist' ? 'Tell clients about your work...' : 'A little about yourself...'}
        multiline
        numberOfLines={3}
        style={{ minHeight: 80, textAlignVertical: 'top' }}
      />

      <LocationAutocomplete
        value={location}
        onChange={(loc, latLong) => {
          setLocation(loc);
          setLocationLatLong(latLong);
        }}
      />

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
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  buttonHalf: {
    flex: 1,
  },
});

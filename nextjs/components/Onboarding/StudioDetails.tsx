import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  Avatar,
  IconButton,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Store as StoreIcon,
  LocationOn as LocationOnIcon,
  MyLocation as MyLocationIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAppGeolocation } from '../../utils/geolocation';
import { colors } from '@/styles/colors';
import LocationAutocomplete from '../LocationAutocomplete';
import { api } from '@/utils/api';

interface StudioDetailsProps {
  onStepComplete: (studioDetails: {
    name: string;
    username: string;
    bio: string;
    profileImage?: File | null;
    location: string;
    locationLatLong: string;
    email?: string;
    phone?: string;
  }) => void;
  onBack: () => void;
}

const StudioDetails: React.FC<StudioDetailsProps> = ({
  onStepComplete,
  onBack,
}) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [locationLatLong, setLocationLatLong] = useState('');
  const [useMyLocation, setUseMyLocation] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Availability checking state
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const usernameDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const emailDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getCurrentPosition, getLocation } = useAppGeolocation();

  // Check username availability
  const checkUsernameAvailability = useCallback(async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    // Validate format first
    if (!/^[a-zA-Z0-9_]+$/.test(usernameToCheck)) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await api.post<{ available: boolean }>('/studios/check-availability', {
        username: usernameToCheck.toLowerCase(),
      });
      setUsernameAvailable(response.available);
      if (!response.available) {
        setErrors(prev => ({ ...prev, username: 'This username is already taken' }));
      } else {
        setErrors(prev => {
          const { username, ...rest } = prev;
          if (username === 'This username is already taken') {
            return rest;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Error checking username availability:', err);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  }, []);

  // Check email availability (only if email is provided)
  const checkEmailAvailability = useCallback(async (emailToCheck: string) => {
    if (!emailToCheck || !emailToCheck.includes('@')) {
      setEmailAvailable(null);
      return;
    }

    // Validate email format first
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToCheck)) {
      setEmailAvailable(null);
      return;
    }

    setCheckingEmail(true);
    try {
      const response = await api.post<{ available: boolean }>('/studios/check-availability', {
        email: emailToCheck.toLowerCase(),
      });
      setEmailAvailable(response.available);
      if (!response.available) {
        setErrors(prev => ({ ...prev, email: 'This email is already registered to another studio' }));
      } else {
        setErrors(prev => {
          const { email, ...rest } = prev;
          if (email === 'This email is already registered to another studio') {
            return rest;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Error checking email availability:', err);
      setEmailAvailable(null);
    } finally {
      setCheckingEmail(false);
    }
  }, []);

  // Debounced username check
  useEffect(() => {
    if (usernameDebounceRef.current) {
      clearTimeout(usernameDebounceRef.current);
    }

    if (username && username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username)) {
      usernameDebounceRef.current = setTimeout(() => {
        checkUsernameAvailability(username);
      }, 500);
    } else {
      setUsernameAvailable(null);
    }

    return () => {
      if (usernameDebounceRef.current) {
        clearTimeout(usernameDebounceRef.current);
      }
    };
  }, [username, checkUsernameAvailability]);

  // Debounced email check (only when email is provided)
  useEffect(() => {
    if (emailDebounceRef.current) {
      clearTimeout(emailDebounceRef.current);
    }

    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailDebounceRef.current = setTimeout(() => {
        checkEmailAvailability(email);
      }, 500);
    } else {
      setEmailAvailable(null);
    }

    return () => {
      if (emailDebounceRef.current) {
        clearTimeout(emailDebounceRef.current);
      }
    };
  }, [email, checkEmailAvailability]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, profileImage: 'Please select a valid image file' }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profileImage: 'Image must be less than 5MB' }));
        return;
      }

      setProfileImage(file);
      setErrors(prev => ({ ...prev, profileImage: '' }));

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const toggleLocationMethod = () => {
    setUseMyLocation(!useMyLocation);
    if (!useMyLocation) {
      // Switching to "use my location"
      handleGetCurrentLocation();
    } else {
      // Switching to manual entry
      setLocation('');
      setLocationLatLong('');
      setErrors(prev => ({ ...prev, location: '' }));
    }
  };

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    setErrors(prev => ({ ...prev, location: '' }));

    try {
      const position = await getCurrentPosition();
      const lat = position.latitude;
      const lng = position.longitude;
      setLocationLatLong(`${lat},${lng}`);

      // Use reverse geocoding to get address
      const locationData = await getLocation(lat, lng);

      if (locationData.items && locationData.items.length > 0) {
        const address = locationData.items[0].address;

        const locationStr = [
          address.city,
          address.state,
          address.countryCode
        ].filter(Boolean).join(', ');

        setLocation(locationStr || 'Current Location');
      } else {
        setLocation('Current Location');
      }
    } catch (err) {
      console.error('Failed to get current location:', err);
      setErrors(prev => ({ ...prev, location: 'Unable to get your location. Please enter it manually.' }));
      setUseMyLocation(false);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Studio name is required';
    }

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    } else if (usernameAvailable === false) {
      newErrors.username = 'This username is already taken';
    }

    if (!bio.trim()) {
      newErrors.bio = 'Bio is required';
    } else if (bio.length < 10) {
      newErrors.bio = 'Bio must be at least 10 characters';
    } else if (bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    if (!location.trim()) {
      newErrors.location = 'Location is required';
    }

    // Email is optional, but if provided must be valid format and available
    if (email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      } else if (emailAvailable === false) {
        newErrors.email = 'This email is already registered to another studio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper to get username field adornment
  const getUsernameAdornment = () => {
    if (checkingUsername) {
      return <CircularProgress size={20} sx={{ color: colors.accent }} />;
    }
    if (usernameAvailable === true && username.length >= 3) {
      return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
    }
    if (usernameAvailable === false) {
      return <CancelIcon sx={{ color: colors.error }} />;
    }
    return null;
  };

  // Helper to get email field adornment
  const getEmailAdornment = () => {
    if (!email) return null;
    if (checkingEmail) {
      return <CircularProgress size={20} sx={{ color: colors.accent }} />;
    }
    if (emailAvailable === true) {
      return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
    }
    if (emailAvailable === false) {
      return <CancelIcon sx={{ color: colors.error }} />;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onStepComplete({
        name: name.trim(),
        username: username.trim(),
        bio: bio.trim(),
        profileImage,
        location: location.trim(),
        locationLatLong: locationLatLong,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
    } catch (error) {
      console.error('Error submitting studio details:', error);
      setErrors({ submit: 'Failed to save details. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            mb: 2,
            fontWeight: 'bold',
            color: colors.textSecondary,
          }}
        >
          Tell us about your studio
        </Typography>

        <Typography
          variant="body1"
          sx={{
            mb: 3,
            color: 'text.secondary',
            fontSize: '1.1rem',
            lineHeight: 1.6,
          }}
        >
          Now let's set up your studio's public profile.
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Stack spacing={4}>
          {/* Studio Image */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, color: colors.textSecondary }}
            >
              Studio Photo or Logo
            </Typography>

            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                src={profileImagePreview || undefined}
                sx={{
                  width: 120,
                  height: 120,
                  backgroundColor: '#ffffff',
                  color: '#000',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 20px rgba(51, 153, 137, 0.3)',
                  },
                }}
                onClick={handleImageClick}
              >
                {!profileImagePreview && <StoreIcon sx={{ fontSize: 60 }} />}
              </Avatar>

              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: -5,
                  right: -5,
                  backgroundColor: colors.accent,
                  color: '#000',
                  width: 40,
                  height: 40,
                  '&:hover': {
                    backgroundColor: colors.accentDark,
                  },
                }}
                onClick={handleImageClick}
              >
                <PhotoCameraIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />

            <Typography
              variant="body2"
              sx={{
                mt: 1,
                color: 'text.secondary',
                fontStyle: 'italic',
              }}
            >
              Click to add a studio photo or logo (optional)
            </Typography>

            {errors.profileImage && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {errors.profileImage}
              </Alert>
            )}
          </Box>

          {/* Studio Name Field */}
          <TextField
            label="Studio Name"
            name="studio_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your studio's name"
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            required
            autoComplete="organization"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(232, 219, 197, 0.5)',
                },
                '&:hover fieldset': {
                  borderColor: colors.textSecondary,
                },
                '&.Mui-focused fieldset': {
                  borderColor: colors.accent,
                },
              },
              '& .MuiInputLabel-root': {
                color: colors.textSecondary,
                '&.Mui-focused': {
                  color: colors.accent,
                },
              },
            }}
          />

          {/* Username Field */}
          <TextField
            label="Studio Username"
            name="studio_username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="Choose a unique username for your studio"
            error={!!errors.username || usernameAvailable === false}
            helperText={
              errors.username ||
              (usernameAvailable === true && username.length >= 3
                ? `Username available! Your URL: inkedin.com/studios/${username}`
                : `This will be your studio's URL: inkedin.com/studios/${username || 'username'}`)
            }
            fullWidth
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {getUsernameAdornment()}
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: usernameAvailable === true ? '#4caf50' :
                               usernameAvailable === false ? colors.error :
                               'rgba(232, 219, 197, 0.5)',
                },
                '&:hover fieldset': {
                  borderColor: usernameAvailable === true ? '#4caf50' :
                               usernameAvailable === false ? colors.error :
                               colors.textSecondary,
                },
                '&.Mui-focused fieldset': {
                  borderColor: usernameAvailable === true ? '#4caf50' :
                               usernameAvailable === false ? colors.error :
                               colors.accent,
                },
              },
              '& .MuiInputLabel-root': {
                color: colors.textSecondary,
                '&.Mui-focused': {
                  color: colors.accent,
                },
              },
              '& .MuiFormHelperText-root': {
                color: usernameAvailable === true ? '#4caf50' :
                       errors.username ? colors.error :
                       colors.textSecondary,
              },
            }}
          />

          {/* Bio Field */}
          <TextField
            label="Studio Bio"
            name="studio_bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Describe your studio's atmosphere, specialties, and what makes you unique..."
            error={!!errors.bio}
            helperText={errors.bio || `${bio.length}/500 characters`}
            fullWidth
            multiline
            rows={4}
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(232, 219, 197, 0.5)',
                },
                '&:hover fieldset': {
                  borderColor: colors.textSecondary,
                },
                '&.Mui-focused fieldset': {
                  borderColor: colors.accent,
                },
              },
              '& .MuiInputLabel-root': {
                color: colors.textSecondary,
                '&.Mui-focused': {
                  color: colors.accent,
                },
              },
            }}
          />

          {/* Email Field (Optional) */}
          <TextField
            label="Studio Email (Optional)"
            name="studio_email"
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
            placeholder="contact@yourstudio.com"
            error={!!errors.email || emailAvailable === false}
            helperText={
              errors.email ||
              (emailAvailable === true ? 'Email available!' : 'A public contact email for your studio')
            }
            fullWidth
            type="email"
            autoComplete="email"
            InputProps={{
              endAdornment: getEmailAdornment() ? (
                <InputAdornment position="end">
                  {getEmailAdornment()}
                </InputAdornment>
              ) : undefined,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: emailAvailable === true ? '#4caf50' :
                               emailAvailable === false ? colors.error :
                               'rgba(232, 219, 197, 0.5)',
                },
                '&:hover fieldset': {
                  borderColor: emailAvailable === true ? '#4caf50' :
                               emailAvailable === false ? colors.error :
                               colors.textSecondary,
                },
                '&.Mui-focused fieldset': {
                  borderColor: emailAvailable === true ? '#4caf50' :
                               emailAvailable === false ? colors.error :
                               colors.accent,
                },
              },
              '& .MuiInputLabel-root': {
                color: colors.textSecondary,
                '&.Mui-focused': {
                  color: colors.accent,
                },
              },
              '& .MuiFormHelperText-root': {
                color: emailAvailable === true ? '#4caf50' :
                       errors.email ? colors.error :
                       colors.textSecondary,
              },
            }}
          />

          {/* Phone Field (Optional) */}
          <TextField
            label="Studio Phone (Optional)"
            name="studio_phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            error={!!errors.phone}
            helperText={errors.phone || 'A contact phone number for your studio'}
            fullWidth
            type="tel"
            autoComplete="tel"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(232, 219, 197, 0.5)',
                },
                '&:hover fieldset': {
                  borderColor: colors.textSecondary,
                },
                '&.Mui-focused fieldset': {
                  borderColor: colors.accent,
                },
              },
              '& .MuiInputLabel-root': {
                color: colors.textSecondary,
                '&.Mui-focused': {
                  color: colors.accent,
                },
              },
            }}
          />

          {/* Location Field */}
          <Box>
            <Typography
              variant="h6"
              sx={{ mb: 2, color: colors.textSecondary }}
            >
              Studio Location
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={{ xs: 1, sm: 0 }}
              sx={{ mb: 2 }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  textAlign: { xs: 'center', sm: 'left' },
                  mb: { xs: 1, sm: 0 }
                }}
              >
                {useMyLocation ? 'Using current location' : 'Enter your studio\'s address'}
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={toggleLocationMethod}
                disabled={isGettingLocation}
                startIcon={useMyLocation ? <LocationOnIcon /> : <MyLocationIcon />}
                sx={{
                  color: colors.accent,
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  width: { xs: '100%', sm: 'auto' },
                  justifyContent: { xs: 'center', sm: 'flex-start' },
                  '&:hover': {
                    backgroundColor: 'rgba(51, 153, 137, 0.1)',
                  },
                }}
              >
                {useMyLocation ? 'Enter manually' : 'Use my location'}
              </Button>
            </Stack>

            {useMyLocation ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  border: '1px solid rgba(232, 219, 197, 0.5)',
                  borderRadius: 1,
                  backgroundColor: 'rgba(232, 219, 197, 0.05)',
                  minHeight: '56px',
                }}
              >
                {isGettingLocation ? (
                  <>
                    <CircularProgress size={20} sx={{ color: colors.accent, mr: 2 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Getting your location...
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body1" sx={{ color: colors.textSecondary }}>
                    {location || 'Location detected'}
                  </Typography>
                )}
              </Box>
            ) : (
              <LocationAutocomplete
                value={location}
                onChange={(newLocation, newLatLong) => {
                  setLocation(newLocation);
                  setLocationLatLong(newLatLong);
                }}
                label="Studio Location"
                placeholder="Start typing a city name..."
                error={!!errors.location}
                helperText={errors.location}
                required
              />
            )}

            {errors.location && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {errors.location}
              </Alert>
            )}
          </Box>

          {errors.submit && (
            <Alert severity="error">
              {errors.submit}
            </Alert>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>

            <Button
              type="submit"
              variant="contained"
              disabled={
                isSubmitting ||
                checkingUsername ||
                usernameAvailable === false ||
                (email && checkingEmail) ||
                (email && emailAvailable === false)
              }
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              sx={{
                backgroundColor: colors.accent,
                color: '#000',
                fontWeight: 'bold',
                minWidth: '150px',
                '&:hover': {
                  backgroundColor: colors.accentDark,
                },
                '&:disabled': {
                  backgroundColor: 'rgba(232, 219, 197, 0.3)',
                  color: 'rgba(0, 0, 0, 0.5)',
                },
              }}
            >
              {isSubmitting ? 'Creating Studio...' : 'Create Studio'}
            </Button>

            {/* Back button on the right */}
            <Button
              variant="outlined"
              onClick={onBack}
              disabled={isSubmitting}
              sx={{
                color: colors.textSecondary,
                borderColor: colors.textSecondary,
                minWidth: '80px',
                '&:hover': {
                  backgroundColor: 'rgba(232, 219, 197, 0.1)',
                  borderColor: colors.textSecondary,
                },
                '&:disabled': {
                  borderColor: 'rgba(232, 219, 197, 0.3)',
                  color: 'rgba(232, 219, 197, 0.5)',
                },
              }}
            >
              Back
            </Button>
          </Box>
        </Stack>
      </form>

      <Typography
        variant="body2"
        sx={{
          mt: 3,
          textAlign: 'center',
          color: 'text.secondary',
          fontStyle: 'italic',
        }}
      >
        You can always update your studio information later in your dashboard.
      </Typography>
    </Box>
  );
};

export default StudioDetails;

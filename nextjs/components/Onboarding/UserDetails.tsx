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
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Person as PersonIcon,
  LocationOn as LocationOnIcon,
  MyLocation as MyLocationIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAppGeolocation } from '../../utils/geolocation';
import { colors } from '@/styles/colors';
import { api } from '@/utils/api';
import LocationAutocomplete from '../LocationAutocomplete';
import StudioAutocomplete, { StudioOption } from '../StudioAutocomplete';

interface UserDetailsProps {
  onStepComplete: (userDetails: {
    name: string;
    username: string;
    bio: string;
    profileImage?: File | null;
    location: string;
    locationLatLong: string;
    studioAffiliation?: {
      studioId: number;
      studioName: string;
      isNew: boolean;
      isClaimed: boolean;
    } | null;
  }) => void;
  onBack: () => void;
  userType: 'client' | 'artist' | 'studio';
}

const UserDetails: React.FC<UserDetailsProps> = ({ 
  onStepComplete, 
  onBack, 
  userType 
}) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [locationLatLong, setLocationLatLong] = useState('');
  const [useMyLocation, setUseMyLocation] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Studio affiliation (for artists only)
  const [selectedStudio, setSelectedStudio] = useState<StudioOption | null>(null);

  // Username availability state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameCheckDebounce, setUsernameCheckDebounce] = useState<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getCurrentPosition, getLocation } = useAppGeolocation();

  // Check username availability
  const checkUsernameAvailability = useCallback(async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3 || !/^[a-zA-Z0-9_]+$/.test(usernameToCheck)) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const response = await api.post<{ available: boolean }>('/check-availability', {
        username: usernameToCheck,
      });
      setUsernameAvailable(response.available);
      if (!response.available) {
        setErrors(prev => ({ ...prev, username: 'This username is already taken' }));
      } else {
        setErrors(prev => {
          const { username, ...rest } = prev;
          return rest;
        });
      }
    } catch (error) {
      console.error('Error checking username availability:', error);
      // Don't block registration if check fails
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  }, []);

  // Debounce username availability check
  useEffect(() => {
    if (usernameCheckDebounce) {
      clearTimeout(usernameCheckDebounce);
    }

    if (username && username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username)) {
      const timeout = setTimeout(() => {
        checkUsernameAvailability(username);
      }, 500);
      setUsernameCheckDebounce(timeout);
    } else {
      setUsernameAvailable(null);
    }

    return () => {
      if (usernameCheckDebounce) {
        clearTimeout(usernameCheckDebounce);
      }
    };
  }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

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
      console.log('Reverse geocoding result:', locationData);
      
      if (locationData.items && locationData.items.length > 0) {
        const address = locationData.items[0].address;
        console.log('Address object:', address);
        
        const locationStr = [
          address.city, 
          address.state, 
          address.countryCode
        ].filter(Boolean).join(', ');
        
        console.log('Generated location string:', locationStr);
        setLocation(locationStr || 'Current Location');
      } else {
        console.log('No location items found, using fallback');
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
      newErrors.name = 'Name is required';
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

    // Bio validation only for artists and studios, not clients
    if (userType !== 'client') {
      if (!bio.trim()) {
        newErrors.bio = 'Bio is required';
      } else if (bio.length < 10) {
        newErrors.bio = 'Bio must be at least 10 characters';
      } else if (bio.length > 500) {
        newErrors.bio = 'Bio must be less than 500 characters';
      }
    }

    if (!location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        studioAffiliation: selectedStudio ? {
          studioId: selectedStudio.id,
          studioName: selectedStudio.name,
          isNew: selectedStudio.is_new,
          isClaimed: selectedStudio.is_claimed,
        } : null,
      });
    } catch (error) {
      console.error('Error submitting user details:', error);
      setErrors({ submit: 'Failed to save details. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (userType) {
      case 'artist':
        return 'Tell us about yourself';
      case 'studio':
        return 'Tell us about your studio';
      default:
        return 'Create your profile';
    }
  };

  const getNamePlaceholder = () => {
    switch (userType) {
      case 'artist':
        return 'Your full name or artist name';
      case 'studio':
        return 'Your studio name';
      default:
        return 'Your full name';
    }
  };

  const getBioPlaceholder = () => {
    switch (userType) {
      case 'artist':
        return 'Tell people about your tattoo style, experience, and what inspires your art...';
      case 'studio':
        return 'Describe your studio\'s atmosphere, specialties, and what makes you unique...';
      default:
        return 'Tell the community about yourself, your tattoo interests, or anything you\'d like to share...';
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
          {getTitle()}
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
          Let's set up your profile so others can get to know you better.
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Stack spacing={4}>
          {/* Profile Image */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, color: colors.textSecondary }}
            >
              Profile Photo
            </Typography>
            
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                src={profileImagePreview || undefined}
                sx={{
                  width: 120,
                  height: 120,
                  backgroundColor: colors.backgroundLight,
                  color: colors.textOnLight,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 20px rgba(51, 153, 137, 0.3)',
                  },
                }}
                onClick={handleImageClick}
              >
                {!profileImagePreview && <PersonIcon sx={{ fontSize: 60 }} />}
              </Avatar>
              
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: -5,
                  right: -5,
                  backgroundColor: colors.accent,
                  color: colors.textOnLight,
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
              Click to add a profile photo (optional)
            </Typography>
            
            {errors.profileImage && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {errors.profileImage}
              </Alert>
            )}
          </Box>

          {/* Name Field */}
          <TextField
            label={userType === 'studio' ? 'Studio Name' : 'Name'}
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={getNamePlaceholder()}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            required
            autoComplete="name"
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
          <Box>
            <TextField
              label="Username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="Choose a unique username"
              error={!!errors.username || usernameAvailable === false}
              fullWidth
              required
              autoComplete="username"
              InputProps={{
                endAdornment: (
                  <>
                    {isCheckingUsername && (
                      <CircularProgress size={20} sx={{ color: colors.accent }} />
                    )}
                    {!isCheckingUsername && usernameAvailable === true && (
                      <CheckCircleIcon sx={{ color: colors.success }} />
                    )}
                    {!isCheckingUsername && usernameAvailable === false && (
                      <CancelIcon sx={{ color: colors.error }} />
                    )}
                  </>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: usernameAvailable === false ? colors.error :
                                 usernameAvailable === true ? colors.success :
                                 colors.border,
                  },
                  '&:hover fieldset': {
                    borderColor: usernameAvailable === false ? colors.error :
                                 usernameAvailable === true ? colors.success :
                                 colors.textSecondary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: usernameAvailable === false ? colors.error :
                                 usernameAvailable === true ? colors.success :
                                 colors.accent,
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
            {errors.username ? (
              <Typography variant="caption" sx={{ color: colors.error, mt: 0.5, display: 'block' }}>
                {errors.username}
              </Typography>
            ) : usernameAvailable === true ? (
              <Typography variant="caption" sx={{ color: colors.success, mt: 0.5, display: 'block' }}>
                ✓ Username is available
              </Typography>
            ) : (
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                This will be your unique identifier on the platform
              </Typography>
            )}
          </Box>

          {/* Bio Field - hidden for clients */}
          {userType !== 'client' && (
            <TextField
              label="Bio"
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={getBioPlaceholder()}
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
          )}

          {/* Location Field */}
          <Box>
            <Typography
              variant="h6"
              sx={{ mb: 2, color: colors.textSecondary }}
            >
              Location
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
                {useMyLocation ? 'Using your current location' : 'Enter your location manually'}
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
                  console.log('[UserDetails] Location selected:', { newLocation, newLatLong });
                  setLocation(newLocation);
                  setLocationLatLong(newLatLong);
                }}
                label="Your Location"
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

          {/* Studio Affiliation (Artists only) */}
          {userType === 'artist' && (
            <Box>
              <Typography
                variant="h6"
                sx={{ mb: 2, color: colors.textSecondary }}
              >
                Studio Affiliation
                <Typography
                  component="span"
                  sx={{ fontWeight: 'normal', fontSize: '0.875rem', color: 'text.secondary', ml: 1 }}
                >
                  (Optional)
                </Typography>
              </Typography>

              <Typography
                variant="body2"
                sx={{ mb: 2, color: 'text.secondary' }}
              >
                Are you affiliated with a tattoo studio? Search to link your profile to an existing studio.
              </Typography>

              {location && !locationLatLong && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Please select your location from the dropdown above to see studios near you.
                </Alert>
              )}

              <StudioAutocomplete
                value={selectedStudio}
                onChange={(studio) => setSelectedStudio(studio)}
                label="Search for your studio"
                placeholder="Start typing studio name..."
                location={locationLatLong || undefined}
              />

              {selectedStudio && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(201, 169, 98, 0.1)', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: colors.accent }}>
                    You'll be linked to: <strong>{selectedStudio.name}</strong>
                    {selectedStudio.location && (
                      <span style={{ color: colors.textSecondary }}> - {selectedStudio.location}</span>
                    )}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

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
              disabled={isSubmitting || isCheckingUsername || usernameAvailable === false}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              sx={{
                backgroundColor: colors.accent,
                color: colors.textOnLight,
                fontWeight: 'bold',
                minWidth: '150px',
                '&:hover': {
                  backgroundColor: colors.accentDark,
                },
                '&:disabled': {
                  backgroundColor: colors.border,
                  color: colors.textMuted,
                },
              }}
            >
              {isSubmitting ? 'Updating Profile...' : 'Continue'}
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
        You can always update your profile information later in your settings.
      </Typography>
    </Box>
  );
};

export default UserDetails;
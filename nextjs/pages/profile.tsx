import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../components/Layout';
import AccountModal from '../components/AccountModal';
import StyleModal from '../components/StyleModal';
import WorkingHoursModal from '../components/WorkingHoursModal';
import WorkingHoursDisplay from '../components/WorkingHoursDisplay';
import { Box, Typography, TextField, IconButton, Switch } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import GroupIcon from '@mui/icons-material/Group';
import ChatIcon from '@mui/icons-material/Chat';
import { UserProvider, useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkingHours } from '@/hooks';
import { useStyles } from '@/contexts/StyleContext';
import { useProfilePhoto } from '@/hooks';
import { withAuth } from '@/components/WithAuth';
import { colors } from '@/styles/colors';
import { api } from '@/utils/api';

// Collapsible Settings Section Component
interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  icon,
  children,
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Box sx={{
      bgcolor: colors.surface,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      mb: '1.5rem',
      overflow: 'hidden'
    }}>
      {/* Section Header */}
      <Box
        onClick={() => setIsExpanded(!isExpanded)}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: '1rem 1.25rem',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background 0.15s ease',
          '&:hover': { bgcolor: '#242424' }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Box sx={{ color: colors.accent, display: 'flex' }}>
            {icon}
          </Box>
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.textPrimary }}>
            {title}
          </Typography>
        </Box>
        <Box sx={{
          color: colors.textSecondary,
          transition: 'transform 0.2s ease',
          transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
          display: 'flex'
        }}>
          <ExpandMoreIcon sx={{ fontSize: 20 }} />
        </Box>
      </Box>

      {/* Content */}
      {isExpanded && (
        <>
          <Box sx={{ height: '1px', bgcolor: colors.border, mx: '1.25rem' }} />
          <Box sx={{ p: '1.25rem' }}>
            {children}
          </Box>
        </>
      )}
    </Box>
  );
};

// Form Group Component
interface FormGroupProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

const FormGroup: React.FC<FormGroupProps> = ({ label, hint, children }) => (
  <Box sx={{ mb: '1.25rem', '&:last-child': { mb: 0 } }}>
    <Typography sx={{
      fontSize: '0.85rem',
      fontWeight: 500,
      color: colors.textSecondary,
      mb: '0.5rem'
    }}>
      {label}
    </Typography>
    {children}
    {hint && (
      <Typography sx={{
        fontSize: '0.8rem',
        color: colors.textSecondary,
        mt: '0.35rem',
        opacity: 0.7
      }}>
        {hint}
      </Typography>
    )}
  </Box>
);

// Booking Option Component
interface BookingOptionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

const BookingOption: React.FC<BookingOptionProps> = ({
  icon,
  title,
  description,
  checked,
  onChange,
  disabled = false
}) => (
  <Box sx={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    p: '1rem 1.25rem',
    bgcolor: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    transition: 'border-color 0.2s ease',
    '&:hover': { borderColor: colors.borderLight }
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <Box sx={{
        width: 40,
        height: 40,
        bgcolor: checked ? `${colors.accent}26` : colors.surface,
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: checked ? colors.accent : colors.textSecondary
      }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: '0.95rem', fontWeight: 500, color: colors.textPrimary, mb: '0.15rem' }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
          {description}
        </Typography>
      </Box>
    </Box>
    <Switch
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      sx={{
        '& .MuiSwitch-switchBase': {
          '&.Mui-checked': {
            color: colors.accent,
            '& + .MuiSwitch-track': { bgcolor: colors.accent }
          }
        },
        '& .MuiSwitch-track': { bgcolor: '#242424' }
      }}
    />
  </Box>
);

// Text Input Styles
const inputStyles = {
  '& .MuiOutlinedInput-root': {
    bgcolor: colors.background,
    '& fieldset': { borderColor: `${colors.textPrimary}1A` },
    '&:hover fieldset': { borderColor: `${colors.textPrimary}1A` },
    '&.Mui-focused fieldset': { borderColor: colors.accent }
  },
  '& .MuiInputBase-input': {
    fontSize: '0.95rem',
    color: colors.textPrimary,
    '&::placeholder': { color: colors.textSecondary, opacity: 1 }
  }
};

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { userData, updateUser, updateStyles, loading, error } = useUser();
  const { user: authUser, logout: authLogout } = useAuth();
  const { styles, getStyleName } = useStyles();
  const { profilePhoto, takeProfilePhoto, deleteProfilePhoto } = useProfilePhoto();

  // Only fetch working hours for artists
  const isArtist = userData?.type === 'artist';
  const { workingHours, saveWorkingHours, loading: hoursLoading, error: hoursError } = useWorkingHours(isArtist ? userData?.id : null);

  // Modal states
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [styleModalOpen, setStyleModalOpen] = useState(false);
  const [workingHoursModalOpen, setWorkingHoursModalOpen] = useState(false);
  const [fieldName, setFieldName] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    bio: '',
    studioName: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    hourlyRate: '',
    minimumSession: '',
    depositAmount: '',
    consultationFee: ''
  });

  // Artist settings state
  const [artistSettings, setArtistSettings] = useState({
    books_open: false,
    accepts_appointments: false,
    accepts_walk_ins: false,
    accepts_consultations: false,
    accepts_deposits: false
  });

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<number[]>(userData.styles || []);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Initialize form data from userData
  useEffect(() => {
    if (userData) {
      const nameParts = (userData.name || '').split(' ');
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        displayName: userData.name || '',
        bio: (userData as any).bio || '',
        studioName: (userData as any).studio?.name || '',
        address: (userData as any).studio?.address || '',
        city: (userData as any).studio?.city || '',
        state: (userData as any).studio?.state || '',
        country: (userData as any).studio?.country || '',
        postalCode: (userData as any).studio?.postal_code || '',
        hourlyRate: (userData as any).hourly_rate || '',
        minimumSession: (userData as any).minimum_session || '',
        depositAmount: (userData as any).deposit_amount || '',
        consultationFee: (userData as any).consultation_fee || ''
      });
      setSelectedStyles(userData.styles || []);
    }
  }, [userData]);

  // Fetch artist settings
  useEffect(() => {
    if (isArtist && userData?.id) {
      fetchArtistSettings();
    }
  }, [isArtist, userData?.id]);

  const fetchArtistSettings = async () => {
    try {
      const response = await api.get<{ data: any }>(`/artists/${userData?.id}/settings`, {
        requiresAuth: true
      });
      if (response?.data) {
        setArtistSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (err) {
      console.error('Error fetching artist settings:', err);
    }
  };

  // Handle form field change
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // Handle artist setting toggle
  const handleSettingToggle = async (key: keyof typeof artistSettings) => {
    const newValue = !artistSettings[key];
    const previousSettings = { ...artistSettings };

    // Optimistic update
    setArtistSettings(prev => ({ ...prev, [key]: newValue }));

    try {
      setSavingSettings(true);
      await api.put(`/artists/${userData?.id}/settings`, {
        [key]: newValue
      }, { requiresAuth: true });

      setToastMessage('Settings updated successfully');
      setShowToast(true);
    } catch (err) {
      // Revert on error
      setArtistSettings(previousSettings);
      setToastMessage('Failed to update setting');
      setShowToast(true);
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle account modal confirm
  const handleAccountConfirm = async (data: any) => {
    try {
      await updateUser(data);
      setToastMessage('Profile updated successfully');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Profile update failed');
      setShowToast(true);
    } finally {
      setAccountModalOpen(false);
    }
  };

  // Save all changes
  const handleSaveChanges = async () => {
    try {
      const name = `${formData.firstName} ${formData.lastName}`.trim();
      await updateUser({
        name,
        ...formData
      });
      setHasUnsavedChanges(false);
      setToastMessage('Changes saved successfully');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Failed to save changes');
      setShowToast(true);
    }
  };

  // Discard changes
  const handleDiscardChanges = () => {
    // Reset form data from userData
    if (userData) {
      const nameParts = (userData.name || '').split(' ');
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        displayName: userData.name || '',
        bio: (userData as any).bio || '',
        studioName: (userData as any).studio?.name || '',
        address: (userData as any).studio?.address || '',
        city: (userData as any).studio?.city || '',
        state: (userData as any).studio?.state || '',
        country: (userData as any).studio?.country || '',
        postalCode: (userData as any).studio?.postal_code || '',
        hourlyRate: (userData as any).hourly_rate || '',
        minimumSession: (userData as any).minimum_session || '',
        depositAmount: (userData as any).deposit_amount || '',
        consultationFee: (userData as any).consultation_fee || ''
      });
    }
    setHasUnsavedChanges(false);
  };

  // Open styles modal
  const openStylesModal = () => {
    setStyleModalOpen(true);
  };

  // Apply selected styles
  const handleApplyStyles = async (updatedStyles: number[]) => {
    setSelectedStyles(updatedStyles);

    try {
      await updateStyles(updatedStyles);
      setToastMessage('Styles updated successfully');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Styles update failed');
      setShowToast(true);
    }
  };

  // Remove style
  const removeStyle = (styleId: number) => {
    const updatedStyles = selectedStyles.filter(id => id !== styleId);
    setSelectedStyles(updatedStyles);

    updateStyles(updatedStyles)
      .then(() => {
        setToastMessage('Style removed successfully');
        setShowToast(true);
      })
      .catch(() => {
        setToastMessage('Failed to remove style');
        setShowToast(true);
      });
  };

  // Open working hours modal
  const openWorkingHoursModal = () => {
    setWorkingHoursModalOpen(true);
  };

  // Save working hours
  const handleSaveWorkingHours = async (hours: any[]) => {
    try {
      await saveWorkingHours(hours);
      setToastMessage('Working hours updated successfully');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Failed to update working hours');
      setShowToast(true);
    }
  };

  // Logout
  const handleLogout = () => {
    authLogout();
  };

  // Get initials for avatar
  const getInitials = () => {
    const name = userData?.name || '';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase() || 'U';
  };

  // Auto-hide toast after 2 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const imageUri = userData?.image?.uri || profilePhoto?.webviewPath;

  return (
    <Layout>
      <Box sx={{
        maxWidth: '720px',
        mx: 'auto',
        p: { xs: '1.5rem 1rem 6rem', md: '2rem 1.5rem 4rem' }
      }}>
        {/* Page Header */}
        <Box sx={{ mb: '2rem' }}>
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 600, color: colors.textPrimary, mb: '0.5rem' }}>
            Your Profile
          </Typography>
          <Typography sx={{ fontSize: '0.95rem', color: colors.textSecondary }}>
            This is how clients see you on InkedIn
          </Typography>
        </Box>

        {/* Profile Photo Section */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: '2rem',
          bgcolor: colors.surface,
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          mb: '1.5rem'
        }}>
          {/* Photo with edit button */}
          <Box sx={{ position: 'relative', mb: '1rem' }}>
            <Box sx={{
              width: 120,
              height: 120,
              bgcolor: '#242424',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              fontWeight: 600,
              color: colors.accent,
              border: `3px solid ${colors.borderLight}`,
              overflow: 'hidden',
              position: 'relative'
            }}>
              {imageUri ? (
                <Image
                  src={imageUri}
                  alt="Profile"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                getInitials()
              )}
            </Box>
            <IconButton
              onClick={takeProfilePhoto}
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 36,
                height: 36,
                bgcolor: colors.accent,
                border: `3px solid ${colors.surface}`,
                '&:hover': { bgcolor: colors.accentHover }
              }}
            >
              <CameraAltIcon sx={{ fontSize: 16, color: colors.background }} />
            </IconButton>
          </Box>

          {/* Photo actions */}
          <Box sx={{
            display: 'flex',
            gap: '0.75rem',
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '100%', sm: 'auto' }
          }}>
            <Box
              component="button"
              onClick={takeProfilePhoto}
              sx={{
                px: '1.25rem',
                py: '0.6rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                border: `1px solid ${colors.borderLight}`,
                bgcolor: 'transparent',
                color: colors.textPrimary,
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
                '&:hover': {
                  borderColor: colors.accent,
                  color: colors.accent
                }
              }}
            >
              Change Photo
            </Box>
            {imageUri && (
              <Box
                component="button"
                onClick={deleteProfilePhoto}
                sx={{
                  px: '1rem',
                  py: '0.5rem',
                  background: 'none',
                  border: 'none',
                  color: colors.accent,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Remove
              </Box>
            )}
          </Box>

          {/* View Public Page Link (artists only) */}
          {isArtist && userData?.id && (
            <Link
              href={`/artists/${userData.slug || userData.id}`}
              style={{ textDecoration: 'none', width: '100%', maxWidth: '280px' }}
            >
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                p: '0.75rem 1.25rem',
                mt: '0.75rem',
                bgcolor: '#242424',
                border: `1px solid ${colors.borderLight}`,
                borderRadius: '8px',
                color: colors.textPrimary,
                fontSize: '0.9rem',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: colors.accent,
                  color: colors.accent
                }
              }}>
                <VisibilityIcon sx={{ fontSize: 18 }} />
                View My Public Page
              </Box>
            </Link>
          )}
        </Box>

        {/* About You Section */}
        <SettingsSection title="About You" icon={<PersonIcon sx={{ fontSize: 20 }} />}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '1rem' }}>
            <FormGroup label="First Name">
              <TextField
                fullWidth
                size="small"
                value={formData.firstName}
                onChange={(e) => handleFieldChange('firstName', e.target.value)}
                sx={inputStyles}
              />
            </FormGroup>
            <FormGroup label="Last Name">
              <TextField
                fullWidth
                size="small"
                value={formData.lastName}
                onChange={(e) => handleFieldChange('lastName', e.target.value)}
                sx={inputStyles}
              />
            </FormGroup>
          </Box>
          <FormGroup label="Display Name" hint="This is how your name appears to clients">
            <TextField
              fullWidth
              size="small"
              value={formData.displayName}
              onChange={(e) => handleFieldChange('displayName', e.target.value)}
              sx={inputStyles}
            />
          </FormGroup>
          <FormGroup label="Bio">
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Tell clients about yourself and your work..."
              value={formData.bio}
              onChange={(e) => handleFieldChange('bio', e.target.value)}
              sx={inputStyles}
            />
          </FormGroup>
        </SettingsSection>

        {/* Your Studio Section (artists only) */}
        {isArtist && (
          <SettingsSection title="Your Studio" icon={<LocationOnIcon sx={{ fontSize: 20 }} />}>
            <FormGroup label="Studio Name">
              <TextField
                fullWidth
                size="small"
                value={formData.studioName}
                onChange={(e) => handleFieldChange('studioName', e.target.value)}
                sx={inputStyles}
              />
            </FormGroup>
            <FormGroup label="Address">
              <TextField
                fullWidth
                size="small"
                value={formData.address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                sx={inputStyles}
              />
            </FormGroup>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '1rem' }}>
              <FormGroup label="City">
                <TextField
                  fullWidth
                  size="small"
                  value={formData.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  sx={inputStyles}
                />
              </FormGroup>
              <FormGroup label="State / Region">
                <TextField
                  fullWidth
                  size="small"
                  value={formData.state}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  sx={inputStyles}
                />
              </FormGroup>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '1rem' }}>
              <FormGroup label="Country">
                <TextField
                  fullWidth
                  size="small"
                  value={formData.country}
                  onChange={(e) => handleFieldChange('country', e.target.value)}
                  sx={inputStyles}
                />
              </FormGroup>
              <FormGroup label="Postal Code">
                <TextField
                  fullWidth
                  size="small"
                  value={formData.postalCode}
                  onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                  sx={inputStyles}
                />
              </FormGroup>
            </Box>
          </SettingsSection>
        )}

        {/* Your Styles Section */}
        <SettingsSection title="Your Styles" icon={<StarIcon sx={{ fontSize: 20 }} />}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', mb: '1rem' }}>
            {selectedStyles.map(styleId => (
              <Box
                key={styleId}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  px: '0.875rem',
                  py: '0.5rem',
                  bgcolor: `${colors.accent}26`,
                  border: `1px solid ${colors.accent}4D`,
                  borderRadius: '100px',
                  fontSize: '0.85rem',
                  color: colors.accent
                }}
              >
                {getStyleName(styleId)}
                <IconButton
                  onClick={() => removeStyle(styleId)}
                  sx={{
                    p: 0,
                    color: colors.accent,
                    opacity: 0.7,
                    '&:hover': { opacity: 1, bgcolor: 'transparent' }
                  }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            ))}
            <Box
              component="button"
              onClick={openStylesModal}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                px: '0.875rem',
                py: '0.5rem',
                bgcolor: 'transparent',
                border: `1px dashed ${colors.borderLight}`,
                borderRadius: '100px',
                fontSize: '0.85rem',
                color: colors.textSecondary,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: colors.accent,
                  borderStyle: 'solid',
                  color: colors.accent
                }
              }}
            >
              <AddIcon sx={{ fontSize: 14 }} />
              Add Style
            </Box>
          </Box>
          <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary, opacity: 0.7 }}>
            {isArtist
              ? 'Select styles that best represent your work. Clients use these to find artists.'
              : 'Select styles you\'re interested in to help us personalize your experience.'}
          </Typography>
        </SettingsSection>

        {/* Your Rates Section (artists only) */}
        {isArtist && (
          <SettingsSection title="Your Rates" icon={<AttachMoneyIcon sx={{ fontSize: 20 }} />}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '1rem' }}>
              <FormGroup label="Hourly Rate">
                <TextField
                  fullWidth
                  size="small"
                  placeholder="$200"
                  value={formData.hourlyRate}
                  onChange={(e) => handleFieldChange('hourlyRate', e.target.value)}
                  sx={inputStyles}
                />
              </FormGroup>
              <FormGroup label="Minimum Session">
                <TextField
                  fullWidth
                  size="small"
                  placeholder="2 hours"
                  value={formData.minimumSession}
                  onChange={(e) => handleFieldChange('minimumSession', e.target.value)}
                  sx={inputStyles}
                />
              </FormGroup>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '1rem' }}>
              <FormGroup label="Deposit Amount">
                <TextField
                  fullWidth
                  size="small"
                  placeholder="$150"
                  value={formData.depositAmount}
                  onChange={(e) => handleFieldChange('depositAmount', e.target.value)}
                  sx={inputStyles}
                />
              </FormGroup>
              <FormGroup label="Consultation Fee">
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Free"
                  value={formData.consultationFee}
                  onChange={(e) => handleFieldChange('consultationFee', e.target.value)}
                  sx={inputStyles}
                />
              </FormGroup>
            </Box>
          </SettingsSection>
        )}

        {/* Your Hours Section (artists only) */}
        {isArtist && (
          <SettingsSection title="Your Hours" icon={<AccessTimeIcon sx={{ fontSize: 20 }} />}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '1rem' }}>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: colors.textSecondary }}>
                Weekly Schedule
              </Typography>
              <Box
                component="button"
                onClick={openWorkingHoursModal}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'none',
                  border: 'none',
                  color: colors.accent,
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                <EditIcon sx={{ fontSize: 14 }} />
                Edit Hours
              </Box>
            </Box>

            {/* Working Hours Display */}
            <WorkingHoursDisplay workingHours={workingHours || []} />
          </SettingsSection>
        )}

        {/* Booking Preferences Section (artists only) */}
        {isArtist && (
          <SettingsSection title="Booking Preferences" icon={<EventIcon sx={{ fontSize: 20 }} />}>
            <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary, mb: '1rem', opacity: 0.7 }}>
              Configure what types of bookings and services you offer
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <BookingOption
                icon={<MenuBookIcon sx={{ fontSize: 20 }} />}
                title="Books Open"
                description="Accept new tattoo appointments and bookings"
                checked={artistSettings.books_open}
                onChange={() => handleSettingToggle('books_open')}
                disabled={savingSettings}
              />
              <BookingOption
                icon={<EventIcon sx={{ fontSize: 20 }} />}
                title="Scheduled Appointments"
                description="Allow clients to book scheduled appointments"
                checked={artistSettings.accepts_appointments}
                onChange={() => handleSettingToggle('accepts_appointments')}
                disabled={savingSettings}
              />
              <BookingOption
                icon={<GroupIcon sx={{ fontSize: 20 }} />}
                title="Walk-ins"
                description="Accept walk-in clients without appointments"
                checked={artistSettings.accepts_walk_ins}
                onChange={() => handleSettingToggle('accepts_walk_ins')}
                disabled={savingSettings}
              />
              <BookingOption
                icon={<ChatIcon sx={{ fontSize: 20 }} />}
                title="Consultations"
                description="Offer consultation sessions for tattoo planning"
                checked={artistSettings.accepts_consultations}
                onChange={() => handleSettingToggle('accepts_consultations')}
                disabled={savingSettings}
              />
              <BookingOption
                icon={<AttachMoneyIcon sx={{ fontSize: 20 }} />}
                title="Deposits"
                description="Require deposits for bookings and appointments"
                checked={artistSettings.accepts_deposits}
                onChange={() => handleSettingToggle('accepts_deposits')}
                disabled={savingSettings}
              />
            </Box>

            {/* Note */}
            <Box sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              p: '1rem',
              mt: '1rem',
              bgcolor: `${colors.accent}26`,
              border: `1px solid ${colors.accent}33`,
              borderRadius: '8px'
            }}>
              <Box sx={{ color: colors.accent, flexShrink: 0, mt: '2px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </Box>
              <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary, lineHeight: 1.5 }}>
                <Box component="span" sx={{ color: colors.accent, fontWeight: 500 }}>Note:</Box>{' '}
                Turning off "Books Open" will hide your calendar from potential clients and prevent new bookings.
              </Typography>
            </Box>
          </SettingsSection>
        )}

        {/* Account Section */}
        <SettingsSection title="Account" icon={<PersonIcon sx={{ fontSize: 20 }} />} defaultExpanded={false}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Box
              onClick={() => { setFieldName('email'); setAccountModalOpen(true); }}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: '0.75rem',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
                '&:hover': { bgcolor: colors.background }
              }}
            >
              <Typography sx={{ fontSize: '0.9rem', color: colors.textPrimary }}>
                {userData?.email || 'Change Email'}
              </Typography>
              <ExpandMoreIcon sx={{ fontSize: 20, color: colors.textSecondary, transform: 'rotate(-90deg)' }} />
            </Box>
            <Box
              onClick={() => { setFieldName('password'); setAccountModalOpen(true); }}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: '0.75rem',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
                '&:hover': { bgcolor: colors.background }
              }}
            >
              <Typography sx={{ fontSize: '0.9rem', color: colors.textPrimary }}>
                Change Password
              </Typography>
              <ExpandMoreIcon sx={{ fontSize: 20, color: colors.textSecondary, transform: 'rotate(-90deg)' }} />
            </Box>
            <Box
              component={Link}
              href="/support"
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: '0.75rem',
                borderRadius: '6px',
                textDecoration: 'none',
                transition: 'background 0.15s ease',
                '&:hover': { bgcolor: colors.background }
              }}
            >
              <Typography sx={{ fontSize: '0.9rem', color: colors.textPrimary }}>
                Support
              </Typography>
              <ExpandMoreIcon sx={{ fontSize: 20, color: colors.textSecondary, transform: 'rotate(-90deg)' }} />
            </Box>
            <Box
              onClick={handleLogout}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: '0.75rem',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
                '&:hover': { bgcolor: colors.background }
              }}
            >
              <Typography sx={{ fontSize: '0.9rem', color: colors.error }}>
                Logout
              </Typography>
            </Box>
          </Box>
        </SettingsSection>
      </Box>

      {/* Save Bar */}
      <Box sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: colors.surface,
        borderTop: `1px solid ${colors.border}`,
        p: { xs: '1rem', md: '1rem 2rem' },
        transform: hasUnsavedChanges ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease',
        zIndex: 50
      }}>
        <Box sx={{
          maxWidth: '720px',
          width: '100%',
          mx: 'auto',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary }}>
            You have unsaved changes
          </Typography>
          <Box sx={{
            display: 'flex',
            gap: '0.75rem',
            width: { xs: '100%', sm: 'auto' }
          }}>
            <Box
              component="button"
              onClick={handleDiscardChanges}
              sx={{
                flex: { xs: 1, sm: 'none' },
                px: '1.25rem',
                py: '0.6rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                border: `1px solid ${colors.borderLight}`,
                bgcolor: 'transparent',
                color: colors.textPrimary,
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: colors.accent,
                  color: colors.accent
                }
              }}
            >
              Discard
            </Box>
            <Box
              component="button"
              onClick={handleSaveChanges}
              sx={{
                flex: { xs: 1, sm: 'none' },
                px: '1.25rem',
                py: '0.6rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                bgcolor: colors.accent,
                color: colors.background,
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: colors.accentHover }
              }}
            >
              Save Changes
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Modal for changing account details */}
      <AccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        onConfirm={handleAccountConfirm}
        fieldName={fieldName}
      />

      {/* Modal for selecting styles */}
      <StyleModal
        isOpen={styleModalOpen}
        onClose={() => setStyleModalOpen(false)}
        onApply={handleApplyStyles}
        selectedStyles={selectedStyles}
      />

      {/* Modal for setting working hours */}
      {isArtist && (
        <WorkingHoursModal
          isOpen={workingHoursModalOpen}
          onClose={() => setWorkingHoursModalOpen(false)}
          onSave={handleSaveWorkingHours}
          artistId={userData?.id || 0}
          initialWorkingHours={workingHours}
        />
      )}

      {/* Toast notification */}
      {showToast && (
        <Box sx={{
          position: 'fixed',
          bottom: hasUnsavedChanges ? '80px' : '1rem',
          right: '1rem',
          px: '1rem',
          py: '0.75rem',
          bgcolor: colors.surface,
          color: colors.textPrimary,
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          border: `1px solid ${colors.border}`,
          zIndex: 100
        }}>
          {toastMessage}
        </Box>
      )}
    </Layout>
  );
};

export default withAuth(ProfilePage);

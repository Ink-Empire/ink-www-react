import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../components/Layout';
import AccountModal from '../components/AccountModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import StyleModal from '../components/StyleModal';
import WorkingHoursModal from '../components/WorkingHoursModal';
import ImageCropperModal from '../components/ImageCropperModal';
import WorkingHoursDisplay from '../components/WorkingHoursDisplay';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import ShareIcon from '@mui/icons-material/Share';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import XIcon from '@mui/icons-material/X';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import GroupIcon from '@mui/icons-material/Group';
import ChatIcon from '@mui/icons-material/Chat';
import PublicIcon from '@mui/icons-material/Public';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HomeIcon from '@mui/icons-material/Home';
import { useAuth, useUser } from '@/contexts/AuthContext';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import { useWorkingHours } from '@/hooks';
import { useStyles } from '@/contexts/StyleContext';
import { useProfilePhoto } from '@/hooks';
import { withAuth } from '@/components/WithAuth';
import { colors, modalStyles } from '@/styles/colors';
import { artistService } from '@/services/artistService';
import { userService } from '@/services/userService';
import { imageService } from '@/services/imageService';
import { messageService } from '@/services/messageService';
import ComingSoonBadge from '@/components/ui/ComingSoonBadge';
import {
  navItems,
  inputStyles,
  SettingsSection,
  FormGroup,
  BookingOption,
} from '../components/profile';

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { userData, updateUser, updateStyles, refreshUser, loading, error } = useUser();
  const { user: authUser, logout: authLogout } = useAuth();
  const { styles, getStyleName } = useStyles();
  const {
    profilePhoto,
    loading: photoLoading,
    takeProfilePhoto,
    deleteProfilePhoto,
    cropperImage,
    isCropperOpen,
    handleCropComplete,
    handleCropCancel,
  } = useProfilePhoto({
    onSuccess: refreshUser,
    updateUser
  });

  // Only fetch working hours for artists
  const isArtist = userData?.type === 'artist';

  // Sidebar navigation state
  const [activeSection, setActiveSection] = useState('photo');

  // Scroll spy effect
  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map(item => document.getElementById(item.id));
      const offset = 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && window.scrollY >= section.offsetTop - offset) {
          setActiveSection(navItems[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const top = element.offsetTop - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // Modal states
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [styleModalOpen, setStyleModalOpen] = useState(false);
  const [workingHoursModalOpen, setWorkingHoursModalOpen] = useState(false);
  const pendingBooksOpen = useRef(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [fieldName, setFieldName] = useState('');

  // Delete account state
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Email preferences state
  const [emailUnsubscribed, setEmailUnsubscribed] = useState(false);
  const [savingEmailPrefs, setSavingEmailPrefs] = useState(false);

  // Form states - basic profile info
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
    postalCode: ''
  });

  // Artist settings state - includes both booking preferences AND rates
  const [artistSettings, setArtistSettings] = useState({
    books_open: false,
    accepts_appointments: false,
    accepts_walk_ins: false,
    accepts_consultations: false,
    accepts_deposits: false,
    hourly_rate: '',
    minimum_session: '',
    deposit_amount: '',
    consultation_fee: '',
    consultation_duration: '30',
    watermark_enabled: false,
    watermark_opacity: 50,
    watermark_position: 'bottom-right',
    watermark_image: null as { id: number; uri: string } | null,
  });

  // Watermark upload state
  const watermarkInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingWatermark, setUploadingWatermark] = useState(false);
  const [watermarkSaved, setWatermarkSaved] = useState(false);

  // Blocked users state
  const [blockedUsers, setBlockedUsers] = useState<Array<{ id: number; name: string; username?: string; slug?: string; image?: string }>>([]);
  const [unblocking, setUnblocking] = useState<number | null>(null);

  // Social media links state
  const [socialMediaLinks, setSocialMediaLinks] = useState<Record<string, string>>({
    instagram: '',
    facebook: '',
    bluesky: '',
    x: '',
    tiktok: '',
  });
  const [hasUnsavedSocialLinks, setHasUnsavedSocialLinks] = useState(false);
  const [savingSocialLinks, setSavingSocialLinks] = useState(false);

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<number[]>(userData.styles || []);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  // Location state for all users
  const [userLocation, setUserLocation] = useState('');
  const [userLocationLatLong, setUserLocationLatLong] = useState('');
  const [savingLocation, setSavingLocation] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);

  // Extract artist ID safely - ensure it's always a number or null
  const artistId = React.useMemo(() => {
    if (!userData?.id) return null;
    const id = typeof userData.id === 'object' ? null : Number(userData.id);
    return isNaN(id as number) ? null : id;
  }, [userData?.id]);

  // Fetch working hours using safe artistId
  const { workingHours, saveWorkingHours, loading: hoursLoading, error: hoursError } = useWorkingHours(isArtist ? artistId : null);

  // Initialize form data from userData
  useEffect(() => {
    if (userData) {
      const nameParts = (userData.name || '').split(' ');
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        displayName: userData.name || '',
        bio: (userData as any).about || '',
        studioName: (userData as any).studio?.name || '',
        address: (userData as any).studio?.address || '',
        city: (userData as any).studio?.city || '',
        state: (userData as any).studio?.state || '',
        country: (userData as any).studio?.country || '',
        postalCode: (userData as any).studio?.postal_code || ''
      });
      setSelectedStyles(userData.styles || []);
      // Initialize blocked users from userData
      if ((userData as any).blocked_users) {
        setBlockedUsers((userData as any).blocked_users);
      }
      // Initialize social media links from userData
      if ((userData as any).social_media_links) {
        const links: Record<string, string> = {
          instagram: '',
          facebook: '',
          bluesky: '',
          x: '',
          tiktok: '',
        };
        (userData as any).social_media_links.forEach((link: { platform: string; username: string }) => {
          if (links.hasOwnProperty(link.platform)) {
            links[link.platform] = link.username;
          }
        });
        setSocialMediaLinks(links);
      }
      // Initialize location from userData
      setUserLocation((userData as any).location || '');
      setUserLocationLatLong((userData as any).location_lat_long || '');
      // Initialize email preferences
      setEmailUnsubscribed((userData as any).email_unsubscribed || false);
    }
  }, [userData]);

  // Fetch artist settings (booking preferences + rates)
  useEffect(() => {
    if (isArtist && artistId) {
      fetchArtistSettings(artistId);
    }
  }, [isArtist, artistId]);

  const fetchArtistSettings = async (id: number) => {
    try {
      const response = await artistService.getSettings(id);
      if (response?.data) {
        // Convert 0 or null to empty string so placeholders show
        const toDisplayValue = (val: any) => (val && val !== 0) ? String(val) : '';

        setArtistSettings(prev => ({
          ...prev,
          books_open: response.data.books_open ?? prev.books_open,
          accepts_appointments: response.data.accepts_appointments ?? prev.accepts_appointments,
          accepts_walk_ins: response.data.accepts_walk_ins ?? prev.accepts_walk_ins,
          accepts_consultations: response.data.accepts_consultations ?? prev.accepts_consultations,
          accepts_deposits: response.data.accepts_deposits ?? prev.accepts_deposits,
          hourly_rate: toDisplayValue(response.data.hourly_rate),
          minimum_session: toDisplayValue(response.data.minimum_session),
          deposit_amount: toDisplayValue(response.data.deposit_amount),
          consultation_fee: toDisplayValue(response.data.consultation_fee),
          consultation_duration: String(response.data.consultation_duration || '30'),
          watermark_enabled: response.data.watermark_enabled ?? false,
          watermark_opacity: response.data.watermark_opacity ?? 50,
          watermark_position: response.data.watermark_position ?? 'bottom-right',
          watermark_image: response.data.watermark_image ?? null,
        }));
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

  // Handle artist setting toggle (boolean settings)
  const handleSettingToggle = async (key: 'books_open' | 'accepts_appointments' | 'accepts_walk_ins' | 'accepts_consultations' | 'accepts_deposits') => {
    if (!artistId) return;

    const newValue = !artistSettings[key];
    const previousSettings = { ...artistSettings };

    // Optimistic update
    setArtistSettings(prev => ({ ...prev, [key]: newValue }));

    try {
      setSavingSettings(true);
      await artistService.updateSettings(artistId, { [key]: newValue });

      setToastMessage('Settings updated successfully');
      setShowToast(true);
    } catch (err: any) {
      // If API returns requires_availability, open the working hours modal
      if (err?.status === 422 && err?.data?.requires_availability) {
        pendingBooksOpen.current = true;
        setWorkingHoursModalOpen(true);
        return;
      }
      // Revert on error
      setArtistSettings(previousSettings);
      setToastMessage('Failed to update setting');
      setShowToast(true);
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle rate field changes (string settings)
  const handleRateChange = (key: 'hourly_rate' | 'minimum_session' | 'deposit_amount' | 'consultation_fee' | 'consultation_duration', value: string) => {
    console.log('Rate changed:', key, value);
    setArtistSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedSettings(true);
  };

  // Track unsaved settings changes
  const [hasUnsavedSettings, setHasUnsavedSettings] = useState(false);

  // Save all artist settings (rates + preferences)
  const handleSaveSettings = async () => {
    if (!artistId) {
      console.error('handleSaveSettings: No artistId available');
      return;
    }

    // Convert string values to numbers for the API (send 0 for empty values)
    const payload = {
      hourly_rate: artistSettings.hourly_rate ? parseFloat(artistSettings.hourly_rate) : 0,
      minimum_session: artistSettings.minimum_session ? parseFloat(artistSettings.minimum_session) : 0,
      deposit_amount: artistSettings.deposit_amount ? parseFloat(artistSettings.deposit_amount) : 0,
      consultation_fee: artistSettings.consultation_fee ? parseFloat(artistSettings.consultation_fee) : 0,
      consultation_duration: Number(artistSettings.consultation_duration) || 30,
    };

    console.log('Saving settings:', {
      endpoint: `/artists/${artistId}/settings`,
      artistId,
      payload
    });

    try {
      setSavingSettings(true);
      const response = await artistService.updateSettings(artistId, payload);
      console.log('Settings save response:', response);

      setHasUnsavedSettings(false);
      setToastMessage('Settings saved successfully');
      setShowToast(true);
    } catch (err: any) {
      console.error('Settings save error:', err);
      setToastMessage(`Failed to save settings: ${err.message || 'Unknown error'}`);
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

  // Handle location change
  const handleLocationChange = (location: string, latLong: string) => {
    setUserLocation(location);
    setUserLocationLatLong(latLong);
  };

  // Save location
  const handleSaveLocation = async (): Promise<boolean> => {
    try {
      setSavingLocation(true);
      await updateUser({
        location: userLocation,
        location_lat_long: userLocationLatLong,
      });
      setToastMessage('Location updated successfully');
      setShowToast(true);
      return true;
    } catch (err) {
      setToastMessage('Failed to update location');
      setShowToast(true);
      return false;
    } finally {
      setSavingLocation(false);
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
        bio: (userData as any).about || '',
        studioName: (userData as any).studio?.name || '',
        address: (userData as any).studio?.address || '',
        city: (userData as any).studio?.city || '',
        state: (userData as any).studio?.state || '',
        country: (userData as any).studio?.country || '',
        postalCode: (userData as any).studio?.postal_code || ''
      });
    }
    setHasUnsavedChanges(false);
  };

  // Discard settings changes (rates)
  const handleDiscardSettings = () => {
    // Re-fetch settings from API to reset
    if (artistId) {
      fetchArtistSettings(artistId);
    }
    setHasUnsavedSettings(false);
  };

  // Handle watermark upload
  const handleWatermarkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !artistId) return;

    setUploadingWatermark(true);
    try {
      // Upload watermark and associate with artist settings
      const uploadedImage = await imageService.uploadWatermark(file, artistId);

      setArtistSettings(prev => ({
        ...prev,
        watermark_image: { id: uploadedImage.id, uri: uploadedImage.uri },
      }));

      // Show inline saved indicator
      setWatermarkSaved(true);
      setTimeout(() => setWatermarkSaved(false), 2000);
    } catch (err) {
      console.error('Watermark upload error:', err);
      setToastMessage('Failed to upload watermark');
      setShowToast(true);
    } finally {
      setUploadingWatermark(false);
      event.target.value = '';
    }
  };

  // Handle watermark removal
  const handleRemoveWatermark = async () => {
    if (!artistId) return;

    try {
      await artistService.updateSettings(artistId, {
        watermark_image_id: null,
        watermark_enabled: false,
      });

      setArtistSettings(prev => ({
        ...prev,
        watermark_image: null,
        watermark_enabled: false,
      }));

      // Show inline saved indicator
      setWatermarkSaved(true);
      setTimeout(() => setWatermarkSaved(false), 2000);
    } catch (err) {
      setToastMessage('Failed to remove watermark');
      setShowToast(true);
    }
  };

  // Handle watermark setting changes
  const handleWatermarkSettingChange = async (key: 'watermark_enabled' | 'watermark_opacity' | 'watermark_position', value: boolean | number | string) => {
    if (!artistId) return;

    const previousSettings = { ...artistSettings };
    setArtistSettings(prev => ({ ...prev, [key]: value }));

    try {
      await artistService.updateSettings(artistId, { [key]: value });

      // Show inline saved indicator
      setWatermarkSaved(true);
      setTimeout(() => setWatermarkSaved(false), 2000);
    } catch (err) {
      setArtistSettings(previousSettings);
      setToastMessage('Failed to update watermark settings');
      setShowToast(true);
    }
  };

  // Handle unblock user
  const handleUnblockUser = async (userId: number) => {
    setUnblocking(userId);
    try {
      await userService.unblock(userId);
      // Remove user from local state
      setBlockedUsers(prev => prev.filter(u => u.id !== userId));
      setToastMessage('User unblocked successfully');
      setShowToast(true);
    } catch (err) {
      console.error('Error unblocking user:', err);
      setToastMessage('Failed to unblock user');
      setShowToast(true);
    } finally {
      setUnblocking(null);
    }
  };

  // Handle social media link change
  const handleSocialMediaChange = (platform: string, value: string) => {
    setSocialMediaLinks(prev => ({ ...prev, [platform]: value }));
    setHasUnsavedSocialLinks(true);
  };

  // Save social media links
  const handleSaveSocialLinks = async () => {
    setSavingSocialLinks(true);
    try {
      // Build array of non-empty links
      const links = Object.entries(socialMediaLinks)
        .filter(([_, username]) => username.trim() !== '')
        .map(([platform, username]) => ({
          platform: platform as 'instagram' | 'facebook' | 'bluesky' | 'x' | 'tiktok',
          username: username.trim().replace(/^@/, ''), // Remove @ if user included it
        }));

      await userService.updateSocialMediaLinks(links);
      setHasUnsavedSocialLinks(false);
      setToastMessage('Social media links updated');
      setShowToast(true);
    } catch (err) {
      console.error('Error saving social media links:', err);
      setToastMessage('Failed to save social media links');
      setShowToast(true);
    } finally {
      setSavingSocialLinks(false);
    }
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
      const result = await saveWorkingHours(hours);
      setWorkingHoursModalOpen(false);

      // If we were waiting to open books, do it now
      if (pendingBooksOpen.current && artistId) {
        pendingBooksOpen.current = false;
        const hasAvailableHours = hours.some((h: any) => !h.is_day_off);
        if (hasAvailableHours) {
          try {
            await artistService.updateSettings(artistId, { books_open: true });
            setArtistSettings(prev => ({ ...prev, books_open: true }));
            setToastMessage('Working hours saved and books opened');
            setShowToast(true);
            return;
          } catch (err) {
            setArtistSettings(prev => ({ ...prev, books_open: false }));
            setToastMessage('Hours saved but failed to open books');
            setShowToast(true);
            return;
          }
        } else {
          // Saved hours but all are day-off, revert books_open
          setArtistSettings(prev => ({ ...prev, books_open: false }));
        }
      }

      if (result.booksClosed) {
        setArtistSettings(prev => ({ ...prev, books_open: false }));
        setToastMessage('Working hours updated. Books have been closed until available hours are set.');
        setShowToast(true);
        return;
      }

      setToastMessage('Working hours updated successfully');
      setShowToast(true);
    } catch (err) {
      if (pendingBooksOpen.current) {
        pendingBooksOpen.current = false;
        setArtistSettings(prev => ({ ...prev, books_open: false }));
      }
      setToastMessage('Failed to update working hours');
      setShowToast(true);
    }
  };

  // Handle working hours modal close — if no valid working hours exist, books must stay closed
  const handleWorkingHoursModalClose = () => {
    pendingBooksOpen.current = false;
    const hasAvailableHours = workingHours.some(h => !h.is_day_off);
    if (!hasAvailableHours) {
      setArtistSettings(prev => ({ ...prev, books_open: false }));
      if (artistId) {
        artistService.updateSettings(artistId, { books_open: false }).catch(() => {});
      }
    }
    setWorkingHoursModalOpen(false);
  };

  // Logout
  const handleLogout = () => {
    authLogout();
  };

  // Delete account
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await userService.deleteAccount();
      setDeleteAccountModalOpen(false);
      authLogout();
    } catch (err: any) {
      setDeleteError('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle email preferences
  const handleToggleEmailPreferences = async () => {
    const newValue = !emailUnsubscribed;
    const previousValue = emailUnsubscribed;

    // Optimistic update
    setEmailUnsubscribed(newValue);
    setSavingEmailPrefs(true);

    try {
      await userService.updateEmailPreferences(newValue);
      setToastMessage(newValue ? 'Marketing emails disabled' : 'Marketing emails enabled');
      setShowToast(true);
    } catch (err) {
      // Revert on error
      setEmailUnsubscribed(previousValue);
      setToastMessage('Failed to update email preferences');
      setShowToast(true);
    } finally {
      setSavingEmailPrefs(false);
    }
  };

  // Get public profile URL
  const getProfileUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://inkedin.com';
    if (isArtist) {
      const identifier = userData?.slug || artistId;
      return identifier ? `${baseUrl}/artists/${identifier}` : null;
    }
    // For studios, use studio slug/id if available
    const studioId = (userData as any)?.studio?.id;
    const studioSlug = (userData as any)?.studio?.slug;
    if (studioId || studioSlug) {
      return `${baseUrl}/studios/${studioSlug || studioId}`;
    }
    return null;
  };

  // Copy profile URL to clipboard
  const handleCopyUrl = async () => {
    const url = getProfileUrl();
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      setToastMessage('Failed to copy URL');
      setShowToast(true);
    }
  };

  const profileUrl = getProfileUrl();

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

  // Use blob URLs from useProfilePhoto for optimistic updates (shows immediately after crop),
  // otherwise use the API data as source of truth
  const optimisticUri = profilePhoto?.webviewPath?.startsWith('blob:') ? profilePhoto.webviewPath : null;
  const serverUri = typeof userData?.image === 'string' ? userData.image : userData?.image?.uri;
  const imageUri = optimisticUri || serverUri;

  return (
    <Layout>
      <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        {/* Sidebar Navigation - Desktop */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            position: 'fixed',
            top: 64,
            left: 0,
            bottom: 0,
            width: 72,
            bgcolor: colors.background,
            borderRight: `1px solid ${colors.border}`,
            py: 3,
            zIndex: 1000,
            transition: 'width 0.2s ease',
            overflow: 'hidden',
            '&:hover': {
              width: 220,
              '& .nav-label': { opacity: 1 }
            }
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, px: 1.5, flex: 1 }}>
            {navItems
              .filter(item => {
                // Filter out artist-only sections for non-artists
                if (!isArtist && ['studio', 'social', 'hours', 'booking', 'watermark', 'travel'].includes(item.id)) {
                  return false;
                }
                return true;
              })
              .map(item => {
                const Icon = item.icon;
                return (
                  <Box
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      px: 1.5,
                      py: 1.5,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: activeSection === item.id ? colors.textPrimary : colors.textSecondary,
                      fontWeight: activeSection === item.id ? 600 : 400,
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                      '&:hover': { bgcolor: colors.surface }
                    }}
                  >
                    <Icon sx={{ fontSize: 24, flexShrink: 0 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        className="nav-label"
                        sx={{
                          fontSize: '0.95rem',
                          opacity: 0,
                          transition: 'opacity 0.15s ease'
                        }}
                      >
                        {item.label}
                      </Typography>
                      {(item as any).badge && (
                        <Box
                          className="nav-label"
                          sx={{
                            opacity: 0,
                            transition: 'opacity 0.15s ease',
                          }}
                        >
                          <ComingSoonBadge size="small" />
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{
          flex: 1,
          ml: { xs: 0, md: '72px' },
          pb: { xs: 12, md: 4 },
          display: 'flex',
          justifyContent: 'center',
        }}>
          <Box sx={{
            maxWidth: '720px',
            width: '100%',
            p: { xs: '1.5rem 1rem 10rem', md: '2rem 1.5rem 4rem' }
          }}>
          {/* Page Header */}
          <Box sx={{ mb: '2rem' }}>
            <Typography sx={{ fontSize: '1.75rem', fontWeight: 600, color: colors.textPrimary, mb: '0.5rem' }}>
              Your Profile
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', color: colors.textSecondary }}>
              This is how clients see you on InkedIn
            </Typography>

            {/* Profile URL with copy button */}
            {profileUrl && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  mt: '0.35rem'
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.9rem',
                    color: colors.accent,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {profileUrl}
                </Typography>
                <IconButton
                  onClick={handleCopyUrl}
                  size="small"
                  sx={{
                    p: '4px',
                    color: urlCopied ? colors.accent : colors.textSecondary,
                    '&:hover': { color: colors.accent, bgcolor: 'transparent' }
                  }}
                >
                  {urlCopied ? (
                    <CheckIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <ContentCopyIcon sx={{ fontSize: 16 }} />
                  )}
                </IconButton>
              </Box>
            )}
          </Box>

          {/* Profile Photo Section */}
          <Box
            id="photo"
            sx={{
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
              {photoLoading && (
                <Box sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: '50%'
                }}>
                  <CircularProgress size={32} sx={{ color: colors.accent }} />
                </Box>
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

          {/* Quick Links (artists only) */}
          {isArtist && artistId && (
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: '0.75rem',
              width: '100%',
              maxWidth: '400px',
              mt: '0.75rem'
            }}>
              <Link
                href="/dashboard"
                style={{ textDecoration: 'none', flex: 1 }}
              >
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  p: '0.75rem 1rem',
                  bgcolor: colors.accent,
                  borderRadius: '8px',
                  color: colors.background,
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: colors.accentHover
                  }
                }}>
                  <DashboardIcon sx={{ fontSize: 18 }} />
                  Dashboard
                </Box>
              </Link>
              <Link
                href={`/artists/${userData?.slug || artistId}`}
                style={{ textDecoration: 'none', flex: 1 }}
              >
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  p: '0.75rem 1rem',
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
                  Public Profile
                </Box>
              </Link>
            </Box>
          )}
        </Box>

        {/* About You Section */}
          <SettingsSection id="about" title="About You" icon={<PersonIcon sx={{ fontSize: 20 }} />} defaultExpanded={false}>
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

        {/* Your Location Section (all users) */}
        <SettingsSection id="location" title="Your Location" icon={<HomeIcon sx={{ fontSize: 20 }} />} defaultExpanded={false}>
          <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary, mb: '1rem' }}>
            {isArtist
              ? 'Set your home location for travel notifications and local search visibility.'
              : 'Set your home location to find artists near you.'}
          </Typography>

          {!editingLocation ? (
            // Display mode - show current location with edit button
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: '0.75rem 1rem',
                bgcolor: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <LocationOnIcon sx={{ fontSize: 20, color: colors.accent }} />
                <Typography sx={{ fontSize: '0.95rem', color: userLocation ? colors.textPrimary : colors.textSecondary }}>
                  {userLocation || 'No location set'}
                </Typography>
              </Box>
              <IconButton
                onClick={() => setEditingLocation(true)}
                sx={{
                  p: '0.5rem',
                  color: colors.textSecondary,
                  '&:hover': { color: colors.accent, bgcolor: 'transparent' }
                }}
              >
                <EditIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          ) : (
            // Edit mode - show autocomplete with save/cancel
            <>
              <FormGroup label="Home Location">
                <LocationAutocomplete
                  value={userLocation}
                  onChange={handleLocationChange}
                  label=""
                  placeholder="Search for your city..."
                />
              </FormGroup>
              <Box sx={{ display: 'flex', gap: '0.75rem', mt: '1rem' }}>
                <Box
                  component="button"
                  onClick={() => {
                    setUserLocation((userData as any)?.location || '');
                    setUserLocationLatLong((userData as any)?.location_lat_long || '');
                    setEditingLocation(false);
                  }}
                  sx={{
                    px: '1rem',
                    py: '0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: `1px solid ${colors.borderLight}`,
                    bgcolor: 'transparent',
                    color: colors.textPrimary,
                    fontFamily: 'inherit',
                    '&:hover': { borderColor: colors.accent, color: colors.accent }
                  }}
                >
                  Cancel
                </Box>
                <Box
                  component="button"
                  onClick={async () => {
                    const success = await handleSaveLocation();
                    if (success) setEditingLocation(false);
                  }}
                  disabled={savingLocation}
                  sx={{
                    px: '1rem',
                    py: '0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: 'none',
                    bgcolor: colors.accent,
                    color: colors.background,
                    fontFamily: 'inherit',
                    opacity: savingLocation ? 0.7 : 1,
                    '&:hover': { bgcolor: colors.accentHover }
                  }}
                >
                  {savingLocation ? 'Saving...' : 'Save Location'}
                </Box>
              </Box>
            </>
          )}
        </SettingsSection>

        {/* Your Studio Section (artists only) */}
          {isArtist && (
            <SettingsSection id="studio" title="Your Studio" icon={<LocationOnIcon sx={{ fontSize: 20 }} />} defaultExpanded={false}>
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

        {/* Social Media Section (artists only) */}
        {isArtist && (
          <SettingsSection id="social" title="Social Media" icon={<ShareIcon sx={{ fontSize: 20 }} />} defaultExpanded={false}>
            <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary, mb: '1rem' }}>
              Add your social media accounts to display on your public profile. Enter just your username, not the full URL.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <FormGroup label="Instagram">
                <TextField
                  fullWidth
                  size="small"
                  placeholder="username"
                  value={socialMediaLinks.instagram}
                  onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                  InputProps={{
                    startAdornment: <InstagramIcon sx={{ fontSize: 20, color: colors.textSecondary, mr: 1 }} />,
                  }}
                  sx={inputStyles}
                />
              </FormGroup>
              <FormGroup label="Facebook">
                <TextField
                  fullWidth
                  size="small"
                  placeholder="username"
                  value={socialMediaLinks.facebook}
                  onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                  InputProps={{
                    startAdornment: <FacebookIcon sx={{ fontSize: 20, color: colors.textSecondary, mr: 1 }} />,
                  }}
                  sx={inputStyles}
                />
              </FormGroup>
              <FormGroup label="X (Twitter)">
                <TextField
                  fullWidth
                  size="small"
                  placeholder="username"
                  value={socialMediaLinks.x}
                  onChange={(e) => handleSocialMediaChange('x', e.target.value)}
                  InputProps={{
                    startAdornment: <XIcon sx={{ fontSize: 20, color: colors.textSecondary, mr: 1 }} />,
                  }}
                  sx={inputStyles}
                />
              </FormGroup>
              <FormGroup label="Bluesky">
                <TextField
                  fullWidth
                  size="small"
                  placeholder="username.bsky.social"
                  value={socialMediaLinks.bluesky}
                  onChange={(e) => handleSocialMediaChange('bluesky', e.target.value)}
                  sx={inputStyles}
                />
              </FormGroup>
              <FormGroup label="TikTok">
                <TextField
                  fullWidth
                  size="small"
                  placeholder="username"
                  value={socialMediaLinks.tiktok}
                  onChange={(e) => handleSocialMediaChange('tiktok', e.target.value)}
                  sx={inputStyles}
                />
              </FormGroup>
            </Box>

            {/* Save Social Links Button */}
            {hasUnsavedSocialLinks && (
              <Box sx={{ display: 'flex', gap: '0.75rem', mt: '1.5rem' }}>
                <Box
                  component="button"
                  onClick={() => {
                    // Re-initialize from userData
                    if ((userData as any).social_media_links) {
                      const links: Record<string, string> = {
                        instagram: '',
                        facebook: '',
                        bluesky: '',
                        x: '',
                        tiktok: '',
                      };
                      (userData as any).social_media_links.forEach((link: { platform: string; username: string }) => {
                        if (links.hasOwnProperty(link.platform)) {
                          links[link.platform] = link.username;
                        }
                      });
                      setSocialMediaLinks(links);
                    }
                    setHasUnsavedSocialLinks(false);
                  }}
                  sx={{
                    px: '1rem',
                    py: '0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: `1px solid ${colors.borderLight}`,
                    bgcolor: 'transparent',
                    color: colors.textPrimary,
                    fontFamily: 'inherit',
                    '&:hover': { borderColor: colors.accent, color: colors.accent }
                  }}
                >
                  Discard
                </Box>
                <Box
                  component="button"
                  onClick={handleSaveSocialLinks}
                  disabled={savingSocialLinks}
                  sx={{
                    px: '1rem',
                    py: '0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: 'none',
                    bgcolor: colors.accent,
                    color: colors.background,
                    fontFamily: 'inherit',
                    opacity: savingSocialLinks ? 0.7 : 1,
                    '&:hover': { bgcolor: colors.accentHover }
                  }}
                >
                  {savingSocialLinks ? 'Saving...' : 'Save Social Links'}
                </Box>
              </Box>
            )}
          </SettingsSection>
        )}

        {/* Your Styles Section */}
          <SettingsSection id="styles" title="Your Styles" icon={<StarIcon sx={{ fontSize: 20 }} />} defaultExpanded={false}>
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

        {/* Your Hours Section (artists only) */}
          {isArtist && (
            <SettingsSection id="hours" title="Your Hours" icon={<AccessTimeIcon sx={{ fontSize: 20 }} />} defaultExpanded={false}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '1rem' }}>
              <Typography variant="h3" sx={{ fontSize: '0.9rem', fontWeight: 500, color: colors.textSecondary, py: '0.5rem' }}>
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

        {/* Booking & Rates Section (artists only) */}
          {isArtist && (
            <SettingsSection id="booking" title="Booking & Rates" icon={<EventIcon sx={{ fontSize: 20 }} />} defaultExpanded={false}>
            {/* Rates Section */}
            <Typography variant="h3" sx={{ fontSize: '0.9rem', fontWeight: 500, color: colors.textSecondary, py: '0.5rem', mb: '0.75rem' }}>
              Your Rates
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '1rem', mb: '1.5rem' }}>
              <FormGroup label="Hourly Rate">
                <TextField
                  fullWidth
                  size="small"
                  placeholder="$200"
                  value={artistSettings.hourly_rate}
                  onChange={(e) => handleRateChange('hourly_rate', e.target.value)}
                  sx={inputStyles}
                />
              </FormGroup>
              <FormGroup label="Minimum Session (hours)">
                <TextField
                  fullWidth
                  size="small"
                  placeholder="2"
                  value={artistSettings.minimum_session}
                  onChange={(e) => handleRateChange('minimum_session', e.target.value)}
                  sx={inputStyles}
                />
              </FormGroup>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '1rem', mb: '1.5rem' }}>
              <FormGroup label="Deposit Amount">
                <TextField
                  fullWidth
                  size="small"
                  placeholder="$150"
                  value={artistSettings.deposit_amount}
                  onChange={(e) => handleRateChange('deposit_amount', e.target.value)}
                  sx={inputStyles}
                />
              </FormGroup>
              <FormGroup label="Consultation Fee">
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Free"
                  value={artistSettings.consultation_fee}
                  onChange={(e) => handleRateChange('consultation_fee', e.target.value)}
                  sx={inputStyles}
                />
              </FormGroup>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '1rem', mb: '1.5rem' }}>
              <FormGroup label="Consultation Duration">
                <Select
                  fullWidth
                  size="small"
                  value={artistSettings.consultation_duration}
                  onChange={(e) => handleRateChange('consultation_duration', e.target.value)}
                  sx={inputStyles}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: colors.surface,
                        border: `1px solid ${colors.border}`,
                        '& .MuiMenuItem-root': {
                          fontSize: '0.85rem',
                          color: colors.textPrimary,
                          '&:hover': { bgcolor: colors.background },
                          '&.Mui-selected': {
                            bgcolor: `${colors.accent}26`,
                            '&:hover': { bgcolor: `${colors.accent}33` },
                          },
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="15">15 minutes</MenuItem>
                  <MenuItem value="30">30 minutes</MenuItem>
                  <MenuItem value="45">45 minutes</MenuItem>
                  <MenuItem value="60">60 minutes</MenuItem>
                </Select>
              </FormGroup>
              <Box />
            </Box>

            {/* Save Rates Button */}
            {hasUnsavedSettings && (
              <Box sx={{ display: 'flex', gap: '0.75rem', mb: '1.5rem' }}>
                <Box
                  component="button"
                  onClick={handleDiscardSettings}
                  sx={{
                    px: '1rem',
                    py: '0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: `1px solid ${colors.borderLight}`,
                    bgcolor: 'transparent',
                    color: colors.textPrimary,
                    fontFamily: 'inherit',
                    '&:hover': { borderColor: colors.accent, color: colors.accent }
                  }}
                >
                  Discard
                </Box>
                <Box
                  component="button"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  sx={{
                    px: '1rem',
                    py: '0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: 'none',
                    bgcolor: colors.accent,
                    color: colors.background,
                    fontFamily: 'inherit',
                    opacity: savingSettings ? 0.7 : 1,
                    '&:hover': { bgcolor: colors.accentHover }
                  }}
                >
                  {savingSettings ? 'Saving...' : 'Save'}
                </Box>
              </Box>
            )}

            {/* Divider */}
            <Box sx={{ height: '1px', bgcolor: colors.border, mb: '1.5rem' }} />

            {/* Booking Preferences */}
            <Typography variant="h3" sx={{ fontSize: '0.9rem', fontWeight: 500, color: colors.textSecondary, py: '0.5rem', mb: '0.5rem' }}>
              Booking Preferences
            </Typography>
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
              <Box>
                <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary, lineHeight: 1.5, mb: '0.5rem' }}>
                  <Box component="span" sx={{ color: colors.accent, fontWeight: 500 }}>Note:</Box>{' '}
                  Turning off "Books Open" will hide your calendar from potential clients and prevent new bookings.
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary, lineHeight: 1.5 }}>
                  <Box component="span" sx={{ color: colors.accent, fontWeight: 500 }}>Consultation windows:</Box>{' '}
                  Set dedicated consultation hours per day in{' '}
                  <Box component="a" href="#hours" sx={{ color: colors.accent, textDecoration: 'underline', cursor: 'pointer' }}>
                    Your Hours
                  </Box>{' '}
                  below. When enabled, consultations can only be booked within those hours, keeping the rest of your day free for tattoo sessions.
                </Typography>
              </Box>
            </Box>
          </SettingsSection>
          )}

          {/* Watermark Section (artists only) */}
          {isArtist && (
            <SettingsSection id="watermark" title="Design Watermark" icon={<BrandingWatermarkIcon sx={{ fontSize: 20 }} />} defaultExpanded={false}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '1rem' }}>
                <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                  Automatically add your watermark to designs when sharing them with clients. This helps protect your work.
                </Typography>
                {watermarkSaved && (
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    px: '0.75rem',
                    py: '0.35rem',
                    bgcolor: `${colors.accent}26`,
                    borderRadius: '100px',
                    flexShrink: 0,
                    ml: '1rem',
                  }}>
                    <CheckIcon sx={{ fontSize: 14, color: colors.accent }} />
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: colors.accent }}>
                      Saved
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Watermark Preview/Upload */}
              <FormGroup label="Watermark Image">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {artistSettings.watermark_image ? (
                    <Box sx={{
                      width: 100,
                      height: 100,
                      border: `1px solid ${colors.borderLight}`,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      position: 'relative',
                      bgcolor: colors.background,
                    }}>
                      <Box
                        component="img"
                        src={artistSettings.watermark_image.uri}
                        alt="Watermark"
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          opacity: artistSettings.watermark_opacity / 100,
                          transition: 'opacity 0.15s ease',
                        }}
                      />
                    </Box>
                  ) : (
                    <Box sx={{
                      width: 100,
                      height: 100,
                      border: `1px dashed ${colors.borderLight}`,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: colors.background,
                    }}>
                      <BrandingWatermarkIcon sx={{ fontSize: 32, color: colors.textSecondary, opacity: 0.5 }} />
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Box
                      component="button"
                      onClick={() => watermarkInputRef.current?.click()}
                      disabled={uploadingWatermark}
                      sx={{
                        px: '1rem',
                        py: '0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        border: `1px solid ${colors.borderLight}`,
                        bgcolor: 'transparent',
                        color: colors.textPrimary,
                        fontFamily: 'inherit',
                        opacity: uploadingWatermark ? 0.7 : 1,
                        '&:hover': { borderColor: colors.accent, color: colors.accent }
                      }}
                    >
                      {uploadingWatermark ? 'Uploading...' : artistSettings.watermark_image ? 'Change' : 'Upload Watermark'}
                    </Box>
                    {artistSettings.watermark_image && (
                      <Box
                        component="button"
                        onClick={handleRemoveWatermark}
                        sx={{
                          px: '1rem',
                          py: '0.5rem',
                          background: 'none',
                          border: 'none',
                          color: colors.error || '#ef4444',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          textAlign: 'left',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        Remove
                      </Box>
                    )}
                  </Box>
                </Box>
                <input
                  type="file"
                  ref={watermarkInputRef}
                  style={{ display: 'none' }}
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  onChange={handleWatermarkUpload}
                />
              </FormGroup>

              {/* Watermark Settings */}
              {artistSettings.watermark_image && (
                <>
                  {/* Enable/Disable */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: '1rem',
                    bgcolor: colors.background,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    mb: '1rem',
                  }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.95rem', fontWeight: 500, color: colors.textPrimary }}>
                        Enable Watermark
                      </Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                        Automatically apply to shared designs
                      </Typography>
                    </Box>
                    <Switch
                      checked={artistSettings.watermark_enabled}
                      onChange={(e) => handleWatermarkSettingChange('watermark_enabled', e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: colors.accent,
                          '& + .MuiSwitch-track': { bgcolor: colors.accent }
                        }
                      }}
                    />
                  </Box>

                  {/* Position */}
                  <FormGroup label="Position">
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'].map((pos) => (
                        <Box
                          key={pos}
                          component="button"
                          onClick={() => handleWatermarkSettingChange('watermark_position', pos)}
                          sx={{
                            px: '0.875rem',
                            py: '0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            border: `1px solid ${artistSettings.watermark_position === pos ? colors.accent : colors.borderLight}`,
                            bgcolor: artistSettings.watermark_position === pos ? `${colors.accent}26` : 'transparent',
                            color: artistSettings.watermark_position === pos ? colors.accent : colors.textSecondary,
                            fontFamily: 'inherit',
                            textTransform: 'capitalize',
                            '&:hover': { borderColor: colors.accent }
                          }}
                        >
                          {pos.replace('-', ' ')}
                        </Box>
                      ))}
                    </Box>
                  </FormGroup>

                  {/* Opacity */}
                  <FormGroup label={`Opacity: ${artistSettings.watermark_opacity}%`}>
                    <Box sx={{ px: '0.5rem' }}>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={artistSettings.watermark_opacity}
                        onChange={(e) => setArtistSettings(prev => ({ ...prev, watermark_opacity: parseInt(e.target.value) }))}
                        onMouseUp={(e) => handleWatermarkSettingChange('watermark_opacity', artistSettings.watermark_opacity)}
                        onTouchEnd={(e) => handleWatermarkSettingChange('watermark_opacity', artistSettings.watermark_opacity)}
                        style={{
                          width: '100%',
                          accentColor: colors.accent,
                        }}
                      />
                    </Box>
                  </FormGroup>
                </>
              )}
            </SettingsSection>
          )}

          {/* Travel & Guest Spots Section (artists only) */}
          {isArtist && (
            <SettingsSection
              id="travel"
              title="Travel & Guest Spots"
              icon={<PublicIcon sx={{ fontSize: 20 }} />}
              defaultExpanded={false}
              badge={<ComingSoonBadge size="small" />}
            >
              <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary, mb: '1rem' }}>
                Let studios know you're interested in guest artist opportunities. This feature is coming soon.
              </Typography>
              <Box sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                p: '1rem',
                bgcolor: `${colors.accent}1A`,
                border: `1px solid ${colors.accent}33`,
                borderRadius: '8px'
              }}>
                <PublicIcon sx={{ fontSize: 20, color: colors.accent, flexShrink: 0, mt: '2px' }} />
                <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary, lineHeight: 1.5 }}>
                  When studios in your dream destinations view your profile, you'll be notified on your dashboard.
                </Typography>
              </Box>
            </SettingsSection>
          )}

          {/* Blocked Users Section */}
          <SettingsSection id="blocked" title="Blocked Users" icon={<BlockIcon sx={{ fontSize: 20 }} />} defaultExpanded={false}>
            {blockedUsers.length === 0 ? (
              <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                You haven't blocked anyone. When you block someone, they won't be able to contact you or see your profile.
              </Typography>
            ) : (
              <>
                <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary, mb: '1rem' }}>
                  You won't see content from these users, and they won't be able to contact you or see your profile.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {blockedUsers.map(user => (
                    <Box
                      key={user.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: '0.75rem 1rem',
                        bgcolor: colors.background,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {/* User avatar */}
                        <Box sx={{
                          width: 40,
                          height: 40,
                          bgcolor: '#242424',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          border: `1px solid ${colors.borderLight}`,
                        }}>
                          {user.image ? (
                            <Image
                              src={user.image}
                              alt={user.name}
                              width={40}
                              height={40}
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: colors.accent }}>
                              {user.name?.substring(0, 2).toUpperCase() || 'U'}
                            </Typography>
                          )}
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: colors.textPrimary }}>
                            {user.name}
                          </Typography>
                          {user.username && (
                            <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                              @{user.username}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Box
                        component="button"
                        onClick={() => handleUnblockUser(user.id)}
                        disabled={unblocking === user.id}
                        sx={{
                          px: '0.875rem',
                          py: '0.4rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          border: `1px solid ${colors.borderLight}`,
                          bgcolor: 'transparent',
                          color: colors.textPrimary,
                          fontFamily: 'inherit',
                          opacity: unblocking === user.id ? 0.7 : 1,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: colors.accent,
                            color: colors.accent
                          }
                        }}
                      >
                        {unblocking === user.id ? 'Unblocking...' : 'Unblock'}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </SettingsSection>

          {/* Account Section */}
          <SettingsSection id="account" title="Account" icon={<PersonIcon sx={{ fontSize: 20 }} />} defaultExpanded={false}>
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
              onClick={() => setChangePasswordModalOpen(true)}
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
              onClick={async () => {
                try {
                  const { user_id } = await messageService.getSupportContact();
                  if (user_id) {
                    router.push(`/inbox?contactId=${user_id}`);
                    return;
                  }
                } catch {}
                router.push('/contact');
              }}
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
                Support
              </Typography>
              <ExpandMoreIcon sx={{ fontSize: 20, color: colors.textSecondary, transform: 'rotate(-90deg)' }} />
            </Box>

            {/* Email Preferences */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: '0.75rem',
                borderRadius: '6px',
                mt: 2,
                borderTop: `1px solid ${colors.border}`,
                pt: 2,
              }}
            >
              <Box>
                <Typography sx={{ fontSize: '0.9rem', color: colors.textPrimary }}>
                  Marketing Emails
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: colors.textSecondary }}>
                  Receive notifications about bookings, messages, and updates
                </Typography>
              </Box>
              <Switch
                checked={!emailUnsubscribed}
                onChange={handleToggleEmailPreferences}
                disabled={savingEmailPrefs}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: colors.accent,
                    '& + .MuiSwitch-track': { bgcolor: colors.accent }
                  }
                }}
              />
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
            <Box
              onClick={() => setDeleteAccountModalOpen(true)}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: '0.75rem',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
                '&:hover': { bgcolor: colors.background },
                mt: 2,
                borderTop: `1px solid ${colors.border}`,
                pt: 2,
              }}
            >
              <Typography sx={{ fontSize: '0.9rem', color: colors.error }}>
                Delete Account
              </Typography>
              <ExpandMoreIcon sx={{ fontSize: 20, color: colors.textSecondary, transform: 'rotate(-90deg)' }} />
            </Box>
          </Box>
          </SettingsSection>
          </Box>
        </Box>

        {/* Bottom Navigation - Mobile */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: colors.background,
            borderTop: `1px solid ${colors.border}`,
            py: 1,
            px: 1,
            zIndex: 50,
            justifyContent: 'space-around',
            overflowX: 'auto'
          }}
        >
          {navItems
            .filter(item => {
              // Filter out artist-only sections for non-artists
              if (!isArtist && ['studio', 'social', 'hours', 'booking', 'watermark', 'travel'].includes(item.id)) {
                return false;
              }
              return true;
            })
            .map(item => {
              const Icon = item.icon;
              return (
                <Box
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.25,
                    px: 1,
                    py: 0.75,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: activeSection === item.id ? colors.accent : colors.textSecondary,
                    transition: 'color 0.15s ease',
                    minWidth: 50
                  }}
                >
                  <Icon sx={{ fontSize: 22 }} />
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: activeSection === item.id ? 600 : 400 }}>
                    {item.label}
                  </Typography>
                </Box>
              );
            })}
        </Box>
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
        pb: { xs: 'calc(5rem + env(safe-area-inset-bottom, 0px))', md: '1rem' },
        transform: hasUnsavedChanges ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease',
        zIndex: 100
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

      {/* Modal for changing password */}
      <ChangePasswordModal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
      />

      {/* Modal for selecting styles */}
      <StyleModal
        isOpen={styleModalOpen}
        onClose={() => setStyleModalOpen(false)}
        onApply={handleApplyStyles}
        selectedStyles={selectedStyles}
      />

      {/* Modal for setting working hours */}
      {isArtist && artistId && (
        <WorkingHoursModal
          isOpen={workingHoursModalOpen}
          onClose={handleWorkingHoursModalClose}
          onSave={handleSaveWorkingHours}
          artistId={artistId}
          initialWorkingHours={workingHours}
          infoText={pendingBooksOpen.current ? 'In order to set your books to open you must have working hours set.' : undefined}
        />
      )}

      {/* Modal for cropping profile photo */}
      {cropperImage && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          imageSrc={cropperImage}
          onClose={handleCropCancel}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Delete Account Confirmation Modal */}
      <Dialog
        open={deleteAccountModalOpen}
        onClose={() => {
          setDeleteAccountModalOpen(false);
          setDeleteError(null);
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: modalStyles.paper }}
        slotProps={{ backdrop: { sx: modalStyles.backdrop } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <WarningAmberIcon sx={{ color: colors.error }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Delete Account
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Alert
            severity="warning"
            sx={{
              mb: 2,
              bgcolor: `${colors.error}15`,
              color: colors.textPrimary,
              border: `1px solid ${colors.error}40`,
              '& .MuiAlert-icon': {
                color: colors.error,
              },
            }}
          >
            Are you sure? Once deleted, this account cannot be recovered.
          </Alert>

          <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
            This will permanently delete your account and all associated data including your profile, saved tattoos, and any studio affiliations.
          </Typography>

          {deleteError && (
            <Alert
              severity="error"
              sx={{
                mt: 2,
                bgcolor: `${colors.error}1A`,
                color: colors.error,
                border: `1px solid ${colors.error}40`,
                '& .MuiAlert-icon': {
                  color: colors.error,
                },
              }}
            >
              {deleteError}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button
            onClick={() => {
              setDeleteAccountModalOpen(false);
              setDeleteError(null);
            }}
            disabled={isDeleting}
            sx={{
              px: 3,
              py: 1,
              color: colors.textSecondary,
              borderRadius: '6px',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': { bgcolor: colors.background },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} sx={{ color: colors.textMuted }} /> : null}
            sx={{
              px: 3,
              py: 1,
              bgcolor: colors.error,
              color: '#fff',
              borderRadius: '6px',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': { bgcolor: colors.error, opacity: 0.9 },
              '&:disabled': { bgcolor: colors.border, color: colors.textMuted },
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast notification */}
      {showToast && (
        <Box sx={{
          position: 'fixed',
          bottom: { xs: hasUnsavedChanges ? 200 : 80, md: hasUnsavedChanges ? 80 : 16 },
          right: '1rem',
          px: '1rem',
          py: '0.75rem',
          bgcolor: colors.surface,
          color: colors.textPrimary,
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          border: `1px solid ${colors.border}`,
          zIndex: 150
        }}>
          {toastMessage}
        </Box>
      )}
    </Layout>
  );
};

export default withAuth(ProfilePage);

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import {Box, Typography, Button, Avatar, Switch, TextField, IconButton, CircularProgress, Divider, Menu, MenuItem, ListItemIcon, ListItemText, Dialog, DialogContent, DialogTitle, Tooltip} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AddIcon from '@mui/icons-material/Add';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CampaignIcon from '@mui/icons-material/Campaign';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CollectionsIcon from '@mui/icons-material/Collections';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import LockIcon from '@mui/icons-material/Lock';
import SettingsIcon from '@mui/icons-material/Settings';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import StarIcon from '@mui/icons-material/Star';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist, WishlistArtist } from '@/hooks/useClientDashboard';
import { colors } from '@/styles/colors';
import { studioService } from '@/services/studioService';
import { artistService } from '@/services/artistService';
import { leadService } from '@/services/leadService';
import { userService } from '@/services/userService';
import { tattooService } from '@/services/tattooService';
import { StudioType } from '@/models/studio.interface';
import EditStudioModal from '../components/EditStudioModal';
import WorkingHoursModal, { WorkingHour } from '../components/WorkingHoursModal';
import AddArtistModal from '../components/AddArtistModal';
import ClientDashboardContent from '../components/ClientDashboardContent';
import ChangePasswordModal from '../components/ChangePasswordModal';
import TattooCreateWizard from '../components/TattooCreateWizard';
import ComingSoonBadge from '../components/ui/ComingSoonBadge';
import StudioInvitations from '../components/StudioInvitations';

// Dashboard components
import {
  Card,
  CardLink,
  StatCard,
  DashboardTab,
  ScheduleItem,
  ActivityItem,
  SavedArtistCard,
  LeadCard,
} from '../components/dashboard';

// Dashboard types
import type {
  DashboardStats,
  ScheduleItem as ScheduleItemType,
  ActivityItem as ActivityItemType,
  StudioArtist,
  Announcement,
  Tattoo,
  Lead,
  DashboardTabType,
} from '../components/dashboard';

import { defaultStats } from '../components/dashboard';

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTabType>('artist');

  // Modal states
  const [editStudioOpen, setEditStudioOpen] = useState(false);
  const [addArtistOpen, setAddArtistOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [uploadTattooOpen, setUploadTattooOpen] = useState(false);
  const [uploadMenuAnchor, setUploadMenuAnchor] = useState<null | HTMLElement>(null);
  const [workingHoursOpen, setWorkingHoursOpen] = useState(false);

  // Studio data states
  const [studioData, setStudioData] = useState<any>(null);
  const [studioArtists, setStudioArtists] = useState<StudioArtist[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [seekingGuests, setSeekingGuests] = useState(false);
  const [guestSpotDetails, setGuestSpotDetails] = useState('');
  const [isSavingGuestDetails, setIsSavingGuestDetails] = useState(false);
  const [studioStats, setStudioStats] = useState<{
    page_views: { count: number; trend: number; trend_label: string };
    bookings: { count: number; trend: number; trend_label: string };
    inquiries: { count: number; trend: number; trend_label: string };
    artists_count: number;
  } | null>(null);
  const [studioWorkingHours, setStudioWorkingHours] = useState<WorkingHour[]>([]);

  // Studio contact info editing
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    address: '',
    address2: '',
    city: '',
    state: '',
    postal_code: '',
    phone: '',
  });
  const [isSavingContact, setIsSavingContact] = useState(false);

  // Artist data states
  const [artistSeekingSpots, setArtistSeekingSpots] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [artistTattoos, setArtistTattoos] = useState<Tattoo[]>([]);
  const [isLoadingTattoos, setIsLoadingTattoos] = useState(false);

  // Leads for artists to reach out to
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Dashboard stats and schedule (fetched from API)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(defaultStats);
  const [schedule, setSchedule] = useState<ScheduleItemType[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Saved artists (wishlist)
  const { wishlist: savedArtists, loading: savedArtistsLoading, removeFromWishlist } = useWishlist();

  // Announcement form
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [isAddingAnnouncement, setIsAddingAnnouncement] = useState(false);

  // File input refs
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const userName = user?.name?.split(' ')[0] || user?.username || '';
  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() || 'U';
  const ownedStudio = user?.owned_studio || user?.studio;
  const studioInitials = ownedStudio?.name
    ? ownedStudio.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'ST';
  // type_id: 1 = client/enthusiast, 2 = artist, 3 = studio
  const isClient = user?.type_id === 1 || user?.type_id === '1' || user?.type === 'client';
  const isStudioAccount = user?.type_id === 3 || user?.type_id === '3' || user?.type === 'studio';
  const hasStudio = (user?.is_studio_admin && ownedStudio) || isStudioAccount;


  // Set default tab to 'studio' for pure studio accounts
  useEffect(() => {
    if (isStudioAccount) {
      setActiveTab('studio');
    }
  }, [isStudioAccount]);

  // Create or claim studio from pending data for newly verified studio accounts
  useEffect(() => {
    const createPendingStudio = async () => {
      // Only run for studio accounts without an existing owned_studio
      if (!isStudioAccount || ownedStudio || !user?.id) return;

      // Check for pending studio data from registration
      const pendingDataStr = localStorage.getItem('pendingStudioData');
      if (!pendingDataStr) return;

      try {
        const pendingData = JSON.parse(pendingDataStr);
        console.log('Processing pending studio data...', pendingData);

        // Generate slug from username or name
        const generateSlug = (text: string) => {
          return text.toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        };

        const studioPayload = {
          name: pendingData.name || '',
          slug: generateSlug(pendingData.username || pendingData.name || ''),
          about: pendingData.bio || '',
          location: pendingData.location || '',
          location_lat_long: pendingData.locationLatLong || '',
          owner_id: user.id,
          email: pendingData.email || undefined,
          phone: pendingData.phone || undefined,
        };

        // Check if this is claiming an existing studio or creating a new one
        if (pendingData.existingStudioId) {
          // Claim existing Google Places studio
          console.log('Claiming existing studio:', pendingData.existingStudioId);
          await studioService.claim(pendingData.existingStudioId, studioPayload);
          console.log('Studio claimed successfully');
        } else {
          // Create new studio
          console.log('Creating new studio...');
          await studioService.create(studioPayload);
          console.log('Studio created successfully');
        }

        // Clear pending data
        localStorage.removeItem('pendingStudioData');

        // Refresh user to get the owned_studio
        await refreshUser();
      } catch (err) {
        console.error('Failed to create/claim studio from pending data:', err);
        // Don't remove pending data on error so it can be retried
      }
    };

    createPendingStudio();
  }, [isStudioAccount, ownedStudio, user?.id, refreshUser]);

  // Load studio data when tab switches to studio (or on mount for studio accounts)
  useEffect(() => {
    if (hasStudio && activeTab === 'studio' && ownedStudio?.id) {
      loadStudioData();
    }
  }, [activeTab, hasStudio, ownedStudio?.id]);

  // Load artist tattoos on mount (only for artists, not studio accounts)
  useEffect(() => {
    if (user?.id && !isStudioAccount) {
      loadArtistTattoos();
    }
  }, [user?.id, isStudioAccount]);

  // Load leads for artists (not for studio accounts or clients)
  useEffect(() => {
    const loadLeads = async () => {
      if (!user?.id || isClient || isStudioAccount) return;
      setIsLoadingLeads(true);
      try {
        const response = await leadService.getForArtists();
        setLeads(response.leads || []);
      } catch (err) {
        console.error('Failed to load leads:', err);
      } finally {
        setIsLoadingLeads(false);
      }
    };
    loadLeads();
  }, [user?.id, isClient, isStudioAccount]);

  // Load dashboard stats and schedule (only for artists, not studio accounts)
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id || isStudioAccount) return;

      setIsLoadingStats(true);
      try {
        // Define types for dashboard API responses
        interface DashboardStatsResponse {
          upcoming_appointments?: number;
          appointments_trend?: string;
          profile_views?: number;
          views_trend?: string;
          saves_this_week?: number;
          saves_trend?: string;
        }

        // Fetch stats and schedule in parallel
        const [statsRes, scheduleRes] = await Promise.all([
          artistService.getDashboardStats(user.id).catch(() => null),
          artistService.getUpcomingSchedule(user.id).catch(() => null)
        ]);

        if (statsRes) {
          // API returns { data: { ... } }, so extract the data object
          const stats = (statsRes as any).data || statsRes;
          setDashboardStats({
            upcomingAppointments: stats.upcoming_appointments || 0,
            appointmentsTrend: stats.appointments_trend || '+0',
            profileViews: stats.profile_views || 0,
            viewsTrend: stats.views_trend || '+0%',
            savesThisWeek: stats.saves_this_week || 0,
            savesTrend: stats.saves_trend || '+0',
            unreadMessages: stats.unread_messages || 0
          });
        }

        if (scheduleRes) {
          // API returns { data: [...] }, so extract the data array
          const scheduleData = (scheduleRes as any).data || scheduleRes;
          setSchedule(Array.isArray(scheduleData) ? scheduleData : []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    if (user?.id && !isStudioAccount) {
      loadDashboardData();
    }
  }, [user?.id, isStudioAccount]);

  const loadArtistTattoos = async () => {
    if (!user?.slug) return;
    setIsLoadingTattoos(true);
    try {
      const response = await artistService.getBySlug(user.slug);
      setArtistTattoos(response.artist?.tattoos || []);
    } catch (err) {
      console.error('Failed to load tattoos:', err);
    } finally {
      setIsLoadingTattoos(false);
    }
  };

  const loadStudioData = async () => {
    if (!ownedStudio?.id) return;
    try {
      const [studioRes, artistsRes, announcementsRes, statsRes, workingHoursRes] = await Promise.all([
        studioService.getById(ownedStudio.id),
        studioService.getArtists(ownedStudio.id),
        studioService.getAnnouncements(ownedStudio.id),
        studioService.getDashboardStats(ownedStudio.id).catch(() => null),
        studioService.getHours(ownedStudio.id).catch(() => []),
      ]);
      const studio = (studioRes as any).studio || studioRes;
      setStudioData(studio);
      setStudioArtists(Array.isArray(artistsRes) ? artistsRes : []);
      setAnnouncements(Array.isArray(announcementsRes) ? announcementsRes : []);
      setSeekingGuests(studio?.seeking_guest_artists || false);
      setGuestSpotDetails(studio?.guest_spot_details || '');
      // Initialize contact form with current studio data
      setContactForm({
        address: studio?.address || '',
        address2: studio?.address2 || '',
        city: studio?.city || '',
        state: studio?.state || '',
        postal_code: studio?.postal_code || '',
        phone: studio?.phone || '',
      });
      if (statsRes) {
        setStudioStats(statsRes);
      }
      // Set working hours from API response
      const hours = Array.isArray(workingHoursRes) ? workingHoursRes : (workingHoursRes as any)?.data || [];
      setStudioWorkingHours(hours);
    } catch (err) {
      console.error('Failed to load studio data:', err);
    }
  };

  const handleToggleSeekingGuests = async () => {
    if (!ownedStudio?.id) return;
    const newValue = !seekingGuests;
    setSeekingGuests(newValue);
    try {
      await studioService.updateDetails(ownedStudio.id, { seeking_guest_artists: newValue });
    } catch (err) {
      setSeekingGuests(!newValue); // Revert on error
      console.error('Failed to update seeking status:', err);
    }
  };

  const handleSaveGuestSpotDetails = async () => {
    if (!ownedStudio?.id) return;
    setIsSavingGuestDetails(true);
    try {
      await studioService.updateDetails(ownedStudio.id, { guest_spot_details: guestSpotDetails });
    } catch (err) {
      console.error('Failed to save guest spot details:', err);
    } finally {
      setIsSavingGuestDetails(false);
    }
  };

  const handleSaveContactInfo = async () => {
    if (!ownedStudio?.id) return;
    setIsSavingContact(true);
    try {
      await studioService.updateDetails(ownedStudio.id, contactForm);
      setStudioData((prev: any) => ({ ...prev, ...contactForm }));
      setIsEditingContact(false);
    } catch (err) {
      console.error('Failed to save contact info:', err);
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleCancelContactEdit = () => {
    // Reset form to current studio data
    setContactForm({
      address: studioData?.address || '',
      address2: studioData?.address2 || '',
      city: studioData?.city || '',
      state: studioData?.state || '',
      postal_code: studioData?.postal_code || '',
      phone: studioData?.phone || '',
    });
    setIsEditingContact(false);
  };

  const handleSaveBusinessHours = async (hours: WorkingHour[]) => {
    if (!ownedStudio?.id) return;
    try {
      // Save all working hours to the API (same format as artists)
      await studioService.setWorkingHours(ownedStudio.id, hours);
      // Reload studio data to get updated hours
      loadStudioData();
    } catch (err) {
      console.error('Failed to save business hours:', err);
    }
  };

  const handleRemoveArtist = async (artistId: number) => {
    if (!ownedStudio?.id) return;
    try {
      await studioService.removeArtist(ownedStudio.id, artistId);
      setStudioArtists(prev => prev.filter(a => a.id !== artistId));
    } catch (err) {
      console.error('Failed to remove artist:', err);
    }
  };

  const handleVerifyArtist = async (artistId: number) => {
    if (!ownedStudio?.id) return;
    try {
      await studioService.verifyArtist(ownedStudio.id, artistId);
      setStudioArtists(prev => prev.map(a =>
        a.id === artistId ? { ...a, is_verified: true, verified_at: new Date().toISOString() } : a
      ));
    } catch (err) {
      console.error('Failed to verify artist:', err);
    }
  };

  const handleUnverifyArtist = async (artistId: number) => {
    if (!ownedStudio?.id) return;
    try {
      await studioService.unverifyArtist(ownedStudio.id, artistId);
      setStudioArtists(prev => prev.map(a =>
        a.id === artistId ? { ...a, is_verified: false, verified_at: null } : a
      ));
    } catch (err) {
      console.error('Failed to unverify artist:', err);
    }
  };

  const [leavingStudioId, setLeavingStudioId] = useState<number | null>(null);
  const handleLeaveStudio = async (studioId: number) => {
    setLeavingStudioId(studioId);
    try {
      await artistService.leaveStudio(studioId);
      await refreshUser();
    } catch (err) {
      console.error('Failed to leave studio:', err);
    } finally {
      setLeavingStudioId(null);
    }
  };

  const [settingPrimaryStudioId, setSettingPrimaryStudioId] = useState<number | null>(null);
  const handleSetPrimaryStudio = async (studioId: number) => {
    setSettingPrimaryStudioId(studioId);
    try {
      await artistService.setPrimaryStudio(studioId);
      await refreshUser();
    } catch (err) {
      console.error('Failed to set primary studio:', err);
    } finally {
      setSettingPrimaryStudioId(null);
    }
  };

  const handleAddAnnouncement = async () => {
    if (!ownedStudio?.id || !newAnnouncement.title || !newAnnouncement.content) return;
    setIsAddingAnnouncement(true);
    try {
      const res = await studioService.createAnnouncement(ownedStudio.id, newAnnouncement);
      setAnnouncements(prev => [(res as any).announcement || res, ...prev]);
      setNewAnnouncement({ title: '', content: '' });
    } catch (err) {
      console.error('Failed to add announcement:', err);
    } finally {
      setIsAddingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: number) => {
    if (!ownedStudio?.id) return;
    try {
      await studioService.deleteAnnouncement(ownedStudio.id, announcementId);
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
    } catch (err) {
      console.error('Failed to delete announcement:', err);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('profile_photo', file);
      await userService.uploadProfilePhoto(formData);
      await refreshUser();
    } catch (err) {
      console.error('Failed to upload avatar:', err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleToggleFeatured = async (tattooId: number) => {
    // Optimistically update
    setArtistTattoos(prev => prev.map(t =>
      t.id === tattooId ? { ...t, is_featured: !t.is_featured } : t
    ));
    try {
      await tattooService.toggleFeatured(tattooId);
    } catch (err) {
      // Revert on error
      setArtistTattoos(prev => prev.map(t =>
        t.id === tattooId ? { ...t, is_featured: !t.is_featured } : t
      ));
      console.error('Failed to toggle featured:', err);
    }
  };

  // Render client dashboard for clients (type_id = 1)
  if (isClient) {
    return (
      <Layout>
        <Head>
          <title>Dashboard | InkedIn</title>
          <meta name="description" content="Your personal tattoo journey dashboard" />
        </Head>
        <ClientDashboardContent userName={userName} userId={user?.id || 0} />
      </Layout>
    );
  }

  // Render artist dashboard for artists (type_id = 2)
  return (
    <Layout>
      <Head>
        <title>Dashboard | InkedIn</title>
        <meta name="description" content="Your artist dashboard" />
      </Head>

      <Box sx={{ maxWidth: 1400, mx: 'auto', py: 3, px: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          mb: 2
        }}>
          <Box>
            <Typography sx={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontWeight: 600,
              color: colors.textPrimary,
              mb: 0.25
            }}>
              Welcome back {isStudioAccount ? ownedStudio?.name : userName}
            </Typography>
            <Typography sx={{ color: colors.textSecondary, fontSize: '0.95rem' }}>
              Here's what's happening this week
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', md: 'auto' }, flexWrap: 'wrap' }}>
            <Button
              component={Link}
              href={isStudioAccount || (activeTab === 'studio' && (studioData?.slug || ownedStudio?.slug))
                ? `/studios/${studioData?.slug || ownedStudio?.slug}`
                : (user?.slug ? `/artists/${user.slug}` : '#')}
              sx={{
                flex: { xs: 1, md: 'none' },
                px: 2,
                py: 1,
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.9rem',
                '&:hover': { borderColor: colors.accent, color: colors.accent }
              }}
              startIcon={<VisibilityIcon sx={{ fontSize: 18 }} />}
            >
              {isStudioAccount ? 'View Studio Page' : 'View Public Profile'}
            </Button>
            {/* Settings button for studios */}
            {isStudioAccount && (
              <IconButton
                onClick={() => setEditStudioOpen(true)}
                sx={{
                  color: colors.textPrimary,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  '&:hover': { borderColor: colors.accent, color: colors.accent }
                }}
              >
                <SettingsIcon sx={{ fontSize: 20 }} />
              </IconButton>
            )}
            {/* Upload button - only show for artists, not pure studio accounts */}
            {!isStudioAccount && (
            <Button
              onClick={(e) => setUploadMenuAnchor(e.currentTarget)}
              sx={{
                flex: { xs: 1, md: 'none' },
                px: 2,
                py: 1,
                bgcolor: colors.accent,
                color: colors.background,
                borderRadius: '6px',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.9rem',
                '&:hover': { bgcolor: colors.accentHover }
              }}
              startIcon={<AddIcon sx={{ fontSize: 18 }} />}
              endIcon={<ArrowDropDownIcon sx={{ fontSize: 18 }} />}
            >
              Upload
            </Button>
            )}
            <Menu
              anchorEl={uploadMenuAnchor}
              open={Boolean(uploadMenuAnchor)}
              onClose={() => setUploadMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{
                sx: {
                  bgcolor: colors.surface,
                  border: `1px solid ${colors.border}`,
                  mt: 1,
                  minWidth: 200,
                }
              }}
            >
              <MenuItem
                onClick={() => {
                  setUploadMenuAnchor(null);
                  setUploadTattooOpen(true);
                }}
                sx={{
                  color: colors.textPrimary,
                  py: 1.5,
                  '&:hover': { bgcolor: colors.background }
                }}
              >
                <ListItemIcon>
                  <CloudUploadIcon sx={{ color: colors.accent }} />
                </ListItemIcon>
                <ListItemText
                  primary="Upload Single"
                  secondary="Add one tattoo at a time"
                  primaryTypographyProps={{ fontWeight: 500 }}
                  secondaryTypographyProps={{ fontSize: '0.75rem', color: colors.textMuted }}
                />
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setUploadMenuAnchor(null);
                  router.push('/bulk-upload');
                }}
                sx={{
                  color: colors.textPrimary,
                  py: 1.5,
                  '&:hover': { bgcolor: colors.background }
                }}
              >
                <ListItemIcon>
                  <CollectionsIcon sx={{ color: colors.accent }} />
                </ListItemIcon>
                <ListItemText
                  primary="Bulk Upload"
                  secondary="Import from Instagram or ZIP"
                  primaryTypographyProps={{ fontWeight: 500 }}
                  secondaryTypographyProps={{ fontSize: '0.75rem', color: colors.textMuted }}
                />
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Dashboard Tabs - only show if user has a studio AND is not a pure studio account */}
        {hasStudio && !isStudioAccount && (
          <Box sx={{
            display: 'flex',
            gap: 3,
            mb: 3,
            borderBottom: `1px solid ${colors.border}`,
            pb: 0
          }}>
            <DashboardTab
              label="My Artist Profile"
              initials={userInitials}
              imageUrl={typeof user?.image === 'string' ? user.image : user?.image?.uri}
              isActive={activeTab === 'artist'}
              onClick={() => setActiveTab('artist')}
              accentAvatar
            />
            <DashboardTab
              label={ownedStudio?.name || 'My Studio'}
              initials={studioInitials}
              imageUrl={typeof (ownedStudio?.image || studioData?.image) === 'string' ? (ownedStudio?.image || studioData?.image) : (ownedStudio?.image?.uri || studioData?.image?.uri)}
              isActive={activeTab === 'studio'}
              onClick={() => setActiveTab('studio')}
            />
          </Box>
        )}

        {/* Studio Invitations - Only for artists, not studio accounts */}
        {!isStudioAccount && activeTab === 'artist' && (
          <StudioInvitations onInvitationAccepted={refreshUser} />
        )}

        {/* Stats Row */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3
        }}>
          {activeTab === 'artist' ? (
            <>
              <StatCard
                icon={<CalendarMonthIcon />}
                value={dashboardStats.upcomingAppointments}
                label="Upcoming Appointments"
                trend={dashboardStats.appointmentsTrend}
                trendUp
              />
              <StatCard
                icon={<VisibilityIcon />}
                value={dashboardStats.profileViews.toLocaleString()}
                label="Profile Views This Week"
                trend={dashboardStats.viewsTrend}
                trendUp
              />
              <StatCard
                icon={<FavoriteIcon />}
                value={dashboardStats.savesThisWeek}
                label="Saves This Week"
                trend={dashboardStats.savesTrend}
                trendUp
              />
              <StatCard
                icon={<ChatBubbleOutlineIcon />}
                value={dashboardStats.unreadMessages}
                label="Unread Messages"
                trend="New"
              />
            </>
          ) : (
            <>
              <StatCard
                icon={<CalendarMonthIcon />}
                value={studioStats?.bookings?.count ?? 0}
                label="Studio Bookings This Week"
                trend={studioStats?.bookings?.trend_label || ''}
                trendUp={(studioStats?.bookings?.trend ?? 0) >= 0}
              />
              <StatCard
                icon={<VisibilityIcon />}
                value={studioStats?.page_views?.count ?? 0}
                label="Studio Page Views"
                trend={studioStats?.page_views?.trend_label || ''}
                trendUp={(studioStats?.page_views?.trend ?? 0) >= 0}
              />
              <StatCard
                icon={<StarIcon />}
                value={studioStats?.artists_count ?? studioArtists.length}
                label="Artists at Studio"
                trend=""
              />
              <StatCard
                icon={<ChatBubbleOutlineIcon />}
                value={studioStats?.inquiries?.count ?? 0}
                label="Studio Inquiries"
                trend={studioStats?.inquiries?.trend_label || ''}
              />
            </>
          )}
        </Box>

        {/* Main Grid */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 340px', lg: '1fr 380px' },
          gap: 2
        }}>
          {/* Main Column */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Upcoming Schedule */}
            <Card
              title={activeTab === 'artist' ? 'Upcoming Schedule' : 'Studio Schedule'}
              action={<CardLink href={activeTab === 'artist' ? '/calendar' : '/studio-calendar'}>View Calendar →</CardLink>}
            >
              <Box>
                {schedule.length > 0 ? (
                  schedule.map((item, index) => (
                    <ScheduleItem key={item.id} item={item} isLast={index === schedule.length - 1} />
                  ))
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography sx={{ color: colors.textMuted, fontSize: '0.9rem' }}>
                      No upcoming appointments scheduled
                    </Typography>
                  </Box>
                )}
              </Box>
            </Card>

            {/* Clients to Reach Out To */}
            {activeTab === 'artist' && (
              <Card
                title="Clients to Reach Out To"
                subtitle="People looking for their next tattoo"
                icon={<PersonAddIcon />}
              >
                {isLoadingLeads ? (
                  <Box sx={{ display: 'flex', gap: 2, p: 2, overflowX: 'auto' }}>
                    {[1, 2, 3, 4].map((i) => (
                      <Box key={i} sx={{ minWidth: 120, textAlign: 'center' }}>
                        <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: colors.background, mx: 'auto', mb: 1 }} />
                        <Box sx={{ width: 80, height: 12, bgcolor: colors.background, mx: 'auto', mb: 0.5 }} />
                        <Box sx={{ width: 60, height: 10, bgcolor: colors.background, mx: 'auto' }} />
                      </Box>
                    ))}
                  </Box>
                ) : leads.length > 0 ? (
                  <Box sx={{
                    display: 'flex',
                    gap: 2,
                    p: 2,
                    overflowX: 'auto',
                    '&::-webkit-scrollbar': { height: 6 },
                    '&::-webkit-scrollbar-track': { bgcolor: colors.background, borderRadius: 3 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: colors.border, borderRadius: 3 },
                  }}>
                    {leads.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <PersonAddIcon sx={{ fontSize: 32, color: colors.textMuted, mb: 1 }} />
                    <Typography sx={{ color: colors.textMuted, fontSize: '0.9rem', mb: 0.5 }}>
                      No leads available yet
                    </Typography>
                    <Typography sx={{ color: colors.textMuted, fontSize: '0.8rem' }}>
                      Check back soon for people looking for tattoos
                    </Typography>
                  </Box>
                )}
              </Card>
            )}

            {/* Artists not yet verified -- Studio Tab */}
            {activeTab === 'studio' && (
              <Card
                title="Studio Artists"
                subtitle="Manage pending artist requests or add artists to your studio"
                icon={<HourglassEmptyIcon />}
              >
                <Box sx={{
                  display: 'flex',
                  gap: 2,
                  p: 2,
                  overflowX: 'auto',
                  '&::-webkit-scrollbar': { height: 6 },
                  '&::-webkit-scrollbar-track': { bgcolor: colors.background, borderRadius: 3 },
                  '&::-webkit-scrollbar-thumb': { bgcolor: colors.border, borderRadius: 3 },
                }}>
                  {/* Pending Artists */}
                  {studioArtists.filter(a => !a.is_verified && a.id !== user?.id).map((artist) => {
                    const artistInitials = artist.name
                      ? artist.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      : artist.username?.slice(0, 2).toUpperCase() || 'AR';
                    const isStudioInvite = artist.initiated_by === 'studio';
                    return (
                      <Box
                        key={artist.id}
                        sx={{
                          minWidth: 140,
                          textAlign: 'center',
                          p: 2,
                          bgcolor: `${colors.accent}08`,
                          borderRadius: '12px',
                          border: `1px solid ${colors.accent}30`,
                        }}
                      >
                        <Avatar
                          src={artist.image?.uri}
                          sx={{
                            width: 64,
                            height: 64,
                            mx: 'auto',
                            mb: 1,
                            bgcolor: colors.background,
                            color: colors.textSecondary,
                            fontSize: '1rem',
                            fontWeight: 600
                          }}
                        >
                          {artistInitials}
                        </Avatar>
                        <Typography sx={{ fontWeight: 500, color: colors.textPrimary, fontSize: '0.85rem', mb: 0.25 }}>
                          {artist.name || artist.username}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted, mb: isStudioInvite ? 0.5 : 1.5 }}>
                          @{artist.username}
                        </Typography>
                        {isStudioInvite ? (
                          /* Studio invited this artist - waiting for them to accept */
                          <>
                            <Typography sx={{ fontSize: '0.75rem', color: colors.accent, fontWeight: 500, mb: 1.5 }}>
                              Invitation pending
                            </Typography>
                            <Button
                              onClick={() => handleRemoveArtist(artist.id)}
                              size="small"
                              sx={{
                                px: 1.5,
                                py: 0.5,
                                bgcolor: 'transparent',
                                border: `1px solid ${colors.border}`,
                                color: colors.textMuted,
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                textTransform: 'none',
                                borderRadius: '6px',
                                minWidth: 'auto',
                                '&:hover': { borderColor: colors.error, color: colors.error }
                              }}
                            >
                              Cancel Invite
                            </Button>
                          </>
                        ) : (
                          /* Artist requested to join - studio can verify/reject */
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button
                              onClick={() => handleVerifyArtist(artist.id)}
                              size="small"
                              sx={{
                                px: 1.5,
                                py: 0.5,
                                bgcolor: colors.success,
                                color: colors.background,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                borderRadius: '6px',
                                minWidth: 'auto',
                                '&:hover': { bgcolor: colors.success, opacity: 0.9 }
                              }}
                            >
                              Verify
                            </Button>
                            <Button
                              onClick={() => handleRemoveArtist(artist.id)}
                              size="small"
                              sx={{
                                px: 1.5,
                                py: 0.5,
                                bgcolor: 'transparent',
                                border: `1px solid ${colors.border}`,
                                color: colors.textMuted,
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                textTransform: 'none',
                                borderRadius: '6px',
                                minWidth: 'auto',
                                '&:hover': { borderColor: colors.error, color: colors.error }
                              }}
                            >
                              Reject
                            </Button>
                          </Box>
                        )}
                      </Box>
                    );
                  })}

                  {/* Add Artist Card */}
                  <Box
                    onClick={() => setAddArtistOpen(true)}
                    sx={{
                      minWidth: 140,
                      textAlign: 'center',
                      p: 2,
                      bgcolor: colors.background,
                      borderRadius: '12px',
                      border: `2px dashed ${colors.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&:hover': {
                        borderColor: colors.accent,
                        bgcolor: `${colors.accent}08`,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        bgcolor: `${colors.accent}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1,
                      }}
                    >
                      <PersonAddIcon sx={{ fontSize: 28, color: colors.accent }} />
                    </Box>
                    <Typography sx={{ fontWeight: 500, color: colors.textPrimary, fontSize: '0.85rem', mb: 0.25 }}>
                      Add Artist
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted }}>
                      By username or email
                    </Typography>
                  </Box>
                </Box>

                {/* Empty state message when no pending artists */}
                {studioArtists.filter(a => !a.is_verified && a.id !== user?.id).length === 0 && (
                  <Typography sx={{
                    color: colors.textMuted,
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    pb: 2,
                    mt: -1
                  }}>
                    No pending artist requests. Add artists to your studio using their username or email.
                  </Typography>
                )}
              </Card>
            )}

            {/* Your Saved Artists */}
            {activeTab === 'artist' && (
              <Card
                title="Your Saved Artists"
                action={<CardLink href="/artists">Browse More →</CardLink>}
                icon={<BookmarkIcon />}
              >
                {savedArtistsLoading ? (
                  <Box sx={{ display: 'flex', gap: 2, p: 2, overflowX: 'auto' }}>
                    {[1, 2, 3, 4].map((i) => (
                      <Box key={i} sx={{ minWidth: 120, textAlign: 'center' }}>
                        <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: colors.background, mx: 'auto', mb: 1 }} />
                        <Box sx={{ width: 80, height: 12, bgcolor: colors.background, mx: 'auto', mb: 0.5 }} />
                        <Box sx={{ width: 60, height: 10, bgcolor: colors.background, mx: 'auto' }} />
                      </Box>
                    ))}
                  </Box>
                ) : savedArtists.length > 0 ? (
                  <Box sx={{
                    display: 'flex',
                    gap: 2,
                    p: 2,
                    overflowX: 'auto',
                    '&::-webkit-scrollbar': { height: 6 },
                    '&::-webkit-scrollbar-track': { bgcolor: colors.background, borderRadius: 3 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: colors.border, borderRadius: 3 },
                  }}>
                    {savedArtists.map((artist) => (
                      <SavedArtistCard
                        key={artist.id}
                        artist={artist}
                        onRemove={removeFromWishlist}
                      />
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <BookmarkIcon sx={{ fontSize: 32, color: colors.textMuted, mb: 1 }} />
                    <Typography sx={{ color: colors.textMuted, fontSize: '0.9rem', mb: 0.5 }}>
                      No saved artists yet
                    </Typography>
                    <Typography sx={{ color: colors.textMuted, fontSize: '0.8rem', mb: 2 }}>
                      Save artists you love to keep track of their work
                    </Typography>
                    <Button
                      component={Link}
                      href="/artists"
                      sx={{
                        px: 2,
                        py: 0.75,
                        bgcolor: colors.accent,
                        color: colors.background,
                        borderRadius: '6px',
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        '&:hover': { bgcolor: colors.accentHover }
                      }}
                    >
                      Browse Artists
                    </Button>
                  </Box>
                )}
              </Card>
            )}
          </Box>

          {/* Side Column */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {activeTab === 'artist' ? (
              <>
                {/* Your Profile Card */}
                <Card title="Your Profile">
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                  }}>
                    <Box
                      sx={{ position: 'relative', cursor: 'pointer' }}
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <Avatar
                        src={typeof user?.image === 'string' ? user.image : user?.image?.uri}
                        sx={{
                          width: 64,
                          height: 64,
                          bgcolor: colors.accent,
                          color: colors.background,
                          fontSize: '1.25rem',
                          fontWeight: 600,
                        }}
                      >
                        {userInitials}
                      </Avatar>
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 24,
                          height: 24,
                          bgcolor: colors.surface,
                          border: `2px solid ${colors.accent}`,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isUploadingAvatar ? (
                          <CircularProgress size={12} sx={{ color: colors.accent }} />
                        ) : (
                          <CameraAltIcon sx={{ fontSize: 14, color: colors.accent }} />
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 600, color: colors.textPrimary }}>
                        {user?.name || user?.username}
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted }}>
                        @{user?.username}
                      </Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary, mt: 0.5 }}>
                        Click avatar to update photo
                      </Typography>
                    </Box>
                  </Box>

                  {/* Studio Affiliations */}
                  {user?.studios_affiliated && user.studios_affiliated.length > 0 && (
                    <>
                      <Divider sx={{ borderColor: colors.border }} />
                      <Box sx={{ p: 2 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted, mb: 1, fontWeight: 500 }}>
                          Your Studios
                        </Typography>
                        {user.studios_affiliated.map((studio) => (
                          <Box
                            key={studio.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              py: 1,
                              '&:not(:last-child)': { borderBottom: `1px solid ${colors.border}` },
                            }}
                          >
                            <Link
                              href={`/studios/${studio.slug}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                flex: 1,
                                minWidth: 0,
                                textDecoration: 'none',
                                color: 'inherit',
                              }}
                            >
                              <Avatar
                                src={studio.image?.uri}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: colors.accent,
                                  fontSize: '0.75rem',
                                }}
                              >
                                {studio.name?.charAt(0) || 'S'}
                              </Avatar>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{
                                  fontWeight: 500,
                                  color: colors.textPrimary,
                                  fontSize: '0.85rem',
                                  '&:hover': { color: colors.accent },
                                  transition: 'color 0.2s ease',
                                }}>
                                  {studio.name}
                                </Typography>
                              </Box>
                            </Link>
                            {studio.is_primary ? (
                              <Tooltip title="Primary studio" arrow>
                                <Box sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '8px',
                                  bgcolor: `${colors.accent}20`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}>
                                  <StarIcon sx={{ fontSize: 18, color: colors.accent }} />
                                </Box>
                              </Tooltip>
                            ) : user.studios_affiliated && user.studios_affiliated.length > 1 ? (
                              <Tooltip title="Set as primary" arrow>
                                <Box
                                  onClick={() => !settingPrimaryStudioId && handleSetPrimaryStudio(studio.id)}
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '8px',
                                    bgcolor: colors.surface,
                                    border: `1px solid ${colors.border}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      bgcolor: `${colors.accent}15`,
                                      borderColor: colors.accent,
                                    },
                                  }}
                                >
                                  {settingPrimaryStudioId === studio.id ? (
                                    <CircularProgress size={14} sx={{ color: colors.accent }} />
                                  ) : (
                                    <StarBorderIcon sx={{ fontSize: 18, color: colors.textMuted }} />
                                  )}
                                </Box>
                              </Tooltip>
                            ) : null}
                            <Tooltip title="Remove studio" arrow>
                              <Box
                                onClick={() => !leavingStudioId && handleLeaveStudio(studio.id)}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '8px',
                                  bgcolor: colors.surface,
                                  border: `1px solid ${colors.border}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    bgcolor: `${colors.error}15`,
                                    borderColor: colors.error,
                                    '& svg': { color: colors.error },
                                  },
                                }}
                              >
                                {leavingStudioId === studio.id ? (
                                  <CircularProgress size={14} sx={{ color: colors.textMuted }} />
                                ) : (
                                  <CloseIcon sx={{ fontSize: 18, color: colors.textMuted }} />
                                )}
                              </Box>
                            </Tooltip>
                          </Box>
                        ))}
                      </Box>
                    </>
                  )}
                </Card>

                {/* Security Settings */}
                <Card title="Security Settings">
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <LockIcon sx={{ color: colors.textMuted }} />
                      <Box>
                        <Typography sx={{ fontWeight: 500, color: colors.textPrimary }}>
                          Password
                        </Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                          Keep your account secure
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      onClick={() => setChangePasswordOpen(true)}
                      sx={{
                        px: 2,
                        py: 0.75,
                        color: colors.textPrimary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '6px',
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        '&:hover': { borderColor: colors.accent, color: colors.accent }
                      }}
                    >
                      Change Password
                    </Button>
                  </Box>
                </Card>

                {/* Recent Activity */}
                <Card
                  title="Recent Activity"
                  action={<CardLink href="/activity">View All →</CardLink>}
                >
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography sx={{ color: colors.textMuted, fontSize: '0.9rem' }}>
                      Activity feed coming soon
                    </Typography>
                  </Box>
                </Card>

                {/* Guest Spot Seeking */}
                <Card title="Guest Spot Settings" badge={<ComingSoonBadge size="small" />}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <FlightTakeoffIcon sx={{ color: artistSeekingSpots ? colors.success : colors.textMuted }} />
                      <Box>
                        <Typography sx={{ fontWeight: 500, color: colors.textPrimary }}>
                          Looking for Guest Spots
                        </Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                          Let studios know you're available for guest appearances
                        </Typography>
                      </Box>
                    </Box>
                    <Switch
                      checked={artistSeekingSpots}
                      onChange={() => setArtistSeekingSpots(!artistSeekingSpots)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: colors.success },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: colors.success },
                      }}
                    />
                  </Box>
                </Card>

                {/* Featured Tattoos */}
                <Card
                  title="Featured Tattoos"
                  subtitle="Select up to 6 tattoos to highlight on your profile"
                >
                  <Box sx={{ p: 2 }}>
                    {isLoadingTattoos ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                        <CircularProgress size={24} sx={{ color: colors.accent }} />
                      </Box>
                    ) : artistTattoos.length > 0 ? (
                      <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                        gap: 1,
                      }}>
                        {artistTattoos.slice(0, 12).map((tattoo) => {
                          const imageUrl = tattoo.primary_image?.uri || tattoo.images?.[0]?.uri;
                          const featuredCount = artistTattoos.filter(t => t.is_featured).length;
                          const canFeature = tattoo.is_featured || featuredCount < 6;
                          return (
                            <Box
                              key={tattoo.id}
                              onClick={() => canFeature && handleToggleFeatured(tattoo.id)}
                              sx={{
                                position: 'relative',
                                aspectRatio: '1',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                cursor: canFeature ? 'pointer' : 'not-allowed',
                                opacity: canFeature ? 1 : 0.5,
                                border: tattoo.is_featured ? `2px solid ${colors.accent}` : `2px solid transparent`,
                                transition: 'border-color 0.2s',
                                '&:hover': canFeature ? { borderColor: colors.accent } : {},
                              }}
                            >
                              {imageUrl ? (
                                <Box
                                  component="img"
                                  src={imageUrl}
                                  alt={tattoo.description || 'Tattoo'}
                                  sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                  }}
                                />
                              ) : (
                                <Box sx={{
                                  width: '100%',
                                  height: '100%',
                                  bgcolor: colors.background,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}>
                                  <Typography sx={{ fontSize: '0.7rem', color: colors.textMuted }}>
                                    No image
                                  </Typography>
                                </Box>
                              )}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 4,
                                  right: 4,
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  bgcolor: tattoo.is_featured ? colors.accent : 'rgba(0,0,0,0.5)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {tattoo.is_featured ? (
                                  <StarIcon sx={{ fontSize: 14, color: colors.background }} />
                                ) : (
                                  <StarBorderIcon sx={{ fontSize: 14, color: '#fff' }} />
                                )}
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted, mb: 1 }}>
                          No tattoos uploaded yet
                        </Typography>
                        <Button
                          onClick={() => setUploadTattooOpen(true)}
                          sx={{
                            px: 2,
                            py: 0.75,
                            bgcolor: colors.accent,
                            color: colors.background,
                            borderRadius: '6px',
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.85rem',
                            '&:hover': { bgcolor: colors.accentHover },
                          }}
                          startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                        >
                          Upload Tattoo
                        </Button>
                      </Box>
                    )}
                    {artistTattoos.length > 0 && (
                      <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                          {artistTattoos.filter(t => t.is_featured).length}/6 featured
                        </Typography>
                        {artistTattoos.length > 12 && (
                          <CardLink href="/profile">View all tattoos →</CardLink>
                        )}
                      </Box>
                    )}
                  </Box>
                </Card>
              </>
            ) : (
              <>
                {/* Contact Information Card - Inline Editing */}
                <Card
                  title="Contact Information"
                  action={
                    !isEditingContact ? (
                      <Button
                        onClick={() => setIsEditingContact(true)}
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          color: colors.accent,
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          textTransform: 'none',
                          '&:hover': { bgcolor: `${colors.accent}15` }
                        }}
                        startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                      >
                        Edit
                      </Button>
                    ) : null
                  }
                >
                  <Box sx={{ p: 2 }}>
                    {isEditingContact ? (
                      // Editing Mode
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                          label="Street Address"
                          value={contactForm.address}
                          onChange={(e) => setContactForm(prev => ({ ...prev, address: e.target.value }))}
                          fullWidth
                          size="small"
                          placeholder="123 Main Street"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              bgcolor: colors.background,
                              color: colors.textPrimary,
                              '& fieldset': { borderColor: colors.border },
                              '&:hover fieldset': { borderColor: colors.borderLight },
                              '&.Mui-focused fieldset': { borderColor: colors.accent },
                            },
                            '& .MuiInputLabel-root': { color: colors.textSecondary },
                            '& .MuiInputLabel-root.Mui-focused': { color: colors.accent },
                          }}
                        />
                        <TextField
                          label="Address Line 2 (optional)"
                          value={contactForm.address2}
                          onChange={(e) => setContactForm(prev => ({ ...prev, address2: e.target.value }))}
                          fullWidth
                          size="small"
                          placeholder="Suite 100"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              bgcolor: colors.background,
                              color: colors.textPrimary,
                              '& fieldset': { borderColor: colors.border },
                              '&:hover fieldset': { borderColor: colors.borderLight },
                              '&.Mui-focused fieldset': { borderColor: colors.accent },
                            },
                            '& .MuiInputLabel-root': { color: colors.textSecondary },
                            '& .MuiInputLabel-root.Mui-focused': { color: colors.accent },
                          }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            label="City"
                            value={contactForm.city}
                            onChange={(e) => setContactForm(prev => ({ ...prev, city: e.target.value }))}
                            fullWidth
                            size="small"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                bgcolor: colors.background,
                                color: colors.textPrimary,
                                '& fieldset': { borderColor: colors.border },
                                '&:hover fieldset': { borderColor: colors.borderLight },
                                '&.Mui-focused fieldset': { borderColor: colors.accent },
                              },
                              '& .MuiInputLabel-root': { color: colors.textSecondary },
                              '& .MuiInputLabel-root.Mui-focused': { color: colors.accent },
                            }}
                          />
                          <TextField
                            label="State"
                            value={contactForm.state}
                            onChange={(e) => setContactForm(prev => ({ ...prev, state: e.target.value }))}
                            size="small"
                            placeholder="TX"
                            sx={{
                              width: { xs: 70, sm: 100 },
                              '& .MuiOutlinedInput-root': {
                                bgcolor: colors.background,
                                color: colors.textPrimary,
                                '& fieldset': { borderColor: colors.border },
                                '&:hover fieldset': { borderColor: colors.borderLight },
                                '&.Mui-focused fieldset': { borderColor: colors.accent },
                              },
                              '& .MuiInputLabel-root': { color: colors.textSecondary },
                              '& .MuiInputLabel-root.Mui-focused': { color: colors.accent },
                            }}
                          />
                          <TextField
                            label="ZIP"
                            value={contactForm.postal_code}
                            onChange={(e) => setContactForm(prev => ({ ...prev, postal_code: e.target.value }))}
                            size="small"
                            sx={{
                              width: { xs: 80, sm: 100 },
                              '& .MuiOutlinedInput-root': {
                                bgcolor: colors.background,
                                color: colors.textPrimary,
                                '& fieldset': { borderColor: colors.border },
                                '&:hover fieldset': { borderColor: colors.borderLight },
                                '&.Mui-focused fieldset': { borderColor: colors.accent },
                              },
                              '& .MuiInputLabel-root': { color: colors.textSecondary },
                              '& .MuiInputLabel-root.Mui-focused': { color: colors.accent },
                            }}
                          />
                        </Box>
                        <TextField
                          label="Phone"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                          fullWidth
                          size="small"
                          placeholder="(555) 555-5555"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              bgcolor: colors.background,
                              color: colors.textPrimary,
                              '& fieldset': { borderColor: colors.border },
                              '&:hover fieldset': { borderColor: colors.borderLight },
                              '&.Mui-focused fieldset': { borderColor: colors.accent },
                            },
                            '& .MuiInputLabel-root': { color: colors.textSecondary },
                            '& .MuiInputLabel-root.Mui-focused': { color: colors.accent },
                          }}
                        />
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button
                            onClick={handleCancelContactEdit}
                            sx={{
                              px: 2,
                              py: 0.75,
                              color: colors.textPrimary,
                              border: `1px solid ${colors.border}`,
                              borderRadius: '6px',
                              textTransform: 'none',
                              fontWeight: 500,
                              fontSize: '0.85rem',
                              '&:hover': { borderColor: colors.accent, color: colors.accent }
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveContactInfo}
                            disabled={isSavingContact}
                            sx={{
                              px: 2,
                              py: 0.75,
                              bgcolor: colors.accent,
                              color: colors.background,
                              borderRadius: '6px',
                              textTransform: 'none',
                              fontWeight: 500,
                              fontSize: '0.85rem',
                              '&:hover': { bgcolor: colors.accentHover },
                              '&:disabled': { bgcolor: colors.border, color: colors.textMuted },
                            }}
                            startIcon={isSavingContact ? <CircularProgress size={16} sx={{ color: colors.textMuted }} /> : null}
                          >
                            {isSavingContact ? 'Saving...' : 'Save'}
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      // Display Mode
                      <>
                        {/* Address */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                          <LocationOnIcon sx={{ color: colors.accent, fontSize: 20, mt: 0.25 }} />
                          <Box>
                            <Typography sx={{ fontWeight: 500, color: colors.textPrimary, fontSize: '0.9rem', mb: 0.25 }}>
                              Address
                            </Typography>
                            {(studioData?.address || studioData?.city) ? (
                              <>
                                {studioData?.address && (
                                  <Typography sx={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
                                    {studioData.address}
                                  </Typography>
                                )}
                                {studioData?.address2 && (
                                  <Typography sx={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
                                    {studioData.address2}
                                  </Typography>
                                )}
                                {(studioData?.city || studioData?.state || studioData?.postal_code) && (
                                  <Typography sx={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
                                    {[studioData?.city, studioData?.state].filter(Boolean).join(', ')} {studioData?.postal_code}
                                  </Typography>
                                )}
                              </>
                            ) : (
                              <Typography sx={{ color: colors.textMuted, fontSize: '0.85rem', fontStyle: 'italic' }}>
                                No address set — click Edit to add
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        {/* Phone */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                          <PhoneIcon sx={{ color: colors.accent, fontSize: 20, mt: 0.25 }} />
                          <Box>
                            <Typography sx={{ fontWeight: 500, color: colors.textPrimary, fontSize: '0.9rem', mb: 0.25 }}>
                              Phone
                            </Typography>
                            {studioData?.phone ? (
                              <Typography sx={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
                                {studioData.phone}
                              </Typography>
                            ) : (
                              <Typography sx={{ color: colors.textMuted, fontSize: '0.85rem', fontStyle: 'italic' }}>
                                No phone number set — click Edit to add
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </>
                    )}
                  </Box>
                </Card>

                {/* Business Hours Card */}
                <Card
                  title="Business Hours"
                  action={
                    <Button
                      onClick={() => setWorkingHoursOpen(true)}
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        color: colors.accent,
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        textTransform: 'none',
                        '&:hover': { bgcolor: `${colors.accent}15` }
                      }}
                      startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                    >
                      Edit
                    </Button>
                  }
                >
                  <Box sx={{ p: 2 }}>
                    {studioWorkingHours && studioWorkingHours.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, dayIndex) => {
                          const dayHours = studioWorkingHours.find(h => h.day_of_week === dayIndex);
                          const isClosed = !dayHours || dayHours.is_day_off;
                          const formatTime = (time: string) => {
                            const [hours, minutes] = time.split(':');
                            const h = parseInt(hours);
                            const ampm = h >= 12 ? 'PM' : 'AM';
                            const displayHour = h % 12 || 12;
                            return `${displayHour}:${minutes} ${ampm}`;
                          };
                          const hoursDisplay = isClosed ? 'Closed' : `${formatTime(dayHours.start_time)} - ${formatTime(dayHours.end_time)}`;
                          return (
                            <Box key={dayName} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography sx={{ color: colors.textSecondary, fontSize: '0.85rem', minWidth: 100 }}>
                                {dayName}
                              </Typography>
                              <Typography sx={{
                                color: isClosed ? colors.textMuted : colors.textPrimary,
                                fontSize: '0.85rem',
                                fontWeight: isClosed ? 400 : 500,
                              }}>
                                {hoursDisplay}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    ) : (
                      <Typography sx={{ color: colors.textMuted, fontSize: '0.85rem', fontStyle: 'italic' }}>
                        No hours set — click Edit to add your business hours
                      </Typography>
                    )}
                  </Box>
                </Card>

                {/* Guest Spot Seeking Toggle */}
                <Card title="Guest Spot Settings" badge={<ComingSoonBadge size="small" />}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    borderBottom: seekingGuests ? `1px solid ${colors.border}` : 'none',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <FlightTakeoffIcon sx={{ color: seekingGuests ? colors.success : colors.textMuted }} />
                      <Box>
                        <Typography sx={{ fontWeight: 500, color: colors.textPrimary }}>
                          Seeking Guest Artists
                        </Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                          Show on your profile that you're looking for guest artists
                        </Typography>
                      </Box>
                    </Box>
                    <Switch
                      checked={seekingGuests}
                      onChange={handleToggleSeekingGuests}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: colors.success },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: colors.success },
                      }}
                    />
                  </Box>

                  {/* Guest Spot Details - only show when seeking */}
                  {seekingGuests && (
                    <Box sx={{ p: 2 }}>
                      <Typography sx={{
                        fontWeight: 500,
                        color: colors.textPrimary,
                        fontSize: '0.9rem',
                        mb: 1
                      }}>
                        Message for Guest Artists
                      </Typography>
                      <Typography sx={{
                        fontSize: '0.8rem',
                        color: colors.textMuted,
                        mb: 1.5
                      }}>
                        Add details about availability, styles you're looking for, or requirements
                      </Typography>
                      <TextField
                        placeholder="e.g., Looking for artists for January residency."
                        value={guestSpotDetails}
                        onChange={(e) => setGuestSpotDetails(e.target.value)}
                        fullWidth
                        multiline
                        rows={3}
                        size="small"
                        sx={{
                          mb: 1.5,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: colors.background,
                            color: colors.textPrimary,
                            fontSize: '0.9rem',
                            '& fieldset': { borderColor: colors.border },
                            '&:hover fieldset': { borderColor: colors.borderLight },
                            '&.Mui-focused fieldset': { borderColor: colors.accent },
                          },
                        }}
                      />
                      <Button
                        onClick={handleSaveGuestSpotDetails}
                        disabled={isSavingGuestDetails}
                        sx={{
                          px: 2,
                          py: 0.75,
                          bgcolor: colors.accent,
                          color: colors.background,
                          borderRadius: '6px',
                          textTransform: 'none',
                          fontWeight: 500,
                          fontSize: '0.85rem',
                          '&:hover': { bgcolor: colors.accentHover },
                          '&:disabled': { bgcolor: colors.border, color: colors.textMuted },
                        }}
                        startIcon={isSavingGuestDetails ? (
                          <CircularProgress size={16} sx={{ color: colors.textMuted }} />
                        ) : null}
                      >
                        {isSavingGuestDetails ? 'Saving...' : 'Save Details'}
                      </Button>
                    </Box>
                  )}
                </Card>


                {/* Studio Artists */}
                <Card
                  title="Studio Artists"
                  action={
                    <Button
                      onClick={() => setAddArtistOpen(true)}
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        bgcolor: `${colors.accent}26`,
                        border: `1px solid ${colors.accent}4D`,
                        borderRadius: '6px',
                        color: colors.accent,
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        textTransform: 'none',
                        '&:hover': { bgcolor: colors.accent, color: colors.background }
                      }}
                      startIcon={<PersonAddIcon sx={{ fontSize: 16 }} />}
                    >
                      Add Artist
                    </Button>
                  }
                >
                  <Box>
                    {/* Owner (current user) */}
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 2,
                      borderBottom: studioArtists.length > 0 ? `1px solid ${colors.border}` : 'none',
                    }}>
                      <Avatar
                        src={typeof user?.image === 'string' ? user.image : user?.image?.uri}
                        sx={{
                          width: 44,
                          height: 44,
                          bgcolor: colors.accent,
                          color: colors.background,
                          fontSize: '0.9rem',
                          fontWeight: 600
                        }}
                      >
                        {userInitials}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 500, color: colors.textPrimary }}>
                          {user?.name || 'You'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                          Owner
                        </Typography>
                      </Box>
                    </Box>

                    {/* Other studio artists */}
                    {studioArtists.filter(a => a.id !== user?.id).map((artist, index, arr) => {
                      const artistInitials = artist.name
                        ? artist.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                        : artist.username?.slice(0, 2).toUpperCase() || 'AR';
                      const isVerified = artist.is_verified;
                      return (
                        <Box key={artist.id} sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 2,
                          borderBottom: index === arr.length - 1 ? 'none' : `1px solid ${colors.border}`,
                          bgcolor: !isVerified ? `${colors.accent}08` : 'transparent',
                        }}>
                          <Avatar
                            src={artist.image?.uri}
                            sx={{
                              width: 44,
                              height: 44,
                              bgcolor: colors.background,
                              color: colors.textSecondary,
                              fontSize: '0.9rem',
                              fontWeight: 600
                            }}
                          >
                            {artistInitials}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography sx={{ fontWeight: 500, color: colors.textPrimary }}>
                                {artist.name || artist.username}
                              </Typography>
                              {isVerified && (
                                <CheckCircleIcon sx={{ fontSize: 16, color: colors.success }} />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                                @{artist.username}
                              </Typography>
                              {!isVerified && (
                                <Box sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  px: 0.75,
                                  py: 0.25,
                                  bgcolor: `${colors.accent}20`,
                                  borderRadius: '4px',
                                }}>
                                  <HourglassEmptyIcon sx={{ fontSize: 12, color: colors.accent }} />
                                  <Typography sx={{ fontSize: '0.7rem', color: colors.accent, fontWeight: 500 }}>
                                    Pending
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                          {/* Verify/Unverify button - only show Verify if artist requested to join (not studio invite) */}
                          {!isVerified && artist.initiated_by !== 'studio' && (
                            <Button
                              onClick={() => handleVerifyArtist(artist.id)}
                              size="small"
                              sx={{
                                px: 1.5,
                                py: 0.5,
                                bgcolor: colors.success,
                                color: colors.background,
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                textTransform: 'none',
                                borderRadius: '6px',
                                minWidth: 'auto',
                                '&:hover': { bgcolor: colors.success, opacity: 0.9 }
                              }}
                            >
                              Verify
                            </Button>
                          )}
                          {isVerified && (
                            <Button
                              onClick={() => handleUnverifyArtist(artist.id)}
                              size="small"
                              sx={{
                                px: 1.5,
                                py: 0.5,
                                bgcolor: 'transparent',
                                border: `1px solid ${colors.border}`,
                                color: colors.textMuted,
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                textTransform: 'none',
                                borderRadius: '6px',
                                minWidth: 'auto',
                                '&:hover': { borderColor: colors.textMuted }
                              }}
                            >
                              Unverify
                            </Button>
                          )}
                          <IconButton
                            onClick={() => handleRemoveArtist(artist.id)}
                            sx={{
                              color: colors.textMuted,
                              '&:hover': { color: colors.error, bgcolor: `${colors.error}15` }
                            }}
                            size="small"
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                      );
                    })}

                    {studioArtists.filter(a => a.id !== user?.id).length === 0 && (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted }}>
                          No other artists yet. Add artists by their username.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Card>

                {/* Announcements */}
                <Card title="Announcements">
                  <Box>
                    {/* Add new announcement form */}
                    <Box sx={{ p: 2, borderBottom: announcements.length > 0 ? `1px solid ${colors.border}` : 'none' }}>
                      <TextField
                        placeholder="Announcement title"
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                        fullWidth
                        size="small"
                        sx={{
                          mb: 1,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: colors.background,
                            color: colors.textPrimary,
                            '& fieldset': { borderColor: colors.border },
                            '&:hover fieldset': { borderColor: colors.borderLight },
                            '&.Mui-focused fieldset': { borderColor: colors.accent },
                          },
                        }}
                      />
                      <TextField
                        placeholder="What would you like to announce?"
                        value={newAnnouncement.content}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        sx={{
                          mb: 1,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: colors.background,
                            color: colors.textPrimary,
                            '& fieldset': { borderColor: colors.border },
                            '&:hover fieldset': { borderColor: colors.borderLight },
                            '&.Mui-focused fieldset': { borderColor: colors.accent },
                          },
                        }}
                      />
                      <Button
                        onClick={handleAddAnnouncement}
                        disabled={isAddingAnnouncement || !newAnnouncement.title || !newAnnouncement.content}
                        sx={{
                          px: 2,
                          py: 0.75,
                          bgcolor: colors.accent,
                          color: colors.background,
                          borderRadius: '6px',
                          textTransform: 'none',
                          fontWeight: 500,
                          fontSize: '0.85rem',
                          '&:hover': { bgcolor: colors.accentHover },
                          '&:disabled': { bgcolor: colors.border, color: colors.textMuted },
                        }}
                        startIcon={isAddingAnnouncement ? <CircularProgress size={16} sx={{ color: colors.textMuted }} /> : <CampaignIcon sx={{ fontSize: 18 }} />}
                      >
                        Post Announcement
                      </Button>
                    </Box>

                    {/* Existing announcements */}
                    {announcements.map((announcement, index) => (
                      <Box key={announcement.id} sx={{
                        p: 2,
                        borderBottom: index === announcements.length - 1 ? 'none' : `1px solid ${colors.border}`,
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                          <Typography sx={{ fontWeight: 600, color: colors.textPrimary }}>
                            {announcement.title}
                          </Typography>
                          <IconButton
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            sx={{
                              color: colors.textMuted,
                              p: 0.5,
                              '&:hover': { color: colors.error }
                            }}
                            size="small"
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                        <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary, mb: 0.5 }}>
                          {announcement.content}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted }}>
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    ))}

                    {announcements.length === 0 && (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted }}>
                          No announcements yet. Create one to display on your studio page.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Card>

                {/* Security Settings */}
                <Card title="Security Settings">
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <LockIcon sx={{ color: colors.textMuted }} />
                      <Box>
                        <Typography sx={{ fontWeight: 500, color: colors.textPrimary }}>
                          Password
                        </Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                          Keep your account secure
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      onClick={() => setChangePasswordOpen(true)}
                      sx={{
                        px: 2,
                        py: 0.75,
                        color: colors.textPrimary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '6px',
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        '&:hover': { borderColor: colors.accent, color: colors.accent }
                      }}
                    >
                      Change Password
                    </Button>
                  </Box>
                </Card>
              </>
            )}
          </Box>
        </Box>

        {/* Guest Spot Opportunities - Artist Tab Only */}
        {activeTab === 'artist' && (
        <Box sx={{ mt: 3 }}>
          <Card
            title="Guest Spot Opportunities"
            subtitle="Studios in your saved travel regions that viewed your profile"
            badge={<ComingSoonBadge size="small" />}
            action={<CardLink href="/travel-regions">Manage Travel Regions →</CardLink>}
          >
            <Box>
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography sx={{ color: colors.textMuted, fontSize: '0.9rem' }}>
                  Set your travel preferences to see opportunities
                </Typography>
              </Box>

              {/* Add Region CTA */}
              <Box sx={{
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                p: 2,
                bgcolor: colors.background,
                borderTop: `1px solid ${colors.border}`
              }}>
                <Box sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: `2px solid ${colors.accent}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.accent,
                  flexShrink: 0
                }}>
                  <AddIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: colors.textPrimary }}>
                    Add more travel destinations
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                    Get notified when studios in your target regions view your profile
                  </Typography>
                </Box>
                <Button sx={{
                  px: 2,
                  py: 0.75,
                  color: colors.textPrimary,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  width: { xs: '100%', sm: 'auto' },
                  '&:hover': { borderColor: colors.accent, color: colors.accent }
                }}>
                  Add Regions
                </Button>
              </Box>
            </Box>
          </Card>
        </Box>
        )}
      </Box>

      {/* Modals */}
      <EditStudioModal
        isOpen={editStudioOpen}
        onClose={() => setEditStudioOpen(false)}
        studio={studioData || ownedStudio}
        onSave={(updatedStudio) => {
          setStudioData(updatedStudio);
          refreshUser();
        }}
      />

      <WorkingHoursModal
        isOpen={workingHoursOpen}
        onClose={() => setWorkingHoursOpen(false)}
        onSave={handleSaveBusinessHours}
        studioId={ownedStudio?.id}
        title="Business Hours"
        infoText="Set your studio's business hours. Clients will see these on your profile."
        initialWorkingHours={studioWorkingHours}
      />

      <AddArtistModal
        isOpen={addArtistOpen}
        onClose={() => setAddArtistOpen(false)}
        studioId={ownedStudio?.id || 0}
        onArtistAdded={(artist) => {
          // Add with is_verified: false and initiated_by: 'studio' so they appear as pending invite
          setStudioArtists(prev => [...prev, { ...artist, is_verified: false, initiated_by: 'studio' }]);
        }}
        currentArtists={studioArtists}
      />

      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

      {/* Upload Tattoo Wizard */}
      <TattooCreateWizard
        open={uploadTattooOpen}
        onClose={() => setUploadTattooOpen(false)}
        onSuccess={(newTattoo) => {
          setUploadTattooOpen(false);
          // Navigate to portfolio page to show the new tattoo
          if (user?.slug) {
            router.push(`/artists/${user.slug}`);
          }
        }}
      />

      {/* Lead Detail Modal */}
      <Dialog
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: colors.surface,
            border: `1px solid ${colors.accent}50`,
            borderRadius: '16px',
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 80px ${colors.accent}30`,
          }
        }}
      >
        {selectedLead && (
          <>
            <DialogTitle sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${colors.border}`,
              pb: 2,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={typeof selectedLead.user.image === 'string' ? selectedLead.user.image : selectedLead.user.image?.uri}
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: colors.accent,
                    color: colors.background,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                  }}
                >
                  {selectedLead.user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '1.1rem', color: colors.textPrimary }}>
                    {selectedLead.user.name || selectedLead.user.username}
                  </Typography>
                  {selectedLead.user.location && (
                    <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted }}>
                      {selectedLead.user.location}
                    </Typography>
                  )}
                </Box>
              </Box>
              <IconButton onClick={() => setSelectedLead(null)} sx={{ color: colors.textMuted }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              {/* Timeline */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ScheduleIcon sx={{ color: colors.accent, fontSize: 20 }} />
                  <Typography sx={{ fontWeight: 600, color: colors.textPrimary }}>
                    Timeline
                  </Typography>
                </Box>
                <Box sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: `${colors.accent}15`,
                  borderRadius: '8px',
                  border: `1px solid ${colors.accent}30`,
                }}>
                  <Typography sx={{ color: colors.textPrimary, fontWeight: 500 }}>
                    {selectedLead.timing_label}
                  </Typography>
                </Box>
              </Box>

              {/* What they're looking for */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LocalOfferIcon sx={{ color: colors.accent, fontSize: 20 }} />
                  <Typography sx={{ fontWeight: 600, color: colors.textPrimary }}>
                    What they're looking for
                  </Typography>
                </Box>
                <Box sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: colors.background,
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                }}>
                  {selectedLead.description ? (
                    <Typography sx={{ color: colors.textPrimary, mb: selectedLead.custom_themes?.length ? 1.5 : 0 }}>
                      {selectedLead.description}
                    </Typography>
                  ) : null}
                  {selectedLead.custom_themes && selectedLead.custom_themes.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {selectedLead.custom_themes.map((theme, idx) => (
                        <Box key={idx} sx={{
                          px: 1.5,
                          py: 0.5,
                          bgcolor: `${colors.accent}20`,
                          borderRadius: '100px',
                          fontSize: '0.8rem',
                          color: colors.accent,
                          fontWeight: 500,
                        }}>
                          {theme}
                        </Box>
                      ))}
                    </Box>
                  )}
                  {!selectedLead.description && (!selectedLead.custom_themes || selectedLead.custom_themes.length === 0) && (
                    <Typography sx={{ color: colors.textMuted, fontStyle: 'italic' }}>
                      No specific details provided
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Email */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <EmailIcon sx={{ color: colors.accent, fontSize: 20 }} />
                  <Typography sx={{ fontWeight: 600, color: colors.textPrimary }}>
                    Contact
                  </Typography>
                </Box>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 2,
                  py: 1.5,
                  bgcolor: colors.background,
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                }}>
                  <Typography sx={{ color: colors.textPrimary }}>
                    {selectedLead.user.email}
                  </Typography>
                  <Button
                    href={`mailto:${selectedLead.user.email}`}
                    sx={{
                      px: 2,
                      py: 0.75,
                      bgcolor: colors.accent,
                      color: colors.background,
                      borderRadius: '6px',
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.85rem',
                      '&:hover': { bgcolor: colors.accentHover },
                    }}
                    startIcon={<EmailIcon sx={{ fontSize: 16 }} />}
                  >
                    Send Email
                  </Button>
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Hidden file input for avatar upload */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        style={{ display: 'none' }}
      />
    </Layout>
  );
}

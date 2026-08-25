import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Layout from '../components/Layout';
import {Box, Typography, Button, Avatar, Switch, IconButton, CircularProgress, Divider, Menu, MenuItem, ListItemIcon, ListItemText, Dialog, DialogContent, DialogTitle, Tooltip} from '@mui/material';
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
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CollectionsIcon from '@mui/icons-material/Collections';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import StarIcon from '@mui/icons-material/Star';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist, WishlistArtist } from '@/hooks/useClientDashboard';
import { colors } from '@/styles/colors';
import { studioService } from '@/services/studioService';
import { artistService } from '@/services/artistService';
import { leadService } from '@/services/leadService';
import { userService } from '@/services/userService';
import { messageService } from '@/services/messageService';
import { tattooService } from '@/services/tattooService';
import { StudioType } from '@/models/studio.interface';
import type { WorkingHour } from '../components/WorkingHoursModal';
import ComingSoonBadge from '../components/ui/ComingSoonBadge';

import { useProfilePhoto } from '@/hooks';

// Lazy load heavy modals - only loaded when needed
const WorkingHoursModal = dynamic(() => import('../components/WorkingHoursModal'), { ssr: false });
const AddArtistModal = dynamic(() => import('../components/AddArtistModal'), { ssr: false });
const SpotlightModal = dynamic(() => import('../components/SpotlightModal'), { ssr: false });

import StudioArtistsCard from '../components/dashboard/StudioArtistsCard';
import StudioSideColumn from '../components/dashboard/StudioSideColumn';
import { useStudioDashboard } from '../hooks/useStudioDashboard';
const ClientDashboardContent = dynamic(() => import('../components/ClientDashboardContent'), { ssr: false });
const ChangePasswordModal = dynamic(() => import('../components/ChangePasswordModal'), { ssr: false });
const TattooCreateWizard = dynamic(() => import('../components/TattooCreateWizard'), { ssr: false });
const StudioInvitations = dynamic(() => import('../components/StudioInvitations'), { ssr: false });
const ImageCropperModal = dynamic(() => import('../components/ImageCropperModal'), { ssr: false });
const ClientsTabContent = dynamic(() => import('../components/clients/ClientsTabContent'), { ssr: false });

// Dashboard components
import {
  Card,
  CardLink,
  StatCard,
  DashboardTab,
  ActivityItem,
  SavedArtistCard,
  LeadCard,
  PendingApprovalsDialog,
  usePendingApprovalsCount,
} from '../components/dashboard';

// Dashboard types
import type {
  DashboardStats,
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
  const [addArtistOpen, setAddArtistOpen] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [uploadTattooOpen, setUploadTattooOpen] = useState(false);
  const [uploadMenuAnchor, setUploadMenuAnchor] = useState<null | HTMLElement>(null);
  const [workingHoursOpen, setWorkingHoursOpen] = useState(false);

  // Studio management state and actions live in useStudioDashboard so this
  // page does not grow with the studio surface.

  // Artist data states
  const [artistSeekingSpots, setArtistSeekingSpots] = useState(false);
  const {
    loading: isUploadingAvatar,
    cropperImage,
    isCropperOpen,
    takeProfilePhoto,
    handleCropComplete,
    handleCropCancel,
  } = useProfilePhoto({ onSuccess: refreshUser });
  const [artistTattoos, setArtistTattoos] = useState<Tattoo[]>([]);
  const [isLoadingTattoos, setIsLoadingTattoos] = useState(false);

  // Leads for artists to reach out to
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Dashboard stats (fetched from API)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(defaultStats);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Pending approvals
  const { count: pendingApprovalsCount } = usePendingApprovalsCount();
  const [pendingApprovalsOpen, setPendingApprovalsOpen] = useState(false);

  // Saved artists (wishlist)
  const { wishlist: savedArtists, loading: savedArtistsLoading, removeFromWishlist } = useWishlist();


  const userName = user?.name?.split(' ')[0] || user?.username || '';
  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() || 'U';
  // Studio management is owner-only. user.studio is the artist's primary
  // studio, which they can work at without owning, so it must not unlock the
  // studio tab or any of the studio write endpoints behind it.
  const ownedStudio = user?.owned_studio;

  const studioInitials = ownedStudio?.name
    ? ownedStudio.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'ST';
  // type_id: 1 = client/enthusiast, 2 = artist, 3 = studio
  const isClient = user?.type_id === 1 || user?.type_id === '1' || user?.type === 'client';
  const isArtist = user?.type_id === 2 || user?.type_id === '2' || user?.type === 'artist';
  const isStudioAccount = user?.type_id === 3 || user?.type_id === '3' || user?.type === 'studio';
  const hasStudio = !!ownedStudio || isStudioAccount;

  const studio = useStudioDashboard(ownedStudio?.id);
  const {
    studioData,
    setStudioData,
    studioArtists,
    setStudioArtists,
    studioStats,
    studioWorkingHours,
    loadStudioData,
    handleSaveBusinessHours,
    handleVerifyArtist,
    handleRemoveArtist,
  } = studio;

  // Get the correct avatar URL - for studio accounts, use studio image; otherwise user image
  const getUserAvatarUrl = () => {
    const studioImg = isStudioAccount ? (ownedStudio?.image || studioData?.image) : null;
    const userImg = user?.image;
    const img = studioImg || userImg;
    if (!img) return undefined;
    return typeof img === 'string' ? img : img?.uri;
  };
  const userAvatarUrl = getUserAvatarUrl();

  // Set default tab to 'studio' only for pure studio accounts
  useEffect(() => {
    if (isStudioAccount) {
      setActiveTab('studio');
    }
  }, [isStudioAccount]);

  // Handle pending studio data from registration (create studio or link image)
  useEffect(() => {
    const processPendingStudioData = async () => {
      if (!isStudioAccount || !user?.id) return;

      const pendingDataStr = localStorage.getItem('pendingStudioData');
      if (!pendingDataStr) return;

      // IMMEDIATELY clear pending data to prevent duplicate processing
      localStorage.removeItem('pendingStudioData');

      try {
        const pendingData = JSON.parse(pendingDataStr);

        if (ownedStudio) {
          // Studio already exists (created by AuthController during registration).
          // Just link the uploaded image if we have one.
          if (ownedStudio.id && pendingData.uploadedImageId) {
            await studioService.uploadImage(ownedStudio.id, pendingData.uploadedImageId);
            await refreshUser();
          }
        } else {
          // Studio doesn't exist yet — create or claim it with image_id included
          const generateSlug = (text: string) => {
            return text.toLowerCase()
              .replace(/[^a-z0-9]/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');
          };

          const studioPayload: Record<string, unknown> = {
            name: pendingData.name || '',
            slug: generateSlug(pendingData.username || pendingData.name || ''),
            about: pendingData.bio || '',
            location: pendingData.location || '',
            location_lat_long: pendingData.locationLatLong || '',
            owner_id: user.id,
            email: pendingData.email || undefined,
            phone: pendingData.phone || undefined,
          };

          if (pendingData.uploadedImageId) {
            studioPayload.image_id = pendingData.uploadedImageId;
          }

          if (pendingData.existingStudioId) {
            await studioService.claim(pendingData.existingStudioId, studioPayload);
          } else {
            await studioService.create(studioPayload);
          }

          await refreshUser();
        }
      } catch (err) {
        console.error('Failed to process pending studio data:', err);
        localStorage.setItem('pendingStudioData', pendingDataStr);
      }
    };

    processPendingStudioData();
  }, [isStudioAccount, ownedStudio, user?.id, refreshUser]);

  // Load studio data when tab switches to studio (or on mount for studio accounts)
  useEffect(() => {
    if (hasStudio && activeTab === 'studio' && ownedStudio?.id) {
      loadStudioData();
    }
  }, [activeTab, hasStudio, ownedStudio?.id]);

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

  // Load artist dashboard data (stats, schedule, tattoos) - single API call with caching
  useEffect(() => {
    const loadArtistDashboard = async () => {
      if (!user?.id || !isArtist) return;

      setIsLoadingStats(true);
      setIsLoadingTattoos(true);
      try {
        // Single API call for all artist dashboard data (tattoos are cached on backend)
        const response = await artistService.getDashboard(user.id);
        const data = response?.data || response;

        // Set stats
        if (data.stats) {
          setDashboardStats({
            upcomingAppointments: data.stats.upcoming_appointments || 0,
            appointmentsTrend: data.stats.appointments_trend || '+0',
            profileViews: data.stats.profile_views || 0,
            viewsTrend: data.stats.views_trend || '+0%',
            savesThisWeek: data.stats.saves_this_week || 0,
            savesTrend: data.stats.saves_trend || '+0',
            unreadMessages: data.stats.unread_messages || 0
          });
        }

        // Set tattoos (cached on backend for 5 minutes)
        if (data.tattoos) {
          setArtistTattoos(Array.isArray(data.tattoos) ? data.tattoos : []);
        }
      } catch (err) {
        console.error('Failed to load artist dashboard:', err);
      } finally {
        setIsLoadingStats(false);
        setIsLoadingTattoos(false);
      }
    };

    if (user?.id && isArtist) {
      loadArtistDashboard();
    }
  }, [user?.id, isArtist]);

  // Refresh tattoos after upload (bypasses cache temporarily)
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

  // Render client dashboard for clients without a studio (type_id = 1)
  // Clients who own a studio should see the full dashboard with studio tab
  if (isClient && !hasStudio) {
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
              href={isStudioAccount || activeTab === 'studio'
                ? `/studios/${studioData?.slug || ownedStudio?.slug || user?.slug}`
                : `/artists/${user?.slug}`}
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
              {(isStudioAccount || activeTab === 'studio') ? 'View Studio Page' : 'View Public Profile'}
            </Button>
            {/* Upload button - only show for artists */}
            {isArtist && (
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
            <Button
              onClick={async () => {
                try {
                  const { conversation_id } = await messageService.sendSupportMessage();
                  if (conversation_id) {
                    router.push(`/inbox?conversation=${conversation_id}`);
                    return;
                  }
                } catch {}
                router.push('/contact');
              }}
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
              startIcon={<HelpOutlineIcon sx={{ fontSize: 18 }} />}
            >
              Get Help
            </Button>
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

        {/* Dashboard Tabs - for anyone with a studio or artists (for clients tab) */}
        {(hasStudio && !isStudioAccount || isArtist) && (
          <Box sx={{
            display: 'flex',
            gap: 3,
            mb: 3,
            borderBottom: `1px solid ${colors.border}`,
            pb: 0
          }}>
            <DashboardTab
              label={isArtist ? "My Artist Profile" : "My Dashboard"}
              initials={userInitials}
              imageUrl={userAvatarUrl}
              isActive={activeTab === 'artist'}
              onClick={() => setActiveTab('artist')}
              accentAvatar
            />
            {hasStudio && !isStudioAccount && (
              <DashboardTab
                label={ownedStudio?.name || 'My Studio'}
                initials={studioInitials}
                imageUrl={typeof (ownedStudio?.image || studioData?.image) === 'string' ? (ownedStudio?.image || studioData?.image) : (ownedStudio?.image?.uri || studioData?.image?.uri)}
                isActive={activeTab === 'studio'}
                onClick={() => setActiveTab('studio')}
              />
            )}
            {isArtist && (
              <Box
                onClick={() => setActiveTab('clients')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  pb: 1.5,
                  px: 0.5,
                  cursor: 'pointer',
                  borderBottom: activeTab === 'clients' ? `2px solid ${colors.accent}` : '2px solid transparent',
                  mb: '-1px',
                  minHeight: 32,
                  transition: 'border-color 0.2s',
                  '&:hover': { borderColor: activeTab === 'clients' ? colors.accent : colors.borderLight },
                }}
              >
                <Typography sx={{
                  fontSize: '0.95rem',
                  fontWeight: activeTab === 'clients' ? 600 : 500,
                  color: activeTab === 'clients' ? colors.textPrimary : colors.textSecondary,
                }}>
                  My Clients
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Studio Invitations - Only for artists viewing artist tab */}
        {isArtist && activeTab === 'artist' && (
          <StudioInvitations onInvitationAccepted={refreshUser} />
        )}

        {/* Clients Tab - CRM for artists */}
        {isArtist && activeTab === 'clients' && (
          <ClientsTabContent />
        )}

        {/* Client Dashboard Content - for clients on their dashboard tab */}
        {isClient && activeTab === 'artist' && (
          <ClientDashboardContent userName={userName} userId={user?.id || 0} />
        )}

        {/* Pending approvals banner */}
        {activeTab === 'artist' && pendingApprovalsCount > 0 && (
          <Box
            onClick={() => setPendingApprovalsOpen(true)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              mb: 2,
              bgcolor: `${colors.accent}15`,
              border: `1px solid ${colors.accent}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': { bgcolor: `${colors.accent}25` },
            }}
          >
            <Box sx={{
              width: 44,
              height: 44,
              bgcolor: colors.accent,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <CheckCircleIcon sx={{ color: colors.background, fontSize: 24 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: colors.textPrimary }}>
                {pendingApprovalsCount} tattoo{pendingApprovalsCount === 1 ? '' : 's'} waiting for your approval
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                A client tagged you as the artist. Review and claim your work.
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: colors.accent, flexShrink: 0 }}>
              Review &rarr;
            </Typography>
          </Box>
        )}

        {/* Stats Row - for artists or studio tab (not clients tab) */}
        {(isArtist || activeTab === 'studio') && activeTab !== 'clients' && (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: activeTab === 'artist' ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)' },
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
                href="/manage-calendar"
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
                href="/inbox"
              />
              <StatCard
                icon={<CheckCircleIcon />}
                value={pendingApprovalsCount}
                label="Approve Tags"
                trend={pendingApprovalsCount > 0 ? 'Action' : ''}
                trendUp={pendingApprovalsCount > 0}
                onClick={() => setPendingApprovalsOpen(true)}
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
                href="/calendar"
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
                href="/inbox"
              />
            </>
          )}
        </Box>
        )}

        {/* Main Grid - for artists or studio tab (not clients tab) */}
        {(isArtist || activeTab === 'studio') && activeTab !== 'clients' && (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 340px', lg: '1fr 380px' },
          gap: 2
        }}>
          {/* Main Column */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
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
              <StudioArtistsCard
                studioArtists={studioArtists}
                currentUserId={user?.id}
                onAddArtist={() => setAddArtistOpen(true)}
                onVerifyArtist={handleVerifyArtist}
                onRemoveArtist={handleRemoveArtist}
              />
            )}

            {/* My Saved Items */}
            {activeTab === 'artist' && (
              <Card
                title="My Saved Items"
                action={<CardLink href="/wishlist">View All →</CardLink>}
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
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
                      onClick={takeProfilePhoto}
                    >
                      <Avatar
                        src={userAvatarUrl}
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
              <StudioSideColumn
                studio={studio}
                currentUserId={user?.id}
                currentUserName={user?.name}
                userAvatarUrl={userAvatarUrl}
                userInitials={userInitials}
                onAddArtist={() => setAddArtistOpen(true)}
                onManageHours={() => setWorkingHoursOpen(true)}
                onManageSpotlight={() => setSpotlightOpen(true)}
                onEditStudio={() => {
                  const target = studioData?.slug || ownedStudio?.slug;
                  if (target) router.push(`/studios/${target}/edit`);
                }}
                onChangePassword={() => setChangePasswordOpen(true)}
                studioSlug={studioData?.slug || ownedStudio?.slug}
              />
            )}
          </Box>
        </Box>
        )}

        {/* Guest Spot Opportunities - Artist Tab Only */}
        {isArtist && activeTab === 'artist' && (
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

      <SpotlightModal
        isOpen={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        studioId={ownedStudio?.id || 0}
        studioSlug={studioData?.slug || ownedStudio?.slug}
        artists={studioArtists}
        onChanged={studio.loadSpotlights}
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

      {/* Image cropper modal for avatar upload */}
      {cropperImage && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          imageSrc={cropperImage}
          onClose={handleCropCancel}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Pending Approvals Dialog - opened from Approve Tags stat card */}
      <PendingApprovalsDialog
        open={pendingApprovalsOpen}
        onClose={() => setPendingApprovalsOpen(false)}
      />
    </Layout>
  );
}

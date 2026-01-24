import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import {Box, Typography, Button, Avatar, Switch, TextField, IconButton, CircularProgress, Divider, Menu, MenuItem, ListItemIcon, ListItemText, Dialog, DialogContent, DialogTitle} from '@mui/material';
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
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CampaignIcon from '@mui/icons-material/Campaign';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CollectionsIcon from '@mui/icons-material/Collections';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist, WishlistArtist } from '@/hooks/useClientDashboard';
import { colors } from '@/styles/colors';
import { api } from '@/utils/api';
import { StudioType } from '@/models/studio.interface';
import EditStudioModal from '../components/EditStudioModal';
import AddArtistModal from '../components/AddArtistModal';
import ClientDashboardContent from '../components/ClientDashboardContent';
import ChangePasswordModal from '../components/ChangePasswordModal';
import TattooCreateWizard from '../components/TattooCreateWizard';
import LockIcon from '@mui/icons-material/Lock';

// Types for dashboard data
interface DashboardStats {
  upcomingAppointments: number;
  appointmentsTrend: string;
  profileViews: number;
  viewsTrend: string;
  savesThisWeek: number;
  savesTrend: string;
  unreadMessages: number;
}

interface ScheduleItem {
  id: number;
  day: number;
  month: string;
  time: string;
  title: string;
  clientName: string;
  clientInitials: string;
  type: string;
}

interface ClientItem {
  id: number;
  name: string;
  initials: string;
  hint: string;
  hintType: string;
}

interface ActivityItem {
  id: number;
  user: string;
  action: string;
  target: string;
  time: string;
  type: string;
}

interface GuestSpotStudio {
  id: number;
  name: string;
  initials: string;
  location: string;
  viewedAgo: string;
  rating: number;
  reviews: number;
  styles: string[];
  seeking: boolean;
}

interface GuestSpotRegion {
  region: string;
  flag: string;
  studioCount: number;
  studios: GuestSpotStudio[];
}

// Default empty states
const defaultStats: DashboardStats = {
  upcomingAppointments: 0,
  appointmentsTrend: '+0',
  profileViews: 0,
  viewsTrend: '+0%',
  savesThisWeek: 0,
  savesTrend: '+0',
  unreadMessages: 0
};

type DashboardTab = 'artist' | 'studio';

interface StudioArtist {
  id: number;
  name: string;
  username: string;
  image?: { uri?: string };
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
}

interface Tattoo {
  id: number;
  description?: string;
  is_featured: boolean;
  primary_image?: { uri?: string };
  images?: { uri?: string }[];
}

interface LeadUser {
  id: number;
  name: string;
  username: string;
  email: string;
  image?: { uri?: string } | string;
  location?: string;
}

interface Lead {
  id: number;
  timing: string | null;
  timing_label: string;
  description?: string;
  custom_themes?: string[];
  user: LeadUser;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('artist');

  // Modal states
  const [editStudioOpen, setEditStudioOpen] = useState(false);
  const [addArtistOpen, setAddArtistOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [uploadTattooOpen, setUploadTattooOpen] = useState(false);
  const [uploadMenuAnchor, setUploadMenuAnchor] = useState<null | HTMLElement>(null);

  // Studio data states
  const [studioData, setStudioData] = useState<any>(null);
  const [studioArtists, setStudioArtists] = useState<StudioArtist[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [seekingGuests, setSeekingGuests] = useState(false);
  const [guestSpotDetails, setGuestSpotDetails] = useState('');
  const [isSavingGuestDetails, setIsSavingGuestDetails] = useState(false);

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
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
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
  const hasStudio = user?.is_studio_admin && ownedStudio;
  // type_id: 1 = client/enthusiast, 2 = artist, 3 = studio
  const isClient = user?.type_id === 1 || user?.type_id === '1' || user?.type === 'client';


  // Load studio data when tab switches to studio
  useEffect(() => {
    if (hasStudio && activeTab === 'studio' && ownedStudio?.id) {
      loadStudioData();
    }
  }, [activeTab, hasStudio, ownedStudio?.id]);

  // Load artist tattoos on mount
  useEffect(() => {
    if (user?.id) {
      loadArtistTattoos();
    }
  }, [user?.id]);

  // Load leads for artists
  useEffect(() => {
    const loadLeads = async () => {
      if (!user?.id || isClient) return;
      setIsLoadingLeads(true);
      try {
        const response = await api.get<{ leads: Lead[] }>('/leads/for-artists', { requiresAuth: true });
        setLeads(response.leads || []);
      } catch (err) {
        console.error('Failed to load leads:', err);
      } finally {
        setIsLoadingLeads(false);
      }
    };
    loadLeads();
  }, [user?.id, isClient]);

  // Load dashboard stats and schedule
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;

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
          api.get<DashboardStatsResponse>(`/artists/${user.id}/dashboard-stats`, { requiresAuth: true }).catch(() => null),
          api.get<any[]>(`/artists/${user.id}/upcoming-schedule`, { requiresAuth: true }).catch(() => null)
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

    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const loadArtistTattoos = async () => {
    if (!user?.slug) return;
    setIsLoadingTattoos(true);
    try {
      const response = await api.get(`/artists/${user.slug}`) as { artist?: { tattoos?: Tattoo[] } };
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
      const [studioRes, artistsRes, announcementsRes] = await Promise.all([
        api.get<StudioType | { studio: StudioType }>(`/studios/${ownedStudio.id}`),
        api.get<any[] | { artists: any[] }>(`/studios/${ownedStudio.id}/artists`),
        api.get<any[] | { announcements: any[] }>(`/studios/${ownedStudio.id}/announcements`),
      ]);
      const studio = (studioRes as any).studio || studioRes;
      setStudioData(studio);
      setStudioArtists((artistsRes as any).artists || artistsRes || []);
      setAnnouncements((announcementsRes as any).announcements || announcementsRes || []);
      setSeekingGuests(studio?.seeking_guest_artists || false);
      setGuestSpotDetails(studio?.guest_spot_details || '');
    } catch (err) {
      console.error('Failed to load studio data:', err);
    }
  };

  const handleToggleSeekingGuests = async () => {
    if (!ownedStudio?.id) return;
    const newValue = !seekingGuests;
    setSeekingGuests(newValue);
    try {
      await api.put(`/studios/studio/${ownedStudio.id}`, { seeking_guest_artists: newValue });
    } catch (err) {
      setSeekingGuests(!newValue); // Revert on error
      console.error('Failed to update seeking status:', err);
    }
  };

  const handleSaveGuestSpotDetails = async () => {
    if (!ownedStudio?.id) return;
    setIsSavingGuestDetails(true);
    try {
      await api.put(`/studios/studio/${ownedStudio.id}`, { guest_spot_details: guestSpotDetails });
    } catch (err) {
      console.error('Failed to save guest spot details:', err);
    } finally {
      setIsSavingGuestDetails(false);
    }
  };

  const handleRemoveArtist = async (artistId: number) => {
    if (!ownedStudio?.id) return;
    try {
      await api.delete(`/studios/${ownedStudio.id}/artists/${artistId}`);
      setStudioArtists(prev => prev.filter(a => a.id !== artistId));
    } catch (err) {
      console.error('Failed to remove artist:', err);
    }
  };

  const handleAddAnnouncement = async () => {
    if (!ownedStudio?.id || !newAnnouncement.title || !newAnnouncement.content) return;
    setIsAddingAnnouncement(true);
    try {
      const res = await api.post<any>(`/studios/${ownedStudio.id}/announcements`, newAnnouncement);
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
      await api.delete(`/studios/${ownedStudio.id}/announcements/${announcementId}`);
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
      await api.post('/users/profile-photo', formData);
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
      await api.put(`/tattoos/${tattooId}/featured`, {});
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
              Welcome back {userName}
            </Typography>
            <Typography sx={{ color: colors.textSecondary, fontSize: '0.95rem' }}>
              Here's what's happening this week
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', md: 'auto' }, flexWrap: 'wrap' }}>
            <Button
              component={Link}
              href={activeTab === 'studio' && ownedStudio?.slug
                ? `/studios/${ownedStudio.slug}`
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
              View Public Profile
            </Button>
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

        {/* Dashboard Tabs - only show if user has a studio */}
        {hasStudio && (
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
                value={24}
                label="Studio Bookings This Week"
                trend="+5"
                trendUp
              />
              <StatCard
                icon={<VisibilityIcon />}
                value="3,842"
                label="Studio Page Views"
                trend="+22%"
                trendUp
              />
              <StatCard
                icon={<StarIcon />}
                value={studioArtists.length + 1}
                label="Artists at Studio"
                trend=""
              />
              <StatCard
                icon={<ChatBubbleOutlineIcon />}
                value={12}
                label="Studio Inquiries"
                trend="New"
              />
            </>
          )}
        </Box>

        {/* Main Grid */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' },
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
                    <ScheduleItemComponent key={item.id} item={item} isLast={index === schedule.length - 1} />
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
                <Card title="Guest Spot Settings">
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
                        gridTemplateColumns: 'repeat(3, 1fr)',
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
                {/* Studio Management Actions */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Button
                    onClick={() => setEditStudioOpen(true)}
                    sx={{
                      flex: 1,
                      py: 1,
                      color: colors.textPrimary,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '6px',
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.85rem',
                      '&:hover': { borderColor: colors.accent, color: colors.accent }
                    }}
                    startIcon={<EditIcon sx={{ fontSize: 18 }} />}
                  >
                    Edit Studio
                  </Button>
                </Box>

                {/* Guest Spot Seeking Toggle */}
                <Card title="Guest Spot Settings">
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
                      return (
                        <Box key={artist.id} sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 2,
                          borderBottom: index === arr.length - 1 ? 'none' : `1px solid ${colors.border}`,
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
                            <Typography sx={{ fontWeight: 500, color: colors.textPrimary }}>
                              {artist.name || artist.username}
                            </Typography>
                            <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                              @{artist.username}
                            </Typography>
                          </Box>
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
            action={<CardLink href="/travel-regions">Manage Travel Regions →</CardLink>}
          >
            <Box>
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography sx={{ color: colors.textMuted, fontSize: '0.9rem' }}>
                  Guest spot opportunities coming soon
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

      <AddArtistModal
        isOpen={addArtistOpen}
        onClose={() => setAddArtistOpen(false)}
        studioId={ownedStudio?.id || 0}
        onArtistAdded={(artist) => {
          setStudioArtists(prev => [...prev, artist]);
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
        onSuccess={() => {
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

// Dashboard Tab Component
function DashboardTab({ label, initials, imageUrl, isActive, onClick, accentAvatar }: {
  label: string;
  initials: string;
  imageUrl?: string;
  isActive: boolean;
  onClick: () => void;
  accentAvatar?: boolean;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        pb: 1.5,
        px: 0.5,
        cursor: 'pointer',
        borderBottom: isActive ? `2px solid ${colors.accent}` : '2px solid transparent',
        mb: '-1px',
        transition: 'border-color 0.2s',
        '&:hover': {
          borderColor: isActive ? colors.accent : colors.borderLight
        }
      }}
    >
      <Avatar
        src={imageUrl}
        sx={{
          width: 32,
          height: 32,
          bgcolor: accentAvatar ? colors.accent : colors.surface,
          color: accentAvatar ? colors.background : colors.textSecondary,
          fontSize: '0.75rem',
          fontWeight: 600
        }}
      >
        {initials}
      </Avatar>
      <Typography sx={{
        fontSize: '0.95rem',
        fontWeight: isActive ? 600 : 500,
        color: isActive ? colors.textPrimary : colors.textSecondary
      }}>
        {label}
      </Typography>
    </Box>
  );
}

// Stat Card Component
function StatCard({ icon, value, label, trend, trendUp }: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: string;
  trendUp?: boolean;
}) {
  const cardShadow = `0 4px 24px rgba(0, 0, 0, 0.4), 0 0 50px ${colors.accent}25`;

  return (
    <Box sx={{
      bgcolor: colors.surface,
      border: `1px solid ${colors.accent}35`,
      borderRadius: '12px',
      p: 2,
      boxShadow: cardShadow,
      transition: 'all 0.2s',
      '&:hover': { borderColor: colors.accent }
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
        <Box sx={{
          width: 40,
          height: 40,
          bgcolor: `${colors.accent}26`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.accent
        }}>
          {icon}
        </Box>
        {trend && (
          <Typography sx={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: trendUp ? colors.success : colors.textSecondary,
            display: 'flex',
            alignItems: 'center',
            gap: 0.25
          }}>
            {trendUp && <TrendingUpIcon sx={{ fontSize: 14 }} />}
            {trend}
          </Typography>
        )}
      </Box>
      <Typography sx={{ fontSize: '1.75rem', fontWeight: 600, color: colors.textPrimary, mb: 0.25 }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
        {label}
      </Typography>
    </Box>
  );
}

// Card Component
function Card({ title, subtitle, action, children, icon }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const cardShadow = `0 4px 24px rgba(0, 0, 0, 0.4), 0 0 50px ${colors.accent}25`;

  return (
    <Box sx={{
      bgcolor: colors.surface,
      border: `1px solid ${colors.accent}35`,
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: cardShadow,
    }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        p: 2,
        borderBottom: `1px solid ${colors.border}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {icon && (
            <Box sx={{ color: colors.accent }}>
              {icon}
            </Box>
          )}
          <Box>
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.textPrimary }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted, mt: 0.25 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {action}
      </Box>
      {children}
    </Box>
  );
}

// Card Link Component
function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <Typography sx={{
        fontSize: '0.85rem',
        color: colors.accent,
        '&:hover': { textDecoration: 'underline' }
      }}>
        {children}
      </Typography>
    </Link>
  );
}

// Schedule Item Component
function ScheduleItemComponent({ item, isLast }: { item: ScheduleItem; isLast: boolean }) {
  return (
    <Box sx={{
      display: 'flex',
      gap: 2,
      p: 2,
      borderBottom: isLast ? 'none' : `1px solid ${colors.border}`,
      transition: 'background 0.15s',
      '&:hover': { bgcolor: colors.background }
    }}>
      <Box sx={{ width: 50, textAlign: 'center', flexShrink: 0 }}>
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, color: colors.textPrimary, lineHeight: 1.2 }}>
          {item.day}
        </Typography>
        <Typography sx={{
          fontSize: '0.75rem',
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {item.month}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.8rem', color: colors.accent, fontWeight: 500, mb: 0.25 }}>
          {item.time}
        </Typography>
        <Typography sx={{
          fontWeight: 500,
          color: colors.textPrimary,
          mb: 0.25,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {item.title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Avatar sx={{
            width: 20,
            height: 20,
            bgcolor: colors.background,
            fontSize: '0.6rem',
            color: colors.textMuted
          }}>
            {item.clientInitials}
          </Avatar>
          <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
            {item.clientName}
          </Typography>
        </Box>
      </Box>
      <Box sx={{
        px: 1,
        py: 0.5,
        borderRadius: '100px',
        fontSize: '0.7rem',
        fontWeight: 500,
        flexShrink: 0,
        alignSelf: 'flex-start',
        bgcolor: item.type === 'appointment' ? `${colors.accent}26` : `${colors.success}26`,
        color: item.type === 'appointment' ? colors.accent : colors.success
      }}>
        {item.type === 'appointment' ? 'Appointment' : 'Consultation'}
      </Box>
    </Box>
  );
}

// Client Item Component
function ClientItemComponent({ client, isLast }: { client: ClientItem; isLast: boolean }) {
  const hintIcons: Record<string, React.ReactNode> = {
    save: <BookmarkIcon sx={{ fontSize: 14, color: colors.accent }} />,
    message: <ChatBubbleOutlineIcon sx={{ fontSize: 14, color: colors.accent }} />,
    view: <AccessTimeIcon sx={{ fontSize: 14, color: colors.accent }} />,
    like: <FavoriteIcon sx={{ fontSize: 14, color: colors.accent }} />
  };

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      p: 2,
      borderBottom: isLast ? 'none' : `1px solid ${colors.border}`,
      transition: 'background 0.15s',
      '&:hover': { bgcolor: colors.background }
    }}>
      <Avatar sx={{
        width: 44,
        height: 44,
        bgcolor: colors.background,
        color: colors.textSecondary,
        fontSize: '0.9rem',
        fontWeight: 600
      }}>
        {client.initials}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 500, color: colors.textPrimary, mb: 0.15 }}>
          {client.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {hintIcons[client.hintType]}
          <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
            {client.hint}
          </Typography>
        </Box>
      </Box>
      <Button sx={{
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
      }}>
        Message
      </Button>
    </Box>
  );
}

// Activity Item Component
function ActivityItemComponent({ activity, isLast }: { activity: ActivityItem; isLast: boolean }) {
  const activityIcons: Record<string, { icon: React.ReactNode; color: string }> = {
    save: { icon: <BookmarkIcon sx={{ fontSize: 16 }} />, color: colors.accent },
    like: { icon: <FavoriteIcon sx={{ fontSize: 16 }} />, color: colors.error },
    message: { icon: <ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />, color: colors.success }
  };

  const { icon, color } = activityIcons[activity.type] || activityIcons.like;

  return (
    <Box sx={{
      display: 'flex',
      gap: 1.5,
      p: 2,
      borderBottom: isLast ? 'none' : `1px solid ${colors.border}`
    }}>
      <Box sx={{
        width: 32,
        height: 32,
        bgcolor: colors.background,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        flexShrink: 0
      }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: '0.9rem', color: colors.textPrimary, mb: 0.15 }}>
          <Box component="span" sx={{ fontWeight: 600 }}>{activity.user}</Box>
          {' '}{activity.action}{activity.target ? ` "${activity.target}"` : ''}
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted }}>
          {activity.time}
        </Typography>
      </Box>
    </Box>
  );
}

// Region Group Component
function RegionGroup({ region, isLast }: { region: GuestSpotRegion; isLast: boolean }) {
  return (
    <Box sx={{
      p: 2,
      borderBottom: isLast ? 'none' : `1px solid ${colors.border}`
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Typography sx={{ fontSize: '1.5rem' }}>{region.flag}</Typography>
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: colors.textPrimary }}>
            {region.region}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
            {region.studioCount} studio{region.studioCount !== 1 ? 's' : ''} viewed your profile
          </Typography>
        </Box>
      </Box>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(auto-fill, minmax(300px, 1fr))' },
        gap: 2
      }}>
        {region.studios.map(studio => (
          <StudioCard key={studio.id} studio={studio} />
        ))}
      </Box>
    </Box>
  );
}

// Studio Card Component
function StudioCard({ studio }: { studio: GuestSpotStudio }) {
  return (
    <Box sx={{
      bgcolor: colors.background,
      border: `1px solid ${colors.borderLight}`,
      borderRadius: '8px',
      p: 2,
      transition: 'border-color 0.2s',
      '&:hover': { borderColor: colors.accent }
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
        <Avatar sx={{
          width: 44,
          height: 44,
          bgcolor: colors.surface,
          color: colors.textSecondary,
          fontWeight: 600,
          borderRadius: '6px'
        }}>
          {studio.initials}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: colors.textPrimary }}>
            {studio.name}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
            {studio.location}
          </Typography>
        </Box>
        {studio.seeking && (
          <Box sx={{
            px: 1,
            py: 0.5,
            borderRadius: '100px',
            fontSize: '0.7rem',
            fontWeight: 500,
            bgcolor: `${colors.success}26`,
            color: colors.success
          }}>
            Seeking Guests
          </Box>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem', color: colors.textSecondary }}>
          <VisibilityIcon sx={{ fontSize: 14, color: colors.textMuted }} />
          Viewed {studio.viewedAgo}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem', color: colors.textSecondary }}>
          <StarIcon sx={{ fontSize: 14, color: colors.textMuted }} />
          {studio.rating} ({studio.reviews} reviews)
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
        {studio.styles.map(style => (
          <Box key={style} sx={{
            px: 1,
            py: 0.5,
            bgcolor: colors.surface,
            borderRadius: '100px',
            fontSize: '0.7rem',
            color: colors.textSecondary
          }}>
            {style}
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button sx={{
          flex: 1,
          py: 0.75,
          color: colors.textPrimary,
          border: `1px solid ${colors.borderLight}`,
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: 500,
          textTransform: 'none',
          '&:hover': { borderColor: colors.accent, color: colors.accent }
        }}>
          View Studio
        </Button>
        <Button sx={{
          flex: 2,
          py: 0.75,
          bgcolor: colors.accent,
          color: colors.background,
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: 500,
          textTransform: 'none',
          '&:hover': { bgcolor: colors.accentHover }
        }}>
          Inquire About Guest Spot
        </Button>
      </Box>
    </Box>
  );
}

// Saved Artist Card Component
function SavedArtistCard({ artist, onRemove }: { artist: WishlistArtist; onRemove: (id: number) => void }) {
  const artistInitials = artist.name
    ? artist.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : artist.username?.slice(0, 2).toUpperCase() || '??';

  return (
    <Box sx={{
      minWidth: 140,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      p: 2,
      bgcolor: colors.background,
      border: `1px solid ${colors.border}`,
      borderRadius: '10px',
      transition: 'all 0.2s',
      position: 'relative',
      '&:hover': {
        borderColor: colors.accent,
        transform: 'translateY(-2px)',
      }
    }}>
      {/* Remove button */}
      <IconButton
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(artist.id);
        }}
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          p: 0.5,
          color: colors.textMuted,
          opacity: 0.6,
          '&:hover': { color: colors.error, opacity: 1, bgcolor: `${colors.error}15` }
        }}
        size="small"
      >
        <DeleteIcon sx={{ fontSize: 14 }} />
      </IconButton>

      <Link href={`/artists/${artist.username}`} style={{ textDecoration: 'none' }}>
        <Avatar
          src={artist.image?.uri}
          sx={{
            width: 56,
            height: 56,
            bgcolor: colors.accent,
            color: colors.background,
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            mb: 1,
          }}
        >
          {artistInitials}
        </Avatar>
      </Link>
      <Link href={`/artists/${artist.username}`} style={{ textDecoration: 'none' }}>
        <Typography sx={{
          fontSize: '0.85rem',
          fontWeight: 600,
          color: colors.textPrimary,
          textAlign: 'center',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 120,
          '&:hover': { color: colors.accent }
        }}>
          {artist.name || artist.username}
        </Typography>
      </Link>
      <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted, mb: 1 }}>
        @{artist.username}
      </Typography>
      {artist.books_open ? (
        <Box sx={{
          px: 1.5,
          py: 0.25,
          bgcolor: `${colors.success}20`,
          borderRadius: '100px',
          fontSize: '0.65rem',
          fontWeight: 500,
          color: colors.success,
        }}>
          Books Open
        </Box>
      ) : (
        <Box sx={{
          px: 1.5,
          py: 0.25,
          bgcolor: colors.surface,
          borderRadius: '100px',
          fontSize: '0.65rem',
          color: colors.textMuted,
        }}>
          Books Closed
        </Box>
      )}
    </Box>
  );
}

// Lead Card Component for artist dashboard - matches SavedArtistCard style
function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const userInitials = lead.user.name
    ? lead.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : lead.user.username?.slice(0, 2).toUpperCase() || '??';

  const imageUrl = typeof lead.user.image === 'string' ? lead.user.image : lead.user.image?.uri;

  return (
    <Box
      onClick={onClick}
      sx={{
        minWidth: 140,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 2,
        bgcolor: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: '10px',
        transition: 'all 0.2s',
        cursor: 'pointer',
        '&:hover': {
          borderColor: colors.accent,
          transform: 'translateY(-2px)',
        }
      }}
    >
      <Avatar
        src={imageUrl}
        sx={{
          width: 56,
          height: 56,
          bgcolor: colors.accent,
          color: colors.background,
          fontSize: '1rem',
          fontWeight: 600,
          mb: 1,
        }}
      >
        {userInitials}
      </Avatar>

      <Typography sx={{
        fontSize: '0.85rem',
        fontWeight: 600,
        color: colors.textPrimary,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: 120,
      }}>
        {lead.user.name || lead.user.username}
      </Typography>

      {lead.user.location && (
        <Typography sx={{
          fontSize: '0.75rem',
          color: colors.textMuted,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 120,
          mb: 1,
        }}>
          {lead.user.location}
        </Typography>
      )}

      <Box sx={{
        px: 1.5,
        py: 0.25,
        bgcolor: `${colors.accent}20`,
        borderRadius: '100px',
        fontSize: '0.65rem',
        fontWeight: 500,
        color: colors.accent,
        mt: lead.user.location ? 0 : 1,
      }}>
        {lead.timing_label}
      </Box>
    </Box>
  );
}

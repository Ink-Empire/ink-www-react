import React, { useState, useEffect, lazy, Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Box, Typography, Button, Avatar, Skeleton, Switch, CircularProgress, Dialog, DialogContent, IconButton, useMediaQuery, useTheme, Snackbar, Alert } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import StarIcon from '@mui/icons-material/Star';
import AddIcon from '@mui/icons-material/Add';

// Lazy load heavy modals - only loaded when needed
const ChangePasswordModal = dynamic(() => import('./ChangePasswordModal'), { ssr: false });
const StyleModal = dynamic(() => import('./StyleModal'), { ssr: false });
const TattooIntent = dynamic(() => import('./Onboarding/TattooIntent').then(mod => ({ default: mod.default })), { ssr: false });
import type { TattooIntentData } from './Onboarding/TattooIntent';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { colors } from '@/styles/colors';
import { useClientDashboard, DashboardAppointment, SuggestedArtist, WishlistArtist } from '@/hooks/useClientDashboard';
import { clientService } from '@/services/clientService';
import { ApiConversation } from '@/hooks/useConversations';
import { leadService } from '@/services/leadService';
import { useStyles } from '@/contexts/StyleContext';
import { useUser } from '@/contexts/AuthContext';
import InfoTooltip from './InfoTooltip';

interface ClientDashboardContentProps {
  userName: string;
  userId: number;
}

interface LeadData {
  id: number;
  timing: 'week' | 'month' | 'year' | null;
  allow_artist_contact: boolean;
  style_ids: number[];
  tag_ids: number[];
  custom_themes: string[];
  description: string;
  is_active: boolean;
}

export default function ClientDashboardContent({ userName, userId }: ClientDashboardContentProps) {
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [leadActive, setLeadActive] = useState(false);
  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [leadLoading, setLeadLoading] = useState(true);
  const [leadToggling, setLeadToggling] = useState(false);
  const [artistsNotified, setArtistsNotified] = useState(0);
  const [intentDialogOpen, setIntentDialogOpen] = useState(false);
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [styleModalOpen, setStyleModalOpen] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<number[]>([]);
  const [beaconSnackbarOpen, setBeaconSnackbarOpen] = useState(false);
  const { styles, getStyleName } = useStyles();
  const { userData, updateStyles } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Initialize selected styles from user data
  useEffect(() => {
    if (userData) {
      setSelectedStyles(userData.styles || []);
    }
  }, [userData]);

  // Handle style update
  const handleApplyStyles = async (updatedStyles: number[]) => {
    setSelectedStyles(updatedStyles);
    try {
      await updateStyles(updatedStyles);
    } catch (err) {
      console.error('Failed to update styles:', err);
    }
  };

  // Remove a single style
  const removeStyle = (styleId: number) => {
    const updatedStyles = selectedStyles.filter(id => id !== styleId);
    handleApplyStyles(updatedStyles);
  };

  const {
    appointments,
    conversations,
    favorites,
    suggestedArtists,
    loading: dashboardLoading,
    refresh: refreshDashboard,
  } = useClientDashboard();

  // Use favorites from main dashboard call (avoids separate API call)
  const wishlist = favorites;
  const wishlistLoading = dashboardLoading;

  // Fetch lead status on mount
  useEffect(() => {
    const fetchLeadStatus = async () => {
      try {
        const response = await leadService.getStatus();
        setLeadActive(response.is_active || false);
        setArtistsNotified(response.artists_notified || 0);
        if (response.lead) {
          setLeadData(response.lead);
        }
      } catch (err) {
        console.error('Failed to fetch lead status:', err);
      } finally {
        setLeadLoading(false);
      }
    };
    fetchLeadStatus();
  }, []);

  const handleLeadToggle = async () => {
    if (!leadActive) {
      // Turning ON - show the intent dialog to collect preferences
      setIntentDialogOpen(true);
    } else {
      // Turning OFF - set is_active to false
      setLeadToggling(true);
      try {
        await leadService.deactivate();
        setLeadActive(false);
      } catch (err) {
        console.error('Failed to deactivate lead:', err);
      } finally {
        setLeadToggling(false);
      }
    }
  };

  const handleIntentSubmit = async (intentData: TattooIntentData) => {
    setLeadToggling(true);
    try {
      const payload = {
        timing: intentData.timing,
        allow_artist_contact: intentData.allowArtistContact,
        tag_ids: intentData.selectedTags,
        custom_themes: intentData.customThemes || [],
        description: intentData.description || '',
      };

      if (isEditingLead && leadData) {
        // Update existing lead
        await leadService.update(payload);
      } else {
        // Create new lead
        await leadService.create(payload);
        setBeaconSnackbarOpen(true);
      }

      // Refresh lead data
      const response = await leadService.getStatus();
      setLeadActive(response.is_active || false);
      setArtistsNotified(response.artists_notified || 0);
      if (response.lead) {
        setLeadData(response.lead);
      }

      setIntentDialogOpen(false);
      setIsEditingLead(false);
    } catch (err) {
      console.error('Failed to save lead preferences:', err);
    } finally {
      setLeadToggling(false);
    }
  };

  const handleEditLead = () => {
    setIsEditingLead(true);
    setIntentDialogOpen(true);
  };

  const handleIntentDialogClose = () => {
    setIntentDialogOpen(false);
    setIsEditingLead(false);
  };

  const handleAddToWishlist = async (artistId: number) => {
    try {
      await clientService.addFavorite(artistId);
      refreshDashboard();
    } catch (err) {
      console.error('Error adding to wishlist:', err);
    }
  };

  const handleRemoveFromWishlist = async (artistId: number) => {
    try {
      await clientService.removeFavorite(artistId);
      refreshDashboard();
    } catch (err) {
      console.error('Error removing from wishlist:', err);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 3, px: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', md: 'center' },
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        mb: 3
      }}>
        <Box>
          <Typography sx={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: { xs: '1.5rem', md: '2rem' },
            fontWeight: 600,
            color: colors.textPrimary,
            mb: 0.25
          }}>
            Welcome back, {userName}!
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/inbox"
          sx={{
            px: 2.5,
            py: 1,
            bgcolor: colors.accent,
            color: colors.background,
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.9rem',
            '&:hover': { bgcolor: colors.accentHover }
          }}
          startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />}
        >
          View Messages
        </Button>
      </Box>

      {/* Appointments Row with Open to New Work */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1fr 280px' },
        gap: 3,
        mb: 3,
      }}>
        {/* Upcoming Appointments */}
        <Card
          title="Upcoming Appointments"
          icon={<CalendarMonthIcon sx={{ color: colors.accent, fontSize: 20 }} />}
          action={
            <CardLink href="/calendar">
              View All <ArrowForwardIcon sx={{ fontSize: 14, ml: 0.5 }} />
            </CardLink>
          }
        >
        {dashboardLoading ? (
          <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" width={200} height={120} sx={{ bgcolor: colors.background }} />
            ))}
          </Box>
        ) : appointments.length > 0 ? (
          <Box sx={{
            display: 'flex',
            gap: 2,
            p: 2,
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
          }}>
            {appointments.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} />
            ))}
          </Box>
        ) : (
          <EmptyState
            icon={<CalendarMonthIcon sx={{ fontSize: 32, color: colors.textMuted }} />}
            message="No upcoming appointments"
            action={
              <Button
                component={Link}
                href="/artists"
                sx={{
                  mt: 1,
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
            }
          />
        )}
        </Card>

        {/* Open to New Work Toggle */}
        <Card
          title="Let Artists Find You"
          tooltip="With a few descriptive details, you can describe what work you're looking for, and artists in your area can contact you with quotes."
          variant={leadActive ? 'highlight' : 'default'}
          icon={<SearchIcon sx={{ color: leadActive ? colors.accent : colors.textMuted, fontSize: 20 }} />}
          compact
        >
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            textAlign: 'center',
          }}>
            <Typography sx={{ fontWeight: 500, color: leadActive ? colors.accent : colors.textPrimary, mb: 0.5 }}>
              Looking for a Tattoo
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted, mb: 1.5, lineHeight: 1.4 }}>
              {leadActive
                ? artistsNotified > 0
                  ? `${artistsNotified} artist${artistsNotified === 1 ? '' : 's'} in your area notified`
                  : 'Artists in your area can reach out to you'
                : 'Turn on to let artists know you\'re looking for work'}
            </Typography>
            {leadLoading ? (
              <CircularProgress size={24} sx={{ color: colors.accent }} />
            ) : (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {leadToggling && <CircularProgress size={16} sx={{ color: colors.accent }} />}
                  <Switch
                    checked={leadActive}
                    onChange={handleLeadToggle}
                    disabled={leadToggling}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: colors.accent,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: colors.accent,
                      },
                    }}
                  />
                </Box>
                {leadActive && leadData && (
                  <Button
                    onClick={handleEditLead}
                    size="small"
                    sx={{
                      mt: 1.5,
                      px: 2,
                      py: 0.5,
                      color: colors.accent,
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      textTransform: 'none',
                      border: `1px solid ${colors.accent}`,
                      borderRadius: '6px',
                      '&:hover': {
                        bgcolor: colors.accent,
                        color: colors.background,
                      }
                    }}
                  >
                    Edit My Idea
                  </Button>
                )}
              </>
            )}
          </Box>
        </Card>
      </Box>

      {/* Artists You Might Like - always filter out demo artists on dashboard */}
      {(() => {
        const filteredArtists = suggestedArtists.filter(a => !a.is_demo);
        if (filteredArtists.length === 0) return null;
        return (
          <Card
            title="Artists You Might Like"
            subtitle="Based on your favorite styles and saved tattoos"
            icon={<PersonAddIcon sx={{ color: colors.accent, fontSize: 20 }} />}
            action={
              <CardLink href="/artists">
                See All <ArrowForwardIcon sx={{ fontSize: 14, ml: 0.5 }} />
              </CardLink>
            }
            sx={{ mb: 3 }}
          >
            {dashboardLoading ? (
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 2,
                p: 2,
              }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} variant="rounded" height={180} sx={{ bgcolor: colors.background }} />
                ))}
              </Box>
            ) : (
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 2,
                p: 2,
              }}>
                {filteredArtists.map((artist) => (
                  <SuggestedArtistCard
                    key={artist.id}
                    artist={artist}
                    onAddToWishlist={handleAddToWishlist}
                    isOnWishlist={wishlist.some((w) => w.id === artist.id)}
                  />
                ))}
              </Box>
            )}
          </Card>
        );
      })()}

      {/* Two Column Layout */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
        gap: 3,
      }}>
        {/* My Saved Items */}
        <Card
          title="My Saved Items"
          subtitle="Artists and tattoos you've saved"
          icon={<BookmarkIcon sx={{ color: colors.accent, fontSize: 20 }} />}
          action={
            <CardLink href="/wishlist">
              View All <ArrowForwardIcon sx={{ fontSize: 14, ml: 0.5 }} />
            </CardLink>
          }
        >
          {wishlistLoading ? (
            <Box sx={{ p: 2 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rounded" height={60} sx={{ bgcolor: colors.background, mb: 1 }} />
              ))}
            </Box>
          ) : wishlist.length > 0 ? (
            <Box>
              {wishlist.slice(0, 5).map((artist, index) => (
                <WishlistRow
                  key={artist.id}
                  artist={artist}
                  onRemove={handleRemoveFromWishlist}
                  isLast={index === Math.min(wishlist.length, 5) - 1}
                />
              ))}
            </Box>
          ) : (
            <EmptyState
              icon={<BookmarkIcon sx={{ fontSize: 32, color: colors.textMuted }} />}
              message="Your wishlist is empty"
              subMessage="Add artists to get notified when their books open"
            />
          )}
        </Card>

        {/* Recent Messages */}
        <Card
          title="Recent Messages"
          icon={<ChatBubbleOutlineIcon sx={{ color: colors.accent, fontSize: 20 }} />}
          action={
            <CardLink href="/inbox">
              View All <ArrowForwardIcon sx={{ fontSize: 14, ml: 0.5 }} />
            </CardLink>
          }
        >
          {dashboardLoading ? (
            <Box sx={{ p: 2 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rounded" height={60} sx={{ bgcolor: colors.background, mb: 1 }} />
              ))}
            </Box>
          ) : conversations.length > 0 ? (
            <Box>
              {conversations.map((conv, index) => (
                <MessageRow
                  key={conv.id}
                  conversation={conv}
                  userId={userId}
                  isLast={index === conversations.length - 1}
                />
              ))}
            </Box>
          ) : (
            <EmptyState
              icon={<ChatBubbleOutlineIcon sx={{ fontSize: 32, color: colors.textMuted }} />}
              message="No messages yet"
              subMessage="Start a conversation with an artist"
            />
          )}
        </Card>
      </Box>

      {/* Preferences */}
      <Card
        title="Preferences"
        icon={<SettingsIcon sx={{ color: colors.accent, fontSize: 20 }} />}
        sx={{ mt: 3 }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <StarIcon sx={{ color: colors.accent, fontSize: 18 }} />
            <Typography sx={{ fontWeight: 500, color: colors.textPrimary }}>
              Your Styles
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted, mb: 2 }}>
            Select styles you're interested in to help us personalize your experience.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
            {selectedStyles.map(styleId => (
              <Box
                key={styleId}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  bgcolor: `${colors.accent}20`,
                  borderRadius: '100px',
                  fontSize: '0.85rem',
                  color: colors.accent,
                  fontWeight: 500,
                }}
              >
                {getStyleName(styleId)}
                <IconButton
                  size="small"
                  onClick={() => removeStyle(styleId)}
                  sx={{
                    p: 0.25,
                    ml: 0.25,
                    color: colors.accent,
                    '&:hover': { color: colors.error, bgcolor: 'transparent' }
                  }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ))}
            <Button
              onClick={() => setStyleModalOpen(true)}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.5,
                py: 0.5,
                bgcolor: colors.background,
                border: `1px dashed ${colors.border}`,
                borderRadius: '100px',
                fontSize: '0.85rem',
                color: colors.textMuted,
                textTransform: 'none',
                minWidth: 'auto',
                '&:hover': {
                  borderColor: colors.accent,
                  color: colors.accent,
                  bgcolor: colors.background,
                }
              }}
            >
              <AddIcon sx={{ fontSize: 16 }} />
              Add Style
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Security Settings */}
      <Card
        title="Security"
        icon={<LockIcon sx={{ color: colors.accent, fontSize: 20 }} />}
        sx={{ mt: 3 }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
        }}>
          <Box>
            <Typography sx={{ fontWeight: 500, color: colors.textPrimary }}>
              Password
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
              Keep your account secure
            </Typography>
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

      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

      <StyleModal
        isOpen={styleModalOpen}
        onClose={() => setStyleModalOpen(false)}
        onApply={handleApplyStyles}
        selectedStyles={selectedStyles}
      />

      {/* Tattoo Intent Dialog - shown when toggling Open to New Work ON */}
      <Dialog
        open={intentDialogOpen}
        onClose={handleIntentDialogClose}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: colors.surface,
            backgroundImage: 'none',
            borderRadius: isMobile ? 0 : '16px',
            maxHeight: isMobile ? '100%' : '90vh',
            border: `1px solid ${colors.accent}50`,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 80px ${colors.accent}30`,
          }
        }}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: colors.textPrimary }}>
            {isEditingLead ? 'Edit your tattoo idea' : 'Tell us about your tattoo plans'}
          </Typography>
          <IconButton
            onClick={handleIntentDialogClose}
            sx={{ color: colors.textMuted, '&:hover': { color: colors.textPrimary } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <TattooIntent
              key={isEditingLead ? 'edit' : 'create'}
              onStepComplete={handleIntentSubmit}
              onBack={handleIntentDialogClose}
              selectedStyles={[]}
              isModalMode
              initialData={isEditingLead && leadData ? {
                timing: leadData.timing,
                tag_ids: leadData.tag_ids,
                custom_themes: leadData.custom_themes,
                description: leadData.description,
                allow_artist_contact: leadData.allow_artist_contact,
              } : undefined}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Beacon Success Snackbar */}
      <Snackbar
        open={beaconSnackbarOpen}
        autoHideDuration={10000}
        onClose={() => setBeaconSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setBeaconSnackbarOpen(false)}
          icon={false}
          sx={{
            bgcolor: colors.accent,
            color: colors.background,
            fontWeight: 500,
            '& .MuiAlert-action': { color: colors.background },
            '& .MuiAlert-action .MuiIconButton-root:hover': { bgcolor: 'rgba(0,0,0,0.1)' },
          }}
        >
          <strong>Now what?</strong> Just sit back! Artists in your area will see your idea and can contact you via email with their availability and quotes.
        </Alert>
      </Snackbar>
    </Box>
  );
}

// Card Component with variants for visual distinction
function Card({ title, subtitle, action, children, sx = {}, variant = 'default', icon, compact = false, tooltip }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  sx?: object;
  variant?: 'default' | 'highlight' | 'elevated' | 'accent-left' | 'info-left' | 'subtle';
  icon?: React.ReactNode;
  compact?: boolean;
  tooltip?: string;
}) {
  const cardShadow = `0 4px 24px rgba(0, 0, 0, 0.4), 0 0 50px ${colors.accent}25`;
  const highlightShadow = `0 4px 24px rgba(0, 0, 0, 0.4), 0 0 60px ${colors.accent}35`;

  const variantStyles = {
    default: {
      bgcolor: colors.surface,
      border: `1px solid ${colors.accent}35`,
      boxShadow: cardShadow,
    },
    highlight: {
      bgcolor: colors.surface,
      border: `1px solid ${colors.accent}60`,
      boxShadow: highlightShadow,
    },
    elevated: {
      bgcolor: colors.surfaceElevated,
      border: `1px solid ${colors.accent}35`,
      boxShadow: cardShadow,
    },
    'accent-left': {
      bgcolor: colors.surface,
      border: `1px solid ${colors.accent}35`,
      borderLeft: `3px solid ${colors.accent}`,
      boxShadow: cardShadow,
    },
    'info-left': {
      bgcolor: colors.surface,
      border: `1px solid ${colors.accent}35`,
      borderLeft: `3px solid ${colors.info}`,
      boxShadow: cardShadow,
    },
    subtle: {
      bgcolor: colors.surface,
      border: `1px solid ${colors.accent}35`,
      boxShadow: cardShadow,
    },
  };

  return (
    <Box sx={{
      ...variantStyles[variant],
      borderRadius: '12px',
      overflow: 'hidden',
      ...sx,
    }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        p: compact ? 1.5 : 2,
        borderBottom: `1px solid ${colors.border}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {icon}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ fontSize: compact ? '0.9rem' : '1rem', fontWeight: 600, color: colors.textPrimary }}>
                {title}
              </Typography>
              {tooltip && <InfoTooltip text={tooltip} />}
            </Box>
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
        display: 'flex',
        alignItems: 'center',
        '&:hover': { textDecoration: 'underline' }
      }}>
        {children}
      </Typography>
    </Link>
  );
}

// Empty State Component
function EmptyState({ icon, message, subMessage, action }: {
  icon: React.ReactNode;
  message: string;
  subMessage?: string;
  action?: React.ReactNode;
}) {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4,
      px: 2,
    }}>
      {icon}
      <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary, mt: 1 }}>
        {message}
      </Typography>
      {subMessage && (
        <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted, mt: 0.5, textAlign: 'center' }}>
          {subMessage}
        </Typography>
      )}
      {action}
    </Box>
  );
}

// Appointment Card Component
function AppointmentCard({ appointment }: { appointment: DashboardAppointment }) {
  const date = new Date(appointment.date);
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const time = formatTime(appointment.start_time);
  const appointmentTitle = appointment.title || (appointment.type === 'consultation' ? 'Consultation' : 'Tattoo Session');

  const artistInitials = appointment.artist.name
    ? appointment.artist.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : appointment.artist.username?.slice(0, 2).toUpperCase() || '??';

  return (
    <Link
      href={`/appointments/${appointment.id}`}
      style={{ textDecoration: 'none' }}
      aria-label={`${appointmentTitle} with ${appointment.artist.name || appointment.artist.username} on ${month} ${day} at ${time}`}
    >
      <Box
        component="article"
        sx={{
          minWidth: 180,
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
        <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
          <Box sx={{ textAlign: 'center' }} aria-hidden="true">
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: colors.textPrimary, lineHeight: 1.2 }}>
              {day}
            </Typography>
            <Typography sx={{
              fontSize: '0.7rem',
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {month}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography component="time" sx={{ fontSize: '0.8rem', color: colors.accent, fontWeight: 500 }}>
              {time}
            </Typography>
            <Typography sx={{
              fontSize: '0.85rem',
              fontWeight: 500,
              color: colors.textPrimary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {appointmentTitle}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            src={appointment.artist.image?.uri}
            alt={`${appointment.artist.name || appointment.artist.username}'s profile`}
            sx={{
              width: 24,
              height: 24,
              bgcolor: colors.accent,
              color: colors.background,
              fontSize: '0.6rem',
              fontWeight: 600,
            }}
          >
            {artistInitials}
          </Avatar>
          <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
            @{appointment.artist.username}
          </Typography>
        </Box>
      </Box>
    </Link>
  );
}

// Suggested Artist Card Component
function SuggestedArtistCard({ artist, onAddToWishlist, isOnWishlist }: {
  artist: SuggestedArtist;
  onAddToWishlist: (id: number) => void;
  isOnWishlist: boolean;
}) {
  const artistName = artist.name || artist.username;
  const artistInitials = artist.name
    ? artist.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : artist.username?.slice(0, 2).toUpperCase() || '??';

  return (
    <Box
      component="article"
      aria-label={`Artist: ${artistName}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 2,
        bgcolor: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: '10px',
        transition: 'border-color 0.2s',
        '&:hover': { borderColor: colors.borderLight }
      }}
    >
      <Link href={`/artists/${artist.username}`} style={{ textDecoration: 'none' }} aria-label={`View ${artistName}'s profile`}>
        <Avatar
          src={artist.image?.uri}
          alt={`${artistName}'s profile picture`}
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
          '&:hover': { color: colors.accent }
        }}>
          {artistName}
        </Typography>
      </Link>
      <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted, flex: 1 }}>
        @{artist.username}
      </Typography>
      {artist.books_open ? (
        <Button
          component={Link}
          href={`/artists/${artist.username}`}
          aria-label={`Book appointment with ${artistName}`}
          sx={{
            width: '100%',
            py: 0.5,
            bgcolor: colors.success,
            color: '#fff',
            borderRadius: '6px',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.75rem',
            '&:hover': { bgcolor: colors.success }
          }}
        >
          Book Now
        </Button>
      ) : (
        <Button
          onClick={() => !isOnWishlist && onAddToWishlist(artist.id)}
          disabled={isOnWishlist}
          aria-label={isOnWishlist ? `${artistName} is on your wishlist` : `Get notified when ${artistName} opens bookings`}
          sx={{
            width: '100%',
            py: 0.5,
            bgcolor: isOnWishlist ? colors.surface : `${colors.accent}15`,
            color: isOnWishlist ? colors.textMuted : colors.accent,
            border: `1px solid ${isOnWishlist ? colors.border : colors.accent}40`,
            borderRadius: '6px',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.75rem',
            '&:hover': isOnWishlist ? {} : { bgcolor: colors.accent, color: colors.background },
            '&:disabled': { opacity: 0.7 }
          }}
          startIcon={isOnWishlist ? <NotificationsActiveIcon sx={{ fontSize: 14 }} aria-hidden="true" /> : <NotificationsOffIcon sx={{ fontSize: 14 }} aria-hidden="true" />}
        >
          {isOnWishlist ? 'On Wishlist' : 'Notify Me'}
        </Button>
      )}
    </Box>
  );
}

// Wishlist Row Component
function WishlistRow({ artist, onRemove, isLast }: {
  artist: WishlistArtist;
  onRemove: (id: number) => void;
  isLast: boolean;
}) {
  const artistName = artist.name || artist.username;
  const artistInitials = artist.name
    ? artist.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : artist.username?.slice(0, 2).toUpperCase() || '??';

  return (
    <Box
      component="article"
      aria-label={`${artistName} - ${artist.books_open ? 'Now Booking' : 'Books Closed'}`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, sm: 1.5 },
        p: { xs: 1.5, sm: 2 },
        borderBottom: isLast ? 'none' : `1px solid ${colors.border}`,
        transition: 'background 0.15s',
        '&:hover': { bgcolor: colors.background }
      }}
    >
      <Link href={`/artists/${artist.username}`} style={{ textDecoration: 'none', flexShrink: 0 }} aria-label={`View ${artistName}'s profile`}>
        <Avatar
          src={artist.image?.uri}
          alt={`${artistName}'s profile picture`}
          sx={{
            width: { xs: 36, sm: 40 },
            height: { xs: 36, sm: 40 },
            bgcolor: colors.accent,
            color: colors.background,
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {artistInitials}
        </Avatar>
      </Link>
      <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <Link href={`/artists/${artist.username}`} style={{ textDecoration: 'none' }}>
          <Typography sx={{
            fontWeight: 500,
            color: colors.textPrimary,
            fontSize: { xs: '0.8rem', sm: '0.9rem' },
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            '&:hover': { color: colors.accent }
          }}>
            @{artist.username}
          </Typography>
        </Link>
        {artist.studio?.slug ? (
          <Link href={`/studios/${artist.studio.slug}`} style={{ textDecoration: 'none' }}>
            <Typography sx={{
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              color: colors.accent,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              '&:hover': { textDecoration: 'underline' }
            }}>
              {artist.studio.name}
            </Typography>
          </Link>
        ) : (
          <Typography sx={{
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            color: colors.textMuted,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {artist.studio?.name || 'Independent'}
          </Typography>
        )}
      </Box>
      {artist.books_open ? (
        <Button
          component={Link}
          href={`/artists/${artist.username}`}
          aria-label={`Book appointment with ${artistName}`}
          sx={{
            px: { xs: 1, sm: 1.5 },
            py: 0.5,
            bgcolor: colors.success,
            color: '#fff',
            borderRadius: '6px',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: { xs: '0.65rem', sm: '0.75rem' },
            whiteSpace: 'nowrap',
            flexShrink: 0,
            '&:hover': { bgcolor: colors.success }
          }}
        >
          Now Booking!
        </Button>
      ) : (
        <Typography
          component="span"
          role="status"
          sx={{
            px: { xs: 1, sm: 1.5 },
            py: 0.5,
            bgcolor: colors.background,
            borderRadius: '6px',
            fontSize: { xs: '0.65rem', sm: '0.75rem' },
            color: colors.textMuted,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Books Closed
        </Typography>
      )}
      <Button
        onClick={() => onRemove(artist.id)}
        aria-label={`Remove ${artistName} from wishlist`}
        sx={{
          minWidth: 0,
          p: { xs: 0.5, sm: 0.75 },
          flexShrink: 0,
          color: colors.textMuted,
          '&:hover': { color: colors.error, bgcolor: `${colors.error}15` }
        }}
      >
        <DeleteIcon sx={{ fontSize: { xs: 16, sm: 18 } }} aria-hidden="true" />
      </Button>
    </Box>
  );
}

// Message Row Component
function MessageRow({ conversation, userId, isLast }: {
  conversation: ApiConversation;
  userId: number;
  isLast: boolean;
}) {
  const participant = conversation.participant;
  const lastMessage = conversation.last_message;
  const isUnread = conversation.unread_count > 0;
  const participantName = participant?.name || `@${participant?.username}`;

  const initials = participant?.name
    ? participant.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : participant?.username?.slice(0, 2).toUpperCase() || '??';

  const messagePreview = lastMessage?.content
    ? lastMessage.content.length > 40
      ? lastMessage.content.slice(0, 40) + '...'
      : lastMessage.content
    : 'No messages yet';

  const timeAgo = lastMessage?.created_at ? getTimeAgo(lastMessage.created_at) : '';

  return (
    <Link
      href={`/inbox?conversation=${conversation.id}`}
      style={{ textDecoration: 'none' }}
      aria-label={`${isUnread ? 'Unread message from' : 'Message from'} ${participantName}${timeAgo ? `, ${timeAgo}` : ''}`}
    >
      <Box
        component="article"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 2,
          borderBottom: isLast ? 'none' : `1px solid ${colors.border}`,
          transition: 'background 0.15s',
          cursor: 'pointer',
          bgcolor: isUnread ? `${colors.accent}08` : 'transparent',
          '&:hover': { bgcolor: colors.background }
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={participant?.image?.uri}
            alt={`${participantName}'s profile picture`}
            sx={{
              width: 40,
              height: 40,
              bgcolor: colors.accent,
              color: colors.background,
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            {initials}
          </Avatar>
          {isUnread && (
            <Box
              aria-label="Unread"
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 10,
                height: 10,
                bgcolor: colors.accent,
                borderRadius: '50%',
                border: `2px solid ${colors.surface}`,
              }}
            />
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
            <Typography sx={{
              fontWeight: isUnread ? 600 : 500,
              color: colors.textPrimary,
              fontSize: '0.9rem',
            }}>
              {participantName}
            </Typography>
            <Typography component="time" sx={{ fontSize: '0.7rem', color: colors.textMuted }}>
              {timeAgo}
            </Typography>
          </Box>
          <Typography sx={{
            fontSize: '0.8rem',
            color: isUnread ? colors.textSecondary : colors.textMuted,
            fontWeight: isUnread ? 500 : 400,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {messagePreview}
          </Typography>
        </Box>
      </Box>
    </Link>
  );
}

// Helper functions
function formatTime(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

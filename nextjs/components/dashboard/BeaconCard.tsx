import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import {
  Box, Typography, Button, Switch, CircularProgress,
  Dialog, DialogContent, IconButton, Snackbar, Alert,
  useMediaQuery, useTheme, Chip, Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { colors } from '@/styles/colors';
import { useUser } from '@/contexts/AuthContext';
import { leadService } from '@/services/leadService';
import { messageService } from '@/services/messageService';
import type { LeadStatusResponse } from '@/services/leadService';
import type { TattooIntentData } from '@/components/Onboarding/TattooIntent';

const TattooIntent = dynamic(
  () => import('@/components/Onboarding/TattooIntent').then(mod => ({ default: mod.default })),
  { ssr: false }
);
const ClientUploadWizard = dynamic(() => import('@/components/ClientUploadWizard'), { ssr: false });
const TattooModal = dynamic(() => import('@/components/TattooModal'), { ssr: false });

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

interface TattooData {
  id: number;
  title?: string;
  description?: string;
  post_type?: string;
  primary_image?: { uri: string };
  images?: { id: number; uri: string }[];
}

type FlowState = 'closed' | 'choosing' | 'text-only' | 'with-photos';

interface BeaconCardProps {
  Card: React.ComponentType<any>;
  onRefresh?: () => void;
}

const timingLabels: Record<string, string> = {
  week: 'This week',
  month: 'This month',
  year: 'This year',
};

export function BeaconCard({ Card, onRefresh }: BeaconCardProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { userData } = useUser();

  const [leadActive, setLeadActive] = useState(false);
  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [tattooData, setTattooData] = useState<TattooData | null>(null);
  const [leadLoading, setLeadLoading] = useState(true);
  const [leadToggling, setLeadToggling] = useState(false);
  const [artistsNotified, setArtistsNotified] = useState(0);
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [beaconSnackbarOpen, setBeaconSnackbarOpen] = useState(false);
  const [consultationCount, setConsultationCount] = useState(0);

  // Flow state
  const [flowState, setFlowState] = useState<FlowState>('closed');
  const [uploadWizardOpen, setUploadWizardOpen] = useState(false);
  const [tattooModalOpen, setTattooModalOpen] = useState(false);

  const hasTattoo = !!tattooData;
  const thumbnailUri = tattooData?.primary_image?.uri || tattooData?.images?.[0]?.uri;

  const refreshStatus = async () => {
    try {
      const response = await leadService.getStatus();
      setLeadActive(response.is_active || false);
      setArtistsNotified(response.artists_notified || 0);
      if (response.lead) {
        setLeadData(response.lead);
      } else {
        setLeadData(null);
      }
      setTattooData(response.tattoo || null);
    } catch (err) {
      console.error('Failed to fetch lead status:', err);
    }
  };

  useEffect(() => {
    const fetchInitial = async () => {
      await refreshStatus();
      setLeadLoading(false);
    };
    fetchInitial();
  }, []);

  // Fetch consultation count when lead is active
  useEffect(() => {
    if (!leadActive) return;
    const fetchConsultations = async () => {
      try {
        const res = await messageService.getConversations({ type: 'consultation', limit: 1 });
        setConsultationCount(res.meta?.total || 0);
      } catch {
        // ignore
      }
    };
    fetchConsultations();
  }, [leadActive]);

  const handleLeadToggle = async () => {
    if (!leadActive) {
      setFlowState('choosing');
    } else {
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
        await leadService.update(payload);
      } else {
        await leadService.create(payload);
        setBeaconSnackbarOpen(true);
      }

      await refreshStatus();
      setFlowState('closed');
      setIsEditingLead(false);
    } catch (err) {
      console.error('Failed to save lead preferences:', err);
    } finally {
      setLeadToggling(false);
    }
  };

  const handleFlowClose = () => {
    setFlowState('closed');
    setIsEditingLead(false);
  };

  const handleEditLead = () => {
    setIsEditingLead(true);
    setFlowState('text-only');
  };

  const handleEditPreferences = () => {
    setIsEditingLead(true);
    setFlowState('text-only');
  };

  const handleUploadSuccess = async () => {
    await refreshStatus();
    setBeaconSnackbarOpen(true);
    onRefresh?.();
  };

  const intentDialogOpen = flowState === 'text-only';
  const choosingDialogOpen = flowState === 'choosing';

  return (
    <>
      <Card
        title="Let Artists Find You"
        tooltip="Describe what work you're looking for, and artists in your area can contact you with quotes."
        variant={leadActive ? 'highlight' : 'default'}
        icon={<SearchIcon sx={{ color: leadActive ? colors.accent : colors.textMuted, fontSize: 20 }} />}
        compact
      >
        {leadLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} sx={{ color: colors.accent }} />
          </Box>
        ) : !leadActive ? (
          /* Inactive state */
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 500, color: colors.textPrimary, mb: 0.5 }}>
              Looking for a Tattoo
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted, mb: 1.5, lineHeight: 1.4 }}>
              Turn on to let artists know you're looking for work
            </Typography>
            <Button
              onClick={() => setFlowState('choosing')}
              sx={{
                px: 3, py: 1,
                bgcolor: colors.accent,
                color: colors.background,
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                '&:hover': { bgcolor: colors.accentHover },
              }}
            >
              Get Started
            </Button>
          </Box>
        ) : hasTattoo ? (
          /* Active with linked tattoo (has images) - matches RN seeking card */
          <Box sx={{ p: 0 }}>
            {/* User header row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, pt: 2, pb: 1.5 }}>
              <Avatar
                src={typeof userData?.image === 'string' ? userData.image : userData?.image?.uri}
                sx={{ width: 36, height: 36, bgcolor: colors.accent, color: colors.background, fontSize: '0.8rem', fontWeight: 600 }}
              >
                {(userData?.name || '?').slice(0, 2).toUpperCase()}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 600, color: colors.textPrimary, fontSize: '0.9rem', lineHeight: 1.2 }}>
                  {userData?.name || 'You'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                  <SearchIcon sx={{ fontSize: 13, color: colors.seeking }} />
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.seeking }}>
                    Seeking Artist
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Thumbnail image */}
            {thumbnailUri && (
              <Box
                component="img"
                src={thumbnailUri}
                alt={tattooData?.title || 'Seeking post'}
                sx={{
                  width: '100%', maxHeight: 180, objectFit: 'cover',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.9 },
                }}
                onClick={() => setTattooModalOpen(true)}
              />
            )}

            {/* Details section */}
            <Box sx={{ px: 2, pt: 1.5, pb: 2 }}>
              {/* Title */}
              {tattooData?.title && (
                <Typography sx={{ fontWeight: 700, color: colors.textPrimary, fontSize: '1rem', mb: 0.5 }}>
                  {tattooData.title}
                </Typography>
              )}

              {/* Description */}
              {(tattooData?.description || leadData?.description) && (
                <Typography sx={{
                  fontSize: '0.8rem', color: colors.textMuted, lineHeight: 1.5, mb: 1,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                  fontStyle: 'italic',
                }}>
                  "{tattooData?.description || leadData?.description}"
                </Typography>
              )}

              {/* Timing badge */}
              {leadData?.timing && (
                <Chip
                  icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
                  label={timingLabels[leadData.timing] || leadData.timing}
                  size="small"
                  sx={{ mb: 1, height: 24, fontSize: '0.72rem', bgcolor: colors.seekingDim, color: colors.seeking, '& .MuiChip-icon': { color: colors.seeking } }}
                />
              )}

              {/* Notified / responses row */}
              {(artistsNotified > 0 || consultationCount > 0) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  {artistsNotified > 0 && (
                    <Typography sx={{ fontSize: '0.72rem', color: colors.textMuted }}>
                      {artistsNotified} artist{artistsNotified === 1 ? '' : 's'} notified
                    </Typography>
                  )}
                  {consultationCount > 0 && (
                    <Button
                      onClick={() => router.push('/inbox')}
                      size="small"
                      startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 13 }} />}
                      sx={{
                        px: 1, py: 0, minHeight: 0,
                        fontSize: '0.72rem', textTransform: 'none',
                        color: colors.seeking, fontWeight: 600,
                        '&:hover': { bgcolor: colors.seekingDim },
                      }}
                    >
                      {consultationCount} response{consultationCount === 1 ? '' : 's'}
                    </Button>
                  )}
                </Box>
              )}

              {/* Action buttons */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    onClick={() => setTattooModalOpen(true)}
                    size="small"
                    startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                    sx={{
                      px: 1.5, py: 0.5, fontSize: '0.72rem', textTransform: 'none',
                      color: colors.textPrimary, border: `1px solid ${colors.border}`,
                      borderRadius: '6px', fontWeight: 500,
                      '&:hover': { borderColor: colors.accent, color: colors.accent },
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={handleEditPreferences}
                    size="small"
                    sx={{
                      px: 1.5, py: 0.5, fontSize: '0.72rem', textTransform: 'none',
                      color: colors.textPrimary, border: `1px solid ${colors.border}`,
                      borderRadius: '6px', fontWeight: 500,
                      '&:hover': { borderColor: colors.accent, color: colors.accent },
                    }}
                  >
                    Preferences
                  </Button>
                  {consultationCount > 0 && (
                    <Button
                      onClick={() => router.push('/inbox')}
                      size="small"
                      startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 14 }} />}
                      sx={{
                        px: 1.5, py: 0.5, fontSize: '0.72rem', textTransform: 'none',
                        color: colors.seeking, border: `1px solid ${colors.seeking}`,
                        borderRadius: '6px', fontWeight: 600,
                        '&:hover': { bgcolor: colors.seeking, color: colors.background },
                      }}
                    >
                      View Responses
                    </Button>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {leadToggling && <CircularProgress size={14} sx={{ color: colors.accent }} />}
                  <Switch
                    checked={leadActive}
                    onChange={handleLeadToggle}
                    disabled={leadToggling}
                    size="small"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: colors.accent },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.accent },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        ) : (
          /* Active text-only (no linked tattoo) */
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, textAlign: 'center' }}>
            {(leadData?.description) && (
              <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted, mb: 0.5, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {leadData.description}
              </Typography>
            )}
            {leadData?.timing && (
              <Chip
                icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
                label={timingLabels[leadData.timing] || leadData.timing}
                size="small"
                sx={{ mb: 1, height: 22, fontSize: '0.7rem', bgcolor: `${colors.accent}15`, color: colors.accent, '& .MuiChip-icon': { color: colors.accent } }}
              />
            )}
            <Typography sx={{ fontWeight: 500, color: leadActive ? colors.accent : colors.textPrimary, mb: 0.5 }}>
              Looking for a Tattoo
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted, mb: 1, lineHeight: 1.4 }}>
              {artistsNotified > 0
                ? `${artistsNotified} artist${artistsNotified === 1 ? '' : 's'} in your area notified`
                : 'Artists in your area can reach out to you'}
            </Typography>

            {consultationCount > 0 && (
              <Button
                onClick={() => router.push('/inbox')}
                size="small"
                startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 14 }} />}
                sx={{
                  mb: 1, px: 1.5, py: 0.25,
                  fontSize: '0.75rem', textTransform: 'none',
                  color: colors.accent, fontWeight: 500,
                  '&:hover': { bgcolor: `${colors.accent}10` },
                }}
              >
                {consultationCount} artist response{consultationCount === 1 ? '' : 's'}
              </Button>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {leadToggling && <CircularProgress size={16} sx={{ color: colors.accent }} />}
              <Switch
                checked={leadActive}
                onChange={handleLeadToggle}
                disabled={leadToggling}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: colors.accent },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.accent },
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={handleEditLead}
                size="small"
                startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                sx={{
                  px: 2, py: 0.5, fontSize: '0.75rem', textTransform: 'none',
                  color: colors.accent, border: `1px solid ${colors.accent}`,
                  borderRadius: '6px', fontWeight: 500,
                  '&:hover': { bgcolor: colors.accent, color: colors.background },
                }}
              >
                Edit
              </Button>
              <Button
                onClick={() => setUploadWizardOpen(true)}
                size="small"
                startIcon={<AddAPhotoIcon sx={{ fontSize: 14 }} />}
                sx={{
                  px: 2, py: 0.5, fontSize: '0.75rem', textTransform: 'none',
                  color: colors.textMuted, border: `1px solid ${colors.border}`,
                  borderRadius: '6px', fontWeight: 500,
                  '&:hover': { bgcolor: `${colors.accent}10`, color: colors.accent, borderColor: colors.accent },
                }}
              >
                Add Photos
              </Button>
            </Box>
            <Typography sx={{ fontSize: '0.65rem', color: colors.textMuted, mt: 1, fontStyle: 'italic' }}>
              Add reference photos to appear in the feed
            </Typography>
          </Box>
        )}
      </Card>

      {/* Choosing Dialog: "Do you have reference photos?" */}
      <Dialog
        open={choosingDialogOpen}
        onClose={handleFlowClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: colors.surface,
            backgroundImage: 'none',
            borderRadius: '16px',
            border: `1px solid ${colors.accent}50`,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 80px ${colors.accent}30`,
          }
        }}
      >
        <Box sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          p: 2, borderBottom: `1px solid ${colors.border}`,
        }}>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: colors.textPrimary }}>
            Do you have reference photos?
          </Typography>
          <IconButton onClick={handleFlowClose} sx={{ color: colors.textMuted, '&:hover': { color: colors.textPrimary } }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted, lineHeight: 1.5 }}>
            Posts with photos appear in the feed and get more artist responses. You can always add photos later.
          </Typography>
          <Button
            onClick={() => { setFlowState('closed'); setUploadWizardOpen(true); }}
            fullWidth
            startIcon={<AddAPhotoIcon />}
            sx={{
              py: 1.5, bgcolor: colors.accent, color: colors.background,
              borderRadius: '10px', textTransform: 'none', fontWeight: 600,
              fontSize: '0.95rem',
              '&:hover': { bgcolor: colors.accentHover },
            }}
          >
            Yes, add photos
          </Button>
          <Button
            onClick={() => setFlowState('text-only')}
            fullWidth
            sx={{
              py: 1.5, color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
              borderRadius: '10px', textTransform: 'none', fontWeight: 500,
              fontSize: '0.95rem',
              '&:hover': { bgcolor: `${colors.accent}10`, borderColor: colors.accent },
            }}
          >
            No, just describe it
          </Button>
        </Box>
      </Dialog>

      {/* TattooIntent Dialog (text-only flow or edit) */}
      <Dialog
        open={intentDialogOpen}
        onClose={handleFlowClose}
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
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          p: 2, borderBottom: `1px solid ${colors.border}`,
        }}>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: colors.textPrimary }}>
            {isEditingLead ? 'Edit your tattoo idea' : 'Tell us about your tattoo plans'}
          </Typography>
          <IconButton onClick={handleFlowClose} sx={{ color: colors.textMuted, '&:hover': { color: colors.textPrimary } }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <TattooIntent
              key={isEditingLead ? 'edit' : 'create'}
              onStepComplete={handleIntentSubmit}
              onBack={handleFlowClose}
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

      {/* ClientUploadWizard in seeking mode */}
      <ClientUploadWizard
        open={uploadWizardOpen}
        onClose={() => setUploadWizardOpen(false)}
        onSuccess={handleUploadSuccess}
        seekingMode
      />

      {/* TattooModal for editing linked tattoo */}
      {tattooModalOpen && tattooData && (
        <TattooModal
          tattooId={String(tattooData.id)}
          open={tattooModalOpen}
          onClose={() => setTattooModalOpen(false)}
          onSuccess={refreshStatus}
        />
      )}

      {/* Success Snackbar */}
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
    </>
  );
}

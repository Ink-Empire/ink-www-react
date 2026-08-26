import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, IconButton, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PushPinIcon from '@mui/icons-material/PushPin';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { colors } from '@/styles/colors';
import { studioService } from '@/services/studioService';

type SpotlightType = 'artist' | 'tattoo';

interface Spotlight {
  id: number;
  type: SpotlightType;
  item_id: number;
  display_order: number;
  item?: any;
}

interface SpotlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  studioId: number;
  studioSlug?: string;
  artists: any[];
  onChanged?: () => void;
}

/**
 * Lets a studio owner pin artists and tattoos to the top of their public page.
 * Tattoos come from the studio gallery, which is only fetched once the tab is
 * opened - the dashboard does not otherwise need it.
 */
const SpotlightModal: React.FC<SpotlightModalProps> = ({
  isOpen,
  onClose,
  studioId,
  studioSlug,
  artists,
  onChanged,
}) => {
  const [activeTab, setActiveTab] = useState<SpotlightType>('artist');
  const [spotlights, setSpotlights] = useState<Spotlight[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [loadingSpotlights, setLoadingSpotlights] = useState(false);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifiedArtists = artists.filter((a: any) => a.is_verified);

  const loadSpotlights = useCallback(async () => {
    if (!studioId) return;
    setLoadingSpotlights(true);
    try {
      setSpotlights(await studioService.getSpotlights(studioId));
      setError(null);
    } catch {
      setError('Could not load your spotlights.');
    } finally {
      setLoadingSpotlights(false);
    }
  }, [studioId]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('artist');
      loadSpotlights();
    }
  }, [isOpen, loadSpotlights]);

  // The gallery is only worth fetching once the tattoos tab is actually opened.
  useEffect(() => {
    if (!isOpen || activeTab !== 'tattoo' || gallery.length > 0 || loadingGallery) return;

    const identifier = studioSlug || studioId;
    if (!identifier) return;

    setLoadingGallery(true);
    studioService
      .getGallery(identifier)
      .then(setGallery)
      .catch(() => setError('Could not load your portfolio.'))
      .finally(() => setLoadingGallery(false));
  }, [isOpen, activeTab, gallery.length, loadingGallery, studioId, studioSlug]);

  const spotlightFor = (type: SpotlightType, itemId: number) =>
    spotlights.find((s) => s.type === type && Number(s.item_id) === Number(itemId));

  const handleToggle = async (type: SpotlightType, itemId: number) => {
    const key = `${type}-${itemId}`;
    const existing = spotlightFor(type, itemId);

    setPendingId(key);
    setError(null);

    try {
      if (existing) {
        await studioService.removeSpotlight(studioId, existing.id);
        setSpotlights((prev) => prev.filter((s) => s.id !== existing.id));
        onChanged?.();
      } else {
        await studioService.addSpotlight(studioId, {
          type,
          item_id: itemId,
          display_order: spotlights.length,
        });
        await loadSpotlights();
        onChanged?.();
      }
    } catch {
      setError('That did not save. Try again.');
    } finally {
      setPendingId(null);
    }
  };

  if (!isOpen) return null;

  const tabs: { key: SpotlightType; label: string }[] = [
    { key: 'artist', label: 'Artists' },
    { key: 'tattoo', label: 'Tattoos' },
  ];

  const renderCard = (
    type: SpotlightType,
    itemId: number,
    imageUri: string | undefined,
    label: string,
    caption: string,
  ) => {
    const key = `${type}-${itemId}`;
    const isPinned = Boolean(spotlightFor(type, itemId));
    const isPending = pendingId === key;

    return (
      <Box
        key={key}
        onClick={() => !isPending && handleToggle(type, itemId)}
        sx={{
          position: 'relative',
          cursor: isPending ? 'default' : 'pointer',
          borderRadius: '10px',
          overflow: 'hidden',
          bgcolor: colors.background,
          border: `1px solid ${isPinned ? colors.accent : colors.border}`,
          opacity: isPending ? 0.6 : 1,
          transition: 'border-color 0.2s, opacity 0.2s',
          '&:hover': { borderColor: colors.accent },
        }}
      >
        <Box sx={{
          width: '100%',
          height: 110,
          bgcolor: colors.surface,
          backgroundImage: imageUri ? `url(${imageUri})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.accent,
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontSize: '1.5rem',
        }}>
          {!imageUri && (label?.substring(0, 2).toUpperCase() || '--')}
        </Box>

        {isPinned && (
          <Box sx={{
            position: 'absolute',
            top: 6,
            right: 6,
            bgcolor: colors.accent,
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CheckCircleIcon sx={{ fontSize: 16, color: colors.background }} />
          </Box>
        )}

        <Box sx={{ p: 1 }}>
          <Typography noWrap sx={{ fontSize: '0.85rem', color: colors.textPrimary }}>
            {label}
          </Typography>
          <Typography noWrap sx={{ fontSize: '0.72rem', color: colors.textSecondary }}>
            {caption}
          </Typography>
        </Box>
      </Box>
    );
  };

  const isLoading = activeTab === 'artist' ? loadingSpotlights : (loadingGallery || loadingSpotlights);
  const items = activeTab === 'artist' ? verifiedArtists : gallery;

  const emptyMessage = activeTab === 'artist'
    ? 'Verified artists at your studio will appear here.'
    : 'Tattoos uploaded by your artists will appear here.';

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(0, 0, 0, 0.7)',
      }}
      onClick={onClose}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 640,
          maxHeight: '90vh',
          bgcolor: colors.surface,
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <Box>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: colors.textPrimary }}>
              Spotlight
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
              Pin work and artists to the top of your studio page
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: colors.textSecondary }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', borderBottom: `1px solid ${colors.border}` }}>
          {tabs.map((tab) => (
            <Box
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              sx={{
                px: 2.5,
                py: 1.5,
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 500,
                color: activeTab === tab.key ? colors.accent : colors.textSecondary,
                borderBottom: activeTab === tab.key ? `2px solid ${colors.accent}` : '2px solid transparent',
                '&:hover': { color: colors.textPrimary },
              }}
            >
              {tab.label}
            </Box>
          ))}
        </Box>

        <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
          {error && (
            <Typography sx={{ fontSize: '0.85rem', color: colors.error, mb: 1.5 }}>
              {error}
            </Typography>
          )}

          {spotlights.length > 0 && (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              mb: 2,
              color: colors.textSecondary,
              fontSize: '0.82rem',
            }}>
              <PushPinIcon sx={{ fontSize: 15 }} />
              {spotlights.length} pinned. Select an item to pin or unpin it.
            </Box>
          )}

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} sx={{ color: colors.accent }} />
            </Box>
          ) : items.length === 0 ? (
            <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary, py: 3, textAlign: 'center' }}>
              {emptyMessage}
            </Typography>
          ) : (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
              gap: 1.5,
            }}>
              {activeTab === 'artist'
                ? verifiedArtists.map((artist: any) =>
                    renderCard('artist', artist.id, artist.image?.uri, artist.name || artist.username, 'Artist'))
                : gallery.map((tattoo: any) =>
                    renderCard('tattoo', tattoo.id, tattoo.primary_image?.uri, tattoo.title || 'Untitled', tattoo.primary_style || 'Tattoo'))}
            </Box>
          )}
        </Box>

        <Box sx={{ p: 2, borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            onClick={onClose}
            sx={{ color: colors.background, bgcolor: colors.accent, textTransform: 'none', px: 3 }}
          >
            Done
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default SpotlightModal;

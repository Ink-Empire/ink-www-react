import React, { useState } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { colors } from '@/styles/colors';

export interface SpotlightDraft {
  id?: number;
  type: 'artist' | 'tattoo';
  item_id: number;
  item?: any;
}

interface SpotlightEditorProps {
  value: SpotlightDraft[];
  artists: any[];
  gallery: any[];
  galleryLoading?: boolean;
  onChange: (value: SpotlightDraft[]) => void;
}

/**
 * Pick the artists and work that sit at the top of the page. Selections are
 * held here and applied on Publish, so nothing changes for visitors mid-edit.
 */
const SpotlightEditor: React.FC<SpotlightEditorProps> = ({
  value,
  artists,
  gallery,
  galleryLoading = false,
  onChange,
}) => {
  const [tab, setTab] = useState<'artist' | 'tattoo'>('artist');

  const isPinned = (type: 'artist' | 'tattoo', itemId: number) =>
    value.some((s) => s.type === type && Number(s.item_id) === Number(itemId));

  const toggle = (type: 'artist' | 'tattoo', item: any) => {
    if (isPinned(type, item.id)) {
      onChange(value.filter((s) => !(s.type === type && Number(s.item_id) === Number(item.id))));
      return;
    }
    onChange([...value, { type, item_id: item.id, item }]);
  };

  const verifiedArtists = artists.filter((a: any) => a.is_verified !== false);
  const items = tab === 'artist' ? verifiedArtists : gallery;
  const loading = tab === 'tattoo' && galleryLoading;

  const emptyMessage = tab === 'artist'
    ? 'Verified artists at your studio will appear here.'
    : 'Tattoos uploaded by your artists will appear here.';

  return (
    <Box>
      <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary, mb: 1.5 }}>
        {value.length > 0
          ? `${value.length} pinned. Select an item to pin or unpin it.`
          : 'Pick a few artists or tattoos to feature at the top of your page.'}
      </Typography>

      <Box sx={{ display: 'flex', borderBottom: `1px solid ${colors.border}`, mb: 2 }}>
        {(['artist', 'tattoo'] as const).map((key) => (
          <Box
            key={key}
            onClick={() => setTab(key)}
            sx={{
              px: 2.5,
              py: 1.25,
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              color: tab === key ? colors.accent : colors.textSecondary,
              borderBottom: tab === key ? `2px solid ${colors.accent}` : '2px solid transparent',
              '&:hover': { color: colors.textPrimary },
            }}
          >
            {key === 'artist' ? 'Artists' : 'Tattoos'}
          </Box>
        ))}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={22} sx={{ color: colors.accent }} />
        </Box>
      ) : items.length === 0 ? (
        <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary, py: 3, textAlign: 'center' }}>
          {emptyMessage}
        </Typography>
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(5, 1fr)' },
          gap: 1.5,
        }}>
          {items.map((item: any) => {
            const pinned = isPinned(tab, item.id);
            const uri = tab === 'artist' ? item.image?.uri : item.primary_image?.uri;
            const label = tab === 'artist' ? (item.name || item.username) : (item.title || 'Untitled');

            return (
              <Box
                key={`${tab}-${item.id}`}
                onClick={() => toggle(tab, item)}
                sx={{
                  position: 'relative',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: `1px solid ${pinned ? colors.accent : colors.border}`,
                  '&:hover': { borderColor: colors.accent },
                }}
              >
                <Box sx={{
                  width: '100%',
                  height: 88,
                  bgcolor: colors.background,
                  backgroundImage: uri ? `url(${uri})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.accent,
                }}>
                  {!uri && String(label).substring(0, 2).toUpperCase()}
                </Box>

                {pinned && (
                  <CheckCircleIcon sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    fontSize: 18,
                    color: colors.accent,
                    bgcolor: colors.background,
                    borderRadius: '50%',
                  }} />
                )}

                <Typography noWrap sx={{ p: 0.75, fontSize: '0.78rem', color: colors.textPrimary }}>
                  {label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}

      {value.length > 0 && (
        <Button
          onClick={() => onChange([])}
          size="small"
          sx={{ mt: 1.5, color: colors.textSecondary, textTransform: 'none' }}
        >
          Clear all
        </Button>
      )}
    </Box>
  );
};

export default SpotlightEditor;

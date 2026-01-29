import React from 'react';
import Link from 'next/link';
import { Box, Typography, Avatar, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { colors } from '@/styles/colors';
import { WishlistArtist } from '@/hooks/useClientDashboard';

interface SavedArtistCardProps {
  artist: WishlistArtist;
  onRemove: (id: number) => void;
}

export function SavedArtistCard({ artist, onRemove }: SavedArtistCardProps) {
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

export default SavedArtistCard;

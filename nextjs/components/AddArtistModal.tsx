import React, { useState } from 'react';
import { Box, Typography, TextField, Button, IconButton, CircularProgress, Avatar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { colors } from '@/styles/colors';
import { studioService } from '@/services/studioService';

interface Artist {
  id: number;
  name: string;
  username: string;
  image?: { uri?: string };
}

interface AddArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
  studioId: number;
  onArtistAdded: (artist: Artist) => void;
  currentArtists: Artist[];
}

const inputStyles = {
  '& .MuiOutlinedInput-root': {
    bgcolor: colors.background,
    color: colors.textPrimary,
    '& fieldset': { borderColor: colors.border },
    '&:hover fieldset': { borderColor: colors.borderLight },
    '&.Mui-focused fieldset': { borderColor: colors.accent },
  },
  '& .MuiInputLabel-root': { color: colors.textSecondary },
  '& .MuiInputLabel-root.Mui-focused': { color: colors.accent },
};

const AddArtistModal: React.FC<AddArtistModalProps> = ({
  isOpen,
  onClose,
  studioId,
  onArtistAdded,
  currentArtists,
}) => {
  const [username, setUsername] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    // Check if artist is already in the studio
    const alreadyAdded = currentArtists.some(
      a => a.username?.toLowerCase() === username.toLowerCase()
    );
    if (alreadyAdded) {
      setError('This artist is already at your studio');
      return;
    }

    setIsAdding(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await studioService.addArtist(studioId, username.trim());
      const artist = response.artist || response as unknown as Artist;

      setSuccess(`${artist.name || username} has been added to your studio!`);
      setUsername('');
      onArtistAdded(artist);

      // Auto close after success
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      if (err.status === 404 || err.message?.includes('not found')) {
        setError('No artist found with that username. Make sure they have an artist account.');
      } else {
        setError(err.message || 'Failed to add artist');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAdding) {
      handleAdd();
    }
  };

  if (!isOpen) return null;

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
          maxWidth: 420,
          bgcolor: colors.surface,
          borderRadius: '12px',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PersonAddIcon sx={{ color: colors.accent }} />
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: colors.textPrimary }}>
              Add Artist to Studio
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: colors.textSecondary }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem', mb: 2 }}>
            Enter the username or email of the artist you want to add to your studio. They must have an existing artist account on InkedIn.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              placeholder="Username or email"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(null);
              }}
              onKeyPress={handleKeyPress}
              fullWidth
              size="small"
              sx={inputStyles}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: colors.textMuted, mr: 1 }} />,
              }}
              autoFocus
            />
            <Button
              onClick={handleAdd}
              disabled={isAdding || !username.trim()}
              sx={{
                px: 3,
                bgcolor: colors.accent,
                color: colors.background,
                borderRadius: '6px',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': { bgcolor: colors.accentHover },
                '&:disabled': { bgcolor: colors.border, color: colors.textMuted },
              }}
            >
              {isAdding ? <CircularProgress size={20} sx={{ color: colors.background }} /> : 'Add'}
            </Button>
          </Box>

          {error && (
            <Typography sx={{ color: colors.error, fontSize: '0.85rem', mt: 2 }}>
              {error}
            </Typography>
          )}

          {success && (
            <Box sx={{
              mt: 2,
              p: 2,
              bgcolor: `${colors.success}20`,
              borderRadius: '8px',
              border: `1px solid ${colors.success}40`,
            }}>
              <Typography sx={{ color: colors.success, fontSize: '0.9rem' }}>
                {success}
              </Typography>
            </Box>
          )}

          {/* Current Artists Preview */}
          {currentArtists.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography sx={{ color: colors.textMuted, fontSize: '0.8rem', mb: 1 }}>
                Current studio artists ({currentArtists.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {currentArtists.slice(0, 5).map((artist) => (
                  <Box
                    key={artist.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 1.5,
                      py: 0.5,
                      bgcolor: colors.background,
                      borderRadius: '100px',
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <Avatar
                      src={artist.image?.uri}
                      sx={{ width: 20, height: 20, fontSize: '0.6rem' }}
                    >
                      {artist.name?.[0]}
                    </Avatar>
                    <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                      {artist.name || artist.username}
                    </Typography>
                  </Box>
                ))}
                {currentArtists.length > 5 && (
                  <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted, alignSelf: 'center' }}>
                    +{currentArtists.length - 5} more
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AddArtistModal;

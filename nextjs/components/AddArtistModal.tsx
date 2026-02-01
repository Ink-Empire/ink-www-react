import React, { useState } from 'react';
import { Box, Typography, TextField, Button, IconButton, CircularProgress, Avatar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { colors } from '@/styles/colors';
import { studioService } from '@/services/studioService';
import { artistService } from '@/services/artistService';

interface Artist {
  id: number;
  name: string;
  username: string;
  slug?: string;
  image?: { id?: number; uri?: string };
  studio?: { id: number; name: string };
  styles?: { id: number; name: string }[];
  books_open?: boolean;
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
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [foundArtist, setFoundArtist] = useState<Artist | null>(null);

  const resetState = () => {
    setUsername('');
    setError(null);
    setSuccess(null);
    setFoundArtist(null);
    setIsSearching(false);
    setIsAdding(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSearch = async () => {
    if (!username.trim()) {
      setError('Please enter a username or email');
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

    setIsSearching(true);
    setError(null);

    try {
      const response = await artistService.lookupByIdentifier(username.trim());
      if (response.artist) {
        // Check again with the actual username from API
        const alreadyAddedById = currentArtists.some(a => a.id === response.artist.id);
        if (alreadyAddedById) {
          setError('This artist is already at your studio');
          setIsSearching(false);
          return;
        }
        setFoundArtist(response.artist);
      }
    } catch (err: any) {
      if (err.status === 404) {
        setError('No artist found with that username or email. Make sure they have an artist account on InkedIn.');
      } else {
        setError(err.message || 'Failed to find artist');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmAdd = async () => {
    if (!foundArtist) return;

    setIsAdding(true);
    setError(null);

    try {
      const response = await studioService.addArtist(studioId, foundArtist.username);
      const artist = response.artist || response as unknown as Artist;

      setSuccess(`${artist.name || foundArtist.name} has been added to your studio!`);
      onArtistAdded(artist);

      // Auto close after success
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to add artist');
    } finally {
      setIsAdding(false);
    }
  };

  const handleBack = () => {
    setFoundArtist(null);
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching && !foundArtist) {
      handleSearch();
    }
  };

  if (!isOpen) return null;

  const artistInitials = foundArtist?.name
    ? foundArtist.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : foundArtist?.username?.slice(0, 2).toUpperCase() || 'AR';

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
      onClick={handleClose}
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
            {foundArtist && !success ? (
              <IconButton onClick={handleBack} sx={{ color: colors.textSecondary, p: 0.5, mr: 0.5 }}>
                <ArrowBackIcon sx={{ fontSize: 20 }} />
              </IconButton>
            ) : (
              <PersonAddIcon sx={{ color: colors.accent }} />
            )}
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: colors.textPrimary }}>
              {foundArtist ? 'Confirm Artist' : 'Add Artist to Studio'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: colors.textSecondary }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          {/* Success State */}
          {success ? (
            <Box sx={{
              textAlign: 'center',
              py: 2,
            }}>
              <CheckCircleIcon sx={{ fontSize: 48, color: colors.success, mb: 2 }} />
              <Typography sx={{ color: colors.success, fontSize: '1rem', fontWeight: 500 }}>
                {success}
              </Typography>
            </Box>
          ) : foundArtist ? (
            /* Confirmation Step */
            <>
              <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem', mb: 3, textAlign: 'center' }}>
                Is this the artist you want to add to your studio?
              </Typography>

              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                p: 3,
                bgcolor: colors.background,
                borderRadius: '12px',
                border: `1px solid ${colors.border}`,
                mb: 3,
              }}>
                <Avatar
                  src={foundArtist.image?.uri}
                  sx={{
                    width: 80,
                    height: 80,
                    mb: 2,
                    bgcolor: colors.surface,
                    color: colors.textSecondary,
                    fontSize: '1.5rem',
                    fontWeight: 600,
                  }}
                >
                  {artistInitials}
                </Avatar>
                <Typography sx={{ fontWeight: 600, color: colors.textPrimary, fontSize: '1.1rem' }}>
                  {foundArtist.name}
                </Typography>
                <Typography sx={{ color: colors.textMuted, fontSize: '0.9rem' }}>
                  @{foundArtist.username}
                </Typography>
              </Box>

              {error && (
                <Typography sx={{ color: colors.error, fontSize: '0.85rem', mb: 2, textAlign: 'center' }}>
                  {error}
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  onClick={handleBack}
                  fullWidth
                  sx={{
                    py: 1.25,
                    bgcolor: 'transparent',
                    border: `1px solid ${colors.border}`,
                    color: colors.textSecondary,
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': { borderColor: colors.textMuted, bgcolor: colors.background },
                  }}
                >
                  Search Again
                </Button>
                <Button
                  onClick={handleConfirmAdd}
                  disabled={isAdding}
                  fullWidth
                  sx={{
                    py: 1.25,
                    bgcolor: colors.accent,
                    color: colors.background,
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': { bgcolor: colors.accentHover },
                    '&:disabled': { bgcolor: colors.border, color: colors.textMuted },
                  }}
                >
                  {isAdding ? <CircularProgress size={20} sx={{ color: colors.background }} /> : 'Add to Studio'}
                </Button>
              </Box>
            </>
          ) : (
            /* Search Step */
            <>
              <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem', mb: 2 }}>
                Enter the username or email of the artist you want to add. They must have an existing artist account on InkedIn.
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
                  onClick={handleSearch}
                  disabled={isSearching || !username.trim()}
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
                  {isSearching ? <CircularProgress size={20} sx={{ color: colors.background }} /> : 'Find'}
                </Button>
              </Box>

              {error && (
                <Typography sx={{ color: colors.error, fontSize: '0.85rem', mt: 2 }}>
                  {error}
                </Typography>
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
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AddArtistModal;

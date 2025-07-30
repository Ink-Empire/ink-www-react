import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Avatar,
  Stack,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  LocationOn as LocationOnIcon,
  Palette as PaletteIcon,
  Tag as TagIcon
} from '@mui/icons-material';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTattoo } from '../hooks';

interface TattooModalProps {
  tattooId: string | null;
  open: boolean;
  onClose: () => void;
}

const TattooModal: React.FC<TattooModalProps> = ({ tattooId, open, onClose }) => {
  const { tattoo, loading, error } = useTattoo(tattooId);
  const router = useRouter();

  const handleClose = () => {
    onClose();
  };

  // Handle tag click - search for tattoos with this tag
  const handleTagClick = (tagName: string) => {
    // Close the modal first
    onClose();
    
    // Navigate to home page with search parameter
    router.push({
      pathname: '/',
      query: { searchString: tagName }
    });
  };

  // Handle style click - search for tattoos with this style
  const handleStyleClick = (styleName: string) => {
    // Close the modal first
    onClose();
    
    // Navigate to home page with style search parameter
    router.push({
      pathname: '/',
      query: { styleSearch: styleName }
    });
  };

  // Handle save/unsave tattoo
  const handleSaveTattoo = async () => {
    if (!tattooId) return;
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Redirect to login
      router.push('/login');
      return;
    }
    
    setIsLoading(true);
    try {
      if (isTattooSaved) {
        // Remove from favorites - using POST with _method override for Laravel
        await api.post(`/users/favorites/tattoo`, {
          tattoo_id: tattooId,
          _method: 'DELETE'
        }, {
          requiresAuth: true
        });
        setIsTattooSaved(false);
      } else {
        // Add to favorites
        await api.post(`/users/favorites/tattoo`, {
          tattoo_id: tattooId
        }, {
          requiresAuth: true
        });
        setIsTattooSaved(true);
      }
    } catch (error) {
      console.error('Error saving tattoo:', error);
      // TODO: Show error message to user
    } finally {
      setIsLoading(false);
    }
  };

  // Handle follow/unfollow artist
  const handleFollowArtist = async () => {
    if (!tattoo?.tattoo?.artist?.id) return;
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Redirect to login
      router.push('/login');
      return;
    }
    
    setIsLoading(true);
    try {
      if (isArtistFollowed) {
        // Unfollow artist - using POST with _method override for Laravel
        await api.post(`/users/favorites/artist`, {
          artist_id: tattoo.tattoo.artist.id,
          _method: 'DELETE'
        }, {
          requiresAuth: true
        });
        setIsArtistFollowed(false);
      } else {
        // Follow artist
        await api.post(`/users/favorites/artist`, {
          artist_id: tattoo.tattoo.artist.id
        }, {
          requiresAuth: true
        });
        setIsArtistFollowed(true);
      }
    } catch (error) {
      console.error('Error following artist:', error);
      // TODO: Show error message to user
    } finally {
      setIsLoading(false);
    }
  };

  // Get the primary image URI - access nested tattoo data
  const getPrimaryImageUri = () => {
    return tattoo?.tattoo?.primary_image?.uri || tattoo?.tattoo?.image?.uri || null;
  };

  // Get artist avatar URI  
  const getArtistAvatarUri = () => {
    return tattoo?.tattoo?.artist?.primary_image?.uri || tattoo?.tattoo?.artist?.image?.uri || null;
  };

  // Format styles for display - exclude primary style to avoid duplication
  const getStyleChips = () => {
    if (!tattoo?.tattoo?.styles || !Array.isArray(tattoo.tattoo.styles)) return null;
    
    const primaryStyleName = tattoo?.tattoo?.primary_style?.toLowerCase();
    
    return tattoo.tattoo.styles
      .map((style: any, index: number) => {
        const styleName = typeof style === 'string' ? style : style?.name || '';
        if (!styleName) return null;
        
        // Skip if this style matches the primary style (case insensitive)
        if (primaryStyleName && styleName.toLowerCase() === primaryStyleName) {
          return null;
        }
        
        return (
          <Chip
            key={index}
            label={styleName}
            size="small"
            variant="outlined"
            color="secondary"
            sx={{
              borderRadius: 1,
              fontSize: '0.75rem'
            }}
          />
        );
      })
      .filter(Boolean);
  };

  // Format tags for display
  const getTagChips = () => {
    if (!tattoo?.tattoo?.tags || !Array.isArray(tattoo.tattoo.tags)) return null;
    
    return tattoo.tattoo.tags.map((tag: any, index: number) => {
      const tagName = typeof tag === 'string' ? tag : tag?.tag || tag?.name || '';
      if (!tagName) return null;
      
      return (
        <Chip
          key={index}
          label={tagName}
          size="small"
          variant="filled"
          color="primary"
          clickable
          onClick={() => handleTagClick(tagName)}
          sx={{
            margin: 0.5,
            borderRadius: 1,
            fontSize: '0.7rem',
            backgroundColor: 'rgba(51, 153, 137, 0.1)',
            color: 'primary.main',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(51, 153, 137, 0.2)'
            }
          }}
        />
      );
    }).filter(Boolean);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      sx={{
        '& .MuiDialog-paper': {
          maxWidth: '90vw',
          maxHeight: '90vh',
          width: '1000px',
          height: '700px',
          margin: 0
        }
      }}
    >
      <DialogContent sx={{ p: 0, height: '100%' }}>
        {/* Close Button */}
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            zIndex: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>

        {loading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%'
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">
              Error loading tattoo: {error.message}
            </Alert>
          </Box>
        )}

        {tattoo && (
          <Box sx={{ display: 'flex', height: '100%' }}>
            {/* Left Side - Image */}
            <Box
              sx={{
                flex: '0 0 50%',
                position: 'relative',
                backgroundColor: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {getPrimaryImageUri() ? (
                <Image
                  src={getPrimaryImageUri()!}
                  alt={tattoo?.tattoo?.title || 'Tattoo'}
                  fill
                  style={{
                    objectFit: 'contain',
                    objectPosition: 'center'
                  }}
                />
              ) : (
                <Typography variant="h6" color="text.secondary">
                  No image available
                </Typography>
              )}
            </Box>

            {/* Right Side - Details */}
            <Box
              sx={{
                flex: '0 0 50%',
                p: 3,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'warmBeige.main'
              }}
            >
              {/* Artist Information */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {getArtistAvatarUri() && (
                    <Avatar
                      src={getArtistAvatarUri()!}
                      sx={{ width: 50, height: 50, mr: 2 }}
                    />
                  )}
                  <Box>
                    <Link
                      href={`/artists/${tattoo?.tattoo?.artist?.slug || tattoo?.tattoo?.artist?.id}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                      onClick={(e) => {
                        e.preventDefault(); // For now, prevent navigation
                        // TODO: Open artist modal or navigate as needed
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#000000',
                          '&:hover': { 
                            color: 'primary.main',
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {tattoo?.tattoo?.artist?.name || 'Unknown Artist'}
                      </Typography>
                    </Link>
                    {tattoo?.tattoo?.studio?.name && (
                      <Typography variant="body2" sx={{ color: '#000000' }}>
                        {tattoo.tattoo.studio.name}
                      </Typography>
                    )}
                    {tattoo?.tattoo?.studio?.location && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <LocationOnIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.9rem', color: '#000000' }} />
                        <Typography variant="body2" sx={{ color: '#000000' }} fontSize="0.8rem">
                          {tattoo.tattoo.studio.location}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ mb: 2, borderColor: '#000000' }} />

              {/* Tattoo Details */}
              <Box sx={{ flexGrow: 1 }}>

                {/* Description */}
                {tattoo?.tattoo?.description && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" sx={{ lineHeight: 1.6, color: '#000000' }}>
                      {tattoo.tattoo.description}
                    </Typography>
                  </Box>
                )}

                {/* Placement */}
                {tattoo?.tattoo?.placement && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, color: '#000000' }}>
                      Placement:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#000000' }}>
                      {tattoo.tattoo.placement}
                    </Typography>
                  </Box>
                )}

                {/* Combined Styles */}
                {(tattoo?.tattoo?.primary_style || (getStyleChips() && getStyleChips()!.length > 0)) && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                      {/* Primary Style - Highlighted */}
                      {tattoo?.tattoo?.primary_style && (
                        <Chip
                          label={tattoo.tattoo.primary_style}
                          color="primary"
                          size="small"
                          variant="filled"
                          clickable
                          onClick={() => handleStyleClick(tattoo.tattoo.primary_style)}
                          sx={{
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'rgba(51, 153, 137, 0.8)'
                            }
                          }}
                        />
                      )}
                      {/* Additional Styles - Outlined */}
                      {getStyleChips()}
                    </Box>
                  </Box>
                )}

                {/* Tags */}
                {getTagChips() && getTagChips()!.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {getTagChips()}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Action buttons or additional content can go here */}
              <Box sx={{ mt: 'auto', pt: 2 }}>
                {/* Future: Add favorite, share, contact artist buttons */}
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TattooModal;
import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, IconButton, Avatar, Skeleton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ShareIcon from '@mui/icons-material/Share';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTattoo } from '../hooks';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../contexts/AuthContext';
import { useImageCache } from '../contexts/ImageCacheContext';
import { colors } from '@/styles/colors';

interface TattooModalProps {
  tattooId: string | null;
  artistName: string | null;
  open: boolean;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  tattooFavorite?: boolean;
  artistFavorite?: boolean;
}

const TattooModal: React.FC<TattooModalProps> = ({
  tattooId,
  artistName,
  open,
  onClose,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  tattooFavorite = false,
  artistFavorite = false
}) => {
  const { tattoo, loading, error } = useTattoo(tattooId);
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const userData = useUserData();
  const { isImageCached, preloadImage } = useImageCache();

  const [isTattooLiked, setIsTattooLiked] = useState(false);
  const [isTattooSaved, setIsTattooSaved] = useState(tattooFavorite);
  const [isArtistFollowed, setIsArtistFollowed] = useState(artistFavorite);
  const [likeCount, setLikeCount] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Sync state with props
  useEffect(() => {
    setIsTattooSaved(tattooFavorite);
    setIsArtistFollowed(artistFavorite);
  }, [tattooFavorite, artistFavorite]);

  // Initialize like count from tattoo data and reset selected image
  useEffect(() => {
    if (tattoo?.likes_count) {
      setLikeCount(tattoo.likes_count);
    }
    // Reset to first image when tattoo changes
    setSelectedImageIndex(0);
    setImageLoaded(false);
  }, [tattoo]);

  // Check if current image is cached and set loaded state accordingly
  useEffect(() => {
    // Get current image from allImages based on selectedImageIndex
    // This needs to run after allImages is computed
    const checkCurrentImageCache = () => {
      const primaryUri = tattoo?.primary_image?.uri || tattoo?.image?.uri;
      let currentUri = primaryUri;

      // Check images array if available
      if (tattoo?.images && Array.isArray(tattoo.images) && tattoo.images.length > 0) {
        const img = tattoo.images[selectedImageIndex];
        if (img) {
          currentUri = typeof img === 'string' ? img : img?.uri;
        }
      }

      if (currentUri && isImageCached(currentUri)) {
        setImageLoaded(true);
      } else {
        setImageLoaded(false);
      }
    };

    checkCurrentImageCache();
  }, [tattoo, selectedImageIndex, isImageCached]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowLeft' && hasPrevious && onPrevious) {
        onPrevious();
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        onNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, hasPrevious, hasNext, onPrevious, onNext, onClose]);

  const handleLikeTattoo = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setIsTattooLiked(!isTattooLiked);
    setLikeCount(prev => isTattooLiked ? prev - 1 : prev + 1);
  };

  const handleSaveTattoo = async () => {
    if (!tattooId) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    try {
      await userData?.toggleFavorite('tattoo', parseInt(tattooId));
      setIsTattooSaved(!isTattooSaved);
    } catch (error) {
      console.error('Error saving tattoo:', error);
    }
  };

  const handleFollowArtist = async () => {
    if (!tattoo?.artist_id) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    try {
      await userData?.toggleFavorite('artist', tattoo.artist_id);
      setIsArtistFollowed(!isArtistFollowed);
    } catch (error) {
      console.error('Error following artist:', error);
    }
  };

  const handleTagClick = (tagName: string) => {
    onClose();
    router.push({ pathname: '/tattoos', query: { tag: tagName } });
  };

  const handleStyleClick = (styleName: string) => {
    onClose();
    router.push({ pathname: '/tattoos', query: { style: styleName } });
  };

  const getPrimaryImageUri = () => {
    return tattoo?.primary_image?.uri || tattoo?.image?.uri || null;
  };

  // Get all images for the tattoo (images array, falling back to primary_image)
  const getAllImages = () => {
    const images: { uri: string }[] = [];

    // Add images from the images array
    if (tattoo?.images && Array.isArray(tattoo.images)) {
      tattoo.images.forEach((img: any) => {
        const uri = typeof img === 'string' ? img : img?.uri;
        if (uri) {
          images.push({ uri });
        }
      });
    }

    // If no images found, try primary_image
    if (images.length === 0) {
      const primaryUri = getPrimaryImageUri();
      if (primaryUri) {
        images.push({ uri: primaryUri });
      }
    }

    return images;
  };

  const allImages = tattoo ? getAllImages() : [];
  const currentImageUri = allImages[selectedImageIndex]?.uri || getPrimaryImageUri();

  const getArtistAvatarUri = () => {
    return tattoo?.artist_image_uri || null;
  };

  const getArtistInitials = () => {
    const name = tattoo?.artist_name || '';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.name) {
      return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'ME';
  };

  const getArtistLocation = () => {
    const studio = tattoo?.studio?.name;
    const location = tattoo?.studio?.location;
    if (studio && location) return `${studio} · ${location}`;
    return studio || location || '';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Common styles
  const surfaceElevated = '#242424';
  const borderSubtle = 'rgba(245, 244, 240, 0.06)';
  const borderLight = 'rgba(245, 244, 240, 0.1)';
  const accentDim = 'rgba(201, 169, 98, 0.15)';

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: '1rem',
      }}
    >
      <Box sx={{ outline: 'none', width: '100%', maxWidth: '1100px' }}>
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            width: 44,
            height: 44,
            bgcolor: colors.surface,
            border: `1px solid ${colors.accent}`,
            color: colors.accent,
            zIndex: 1010,
            '&:hover': {
              bgcolor: colors.accent,
              color: colors.background,
            },
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Navigation Arrows */}
        {hasPrevious && onPrevious && (
          <IconButton
            onClick={onPrevious}
            sx={{
              position: 'fixed',
              left: '1.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 48,
              height: 48,
              bgcolor: colors.surface,
              border: `1px solid ${borderLight}`,
              color: colors.textPrimary,
              zIndex: 1010,
              display: { xs: 'none', md: 'flex' },
              '&:hover': {
                borderColor: colors.accent,
                color: colors.accent,
              },
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        )}

        {hasNext && onNext && (
          <IconButton
            onClick={onNext}
            sx={{
              position: 'fixed',
              right: '1.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 48,
              height: 48,
              bgcolor: colors.surface,
              border: `1px solid ${borderLight}`,
              color: colors.textPrimary,
              zIndex: 1010,
              display: { xs: 'none', md: 'flex' },
              '&:hover': {
                borderColor: colors.accent,
                color: colors.accent,
              },
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        )}

        {/* Modal Content */}
        <Box
          sx={{
            bgcolor: colors.surface,
            borderRadius: '12px',
            border: `1px solid ${borderSubtle}`,
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            overflow: 'hidden',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Image Section */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              bgcolor: colors.background,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              maxWidth: { xs: '100%', md: '55%' },
              maxHeight: { xs: '50vh', md: '90vh' },
            }}
          >
            {loading ? (
              <Skeleton
                variant="rectangular"
                sx={{
                  width: '100%',
                  height: '100%',
                  minHeight: { xs: '300px', md: '500px' },
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                }}
              />
            ) : currentImageUri ? (
              <>
                {/* Main Image */}
                <Box sx={{ position: 'relative', width: '100%', height: '100%', minHeight: { xs: '300px', md: '500px' } }}>
                  {/* Show skeleton while image loads (unless already cached) */}
                  {!imageLoaded && (
                    <Skeleton
                      variant="rectangular"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        zIndex: 1,
                      }}
                    />
                  )}
                  <Image
                    src={currentImageUri}
                    alt={tattoo?.title || 'Tattoo'}
                    fill
                    priority
                    style={{
                      objectFit: 'contain',
                      opacity: imageLoaded ? 1 : 0,
                      transition: 'opacity 0.2s ease-in-out',
                    }}
                    onLoad={() => {
                      setImageLoaded(true);
                      // Also register in cache for future reference
                      preloadImage(currentImageUri);
                    }}
                  />
                </Box>

                {/* Carousel Navigation - only show if more than 1 image */}
                {allImages.length > 1 && (
                  <>
                    {/* Previous Arrow */}
                    <IconButton
                      onClick={() => setSelectedImageIndex(prev => prev > 0 ? prev - 1 : allImages.length - 1)}
                      sx={{
                        position: 'absolute',
                        left: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 40,
                        height: 40,
                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                        color: colors.textPrimary,
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.7)',
                        },
                      }}
                    >
                      <ChevronLeftIcon />
                    </IconButton>

                    {/* Next Arrow */}
                    <IconButton
                      onClick={() => setSelectedImageIndex(prev => prev < allImages.length - 1 ? prev + 1 : 0)}
                      sx={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 40,
                        height: 40,
                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                        color: colors.textPrimary,
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.7)',
                        },
                      }}
                    >
                      <ChevronRightIcon />
                    </IconButton>

                    {/* Dot Indicators */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: '1rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '0.5rem',
                      }}
                    >
                      {allImages.map((_, index) => (
                        <Box
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: index === selectedImageIndex ? colors.accent : 'rgba(255, 255, 255, 0.5)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: index === selectedImageIndex ? colors.accent : 'rgba(255, 255, 255, 0.8)',
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </>
                )}
              </>
            ) : (
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '3/4',
                  background: `linear-gradient(135deg, ${surfaceElevated} 0%, ${colors.surface} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.textSecondary,
                }}
              >
                No image available
              </Box>
            )}
          </Box>

          {/* Content Section */}
          <Box
            sx={{
              width: { xs: '100%', md: '400px' },
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: { xs: 'none', md: '90vh' },
              overflow: 'hidden',
            }}
          >
            {/* Content Header - Artist Row */}
            <Box
              sx={{
                p: '1.5rem',
                borderBottom: `1px solid ${borderSubtle}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {/* Artist Avatar */}
                <Avatar
                  src={getArtistAvatarUri() || undefined}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: surfaceElevated,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: colors.accent,
                  }}
                >
                  {!getArtistAvatarUri() && getArtistInitials()}
                </Avatar>

                {/* Artist Info */}
                <Box sx={{ flex: 1 }}>
                  <Typography
                    component={Link}
                    href={`/artists/${tattoo?.artist_slug || tattoo?.artist_id}`}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      color: colors.textPrimary,
                      textDecoration: 'none',
                      '&:hover': { color: colors.accent },
                    }}
                  >
                    {artistName || tattoo?.artist_name || 'Unknown Artist'}
                  </Typography>
                  {getArtistLocation() && (
                    <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                      {getArtistLocation()}
                    </Typography>
                  )}
                </Box>

                {/* Follow Button */}
                <Box
                  component="button"
                  onClick={handleFollowArtist}
                  sx={{
                    px: '1rem',
                    py: '0.4rem',
                    bgcolor: isArtistFollowed ? accentDim : 'transparent',
                    border: `1px solid ${colors.accent}`,
                    borderRadius: '100px',
                    color: colors.accent,
                    fontFamily: 'inherit',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: colors.accent,
                      color: colors.background,
                    },
                  }}
                >
                  {isArtistFollowed ? 'Following' : 'Follow'}
                </Box>
              </Box>
            </Box>

            {/* Scrollable Content */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: '1.5rem',
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': {
                  background: surfaceElevated,
                  borderRadius: 3,
                },
              }}
            >
              {/* Tags */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', mb: '0.75rem' }}>
                {/* Style Tags (Gold) */}
                {tattoo?.primary_style && (
                  <Box
                    component="span"
                    onClick={() => handleStyleClick(tattoo.primary_style)}
                    sx={{
                      px: '0.75rem',
                      py: '0.3rem',
                      bgcolor: accentDim,
                      border: '1px solid rgba(201, 169, 98, 0.3)',
                      borderRadius: '100px',
                      fontSize: '0.75rem',
                      color: colors.accent,
                      cursor: 'pointer',
                      '&:hover': { borderColor: colors.accent },
                    }}
                  >
                    {tattoo.primary_style}
                  </Box>
                )}
                {tattoo?.styles?.map((style: any, index: number) => {
                  const styleName = typeof style === 'string' ? style : style?.name;
                  if (!styleName || styleName === tattoo?.primary_style) return null;
                  return (
                    <Box
                      key={index}
                      component="span"
                      onClick={() => handleStyleClick(styleName)}
                      sx={{
                        px: '0.75rem',
                        py: '0.3rem',
                        bgcolor: accentDim,
                        border: '1px solid rgba(201, 169, 98, 0.3)',
                        borderRadius: '100px',
                        fontSize: '0.75rem',
                        color: colors.accent,
                        cursor: 'pointer',
                        '&:hover': { borderColor: colors.accent },
                      }}
                    >
                      {styleName}
                    </Box>
                  );
                })}

                {/* Subject Tags (Red/Coral) */}
                {tattoo?.tags?.map((tag: any, index: number) => {
                  const tagName = typeof tag === 'string' ? tag : tag?.tag || tag?.name;
                  if (!tagName) return null;
                  return (
                    <Box
                      key={`tag-${index}`}
                      component="span"
                      onClick={() => handleTagClick(tagName)}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        px: '0.75rem',
                        py: '0.3rem',
                        bgcolor: colors.tagDim,
                        border: `1px solid rgba(199, 93, 93, 0.3)`,
                        borderRadius: '100px',
                        fontSize: '0.75rem',
                        color: colors.tag,
                        cursor: 'pointer',
                        '&:hover': { borderColor: colors.tag },
                      }}
                    >
                      <LocalOfferIcon sx={{ fontSize: 12 }} />
                      {tagName}
                    </Box>
                  );
                })}
              </Box>

              {/* Title */}
              {tattoo?.title && (
                <Typography
                  sx={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: '1.75rem',
                    fontWeight: 600,
                    mb: '0.5rem',
                    lineHeight: 1.2,
                    color: colors.textPrimary,
                  }}
                >
                  {tattoo.title}
                </Typography>
              )}

              {/* Description */}
              {tattoo?.description && (
                <Typography
                  sx={{
                    color: colors.textSecondary,
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    mb: '1.25rem',
                  }}
                >
                  {tattoo.description}
                </Typography>
              )}

              {/* Actions Row */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  pb: '1.25rem',
                  borderBottom: `1px solid ${borderSubtle}`,
                  mb: '1.25rem',
                  flexWrap: 'wrap',
                }}
              >
                {/* Like Button */}
                <Box
                  component="button"
                  onClick={handleLikeTattoo}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    px: '0.875rem',
                    py: '0.5rem',
                    bgcolor: isTattooLiked ? accentDim : surfaceElevated,
                    border: `1px solid ${isTattooLiked ? colors.accent : borderLight}`,
                    borderRadius: '6px',
                    color: isTattooLiked ? colors.accent : colors.textSecondary,
                    fontFamily: 'inherit',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: colors.accent,
                      color: colors.accent,
                    },
                  }}
                >
                  {isTattooLiked ? (
                    <FavoriteIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <FavoriteBorderIcon sx={{ fontSize: 18 }} />
                  )}
                  <span>{likeCount || ''}</span>
                </Box>

                {/* Save Button */}
                <Box
                  component="button"
                  onClick={handleSaveTattoo}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    px: '0.875rem',
                    py: '0.5rem',
                    bgcolor: isTattooSaved ? accentDim : surfaceElevated,
                    border: `1px solid ${isTattooSaved ? colors.accent : borderLight}`,
                    borderRadius: '6px',
                    color: isTattooSaved ? colors.accent : colors.textSecondary,
                    fontFamily: 'inherit',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: colors.accent,
                      color: colors.accent,
                    },
                  }}
                >
                  {isTattooSaved ? (
                    <BookmarkIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <BookmarkBorderIcon sx={{ fontSize: 18 }} />
                  )}
                  <span>{isTattooSaved ? 'Saved' : 'Save'}</span>
                </Box>

                {/* Share Button */}
                <Box
                  component="button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: tattoo?.title || 'Tattoo',
                        url: window.location.href,
                      });
                    }
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    px: '0.875rem',
                    py: '0.5rem',
                    bgcolor: surfaceElevated,
                    border: `1px solid ${borderLight}`,
                    borderRadius: '6px',
                    color: colors.textSecondary,
                    fontFamily: 'inherit',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: colors.accent,
                      color: colors.accent,
                    },
                  }}
                >
                  <ShareIcon sx={{ fontSize: 18 }} />
                  <span>Share</span>
                </Box>

                <Box sx={{ flex: 1 }} />

                {/* More Button */}
                <Box
                  component="button"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: '0.5rem',
                    py: '0.5rem',
                    bgcolor: surfaceElevated,
                    border: `1px solid ${borderLight}`,
                    borderRadius: '6px',
                    color: colors.textSecondary,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: colors.accent,
                      color: colors.accent,
                    },
                  }}
                >
                  <MoreHorizIcon sx={{ fontSize: 18 }} />
                </Box>
              </Box>

              {/* Details Section */}
              {(tattoo?.placement || tattoo?.duration) && (
                <Box sx={{ mb: '1.5rem' }}>
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: colors.textSecondary,
                      mb: '0.75rem',
                    }}
                  >
                    Details
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {tattoo?.placement && (
                      <Typography sx={{ fontSize: '0.9rem', color: colors.textPrimary }}>
                        <Box component="span" sx={{ color: colors.textSecondary }}>Placement:</Box>{' '}
                        <Box component="span" sx={{ textTransform: 'capitalize' }}>{tattoo.placement}</Box>
                      </Typography>
                    )}

                    {tattoo?.duration && (
                      <Typography sx={{ fontSize: '0.9rem', color: colors.textPrimary }}>
                        <Box component="span" sx={{ color: colors.textSecondary }}>Duration:</Box>{' '}
                        {tattoo.duration} {tattoo.duration === 1 ? 'hour' : 'hours'}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* Comments Section */}
              <Box
                sx={{
                  borderTop: `1px solid ${borderSubtle}`,
                  pt: '1.25rem',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '1rem' }}>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: colors.textPrimary }}>
                    {tattoo?.comments_count || 0} Comments
                  </Typography>
                </Box>

                {/* Comment Input */}
                <Box sx={{ display: 'flex', gap: '0.75rem', mb: '1rem' }}>
                  <Avatar
                    src={typeof user?.image === 'string' ? user.image : user?.image?.uri || undefined}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: surfaceElevated,
                      fontSize: '0.75rem',
                      color: colors.accent,
                    }}
                  >
                    {!(typeof user?.image === 'string' ? user.image : user?.image?.uri) && getUserInitials()}
                  </Avatar>
                  <Box
                    component="input"
                    placeholder="Add a comment..."
                    sx={{
                      flex: 1,
                      px: '0.875rem',
                      py: '0.6rem',
                      bgcolor: colors.background,
                      border: `1px solid ${borderLight}`,
                      borderRadius: '8px',
                      color: colors.textPrimary,
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                      outline: 'none',
                      '&::placeholder': { color: colors.textSecondary },
                      '&:focus': { borderColor: colors.accent },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default TattooModal;

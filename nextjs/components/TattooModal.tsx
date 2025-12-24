import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, IconButton, Avatar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ShareIcon from '@mui/icons-material/Share';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTattoo } from '../hooks';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../contexts/AuthContext';
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

  const [isTattooLiked, setIsTattooLiked] = useState(false);
  const [isTattooSaved, setIsTattooSaved] = useState(tattooFavorite);
  const [isArtistFollowed, setIsArtistFollowed] = useState(artistFavorite);
  const [likeCount, setLikeCount] = useState(0);

  // Sync state with props
  useEffect(() => {
    setIsTattooSaved(tattooFavorite);
    setIsArtistFollowed(artistFavorite);
  }, [tattooFavorite, artistFavorite]);

  // Initialize like count from tattoo data
  useEffect(() => {
    if (tattoo?.likes_count) {
      setLikeCount(tattoo.likes_count);
    }
  }, [tattoo]);

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
    if (!tattoo?.artist?.id) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    try {
      await userData?.toggleFavorite('artist', tattoo.artist.id);
      setIsArtistFollowed(!isArtistFollowed);
    } catch (error) {
      console.error('Error following artist:', error);
    }
  };

  const handleTagClick = (tagName: string) => {
    onClose();
    router.push({ pathname: '/tattoos', query: { search: tagName } });
  };

  const handleStyleClick = (styleName: string) => {
    onClose();
    router.push({ pathname: '/tattoos', query: { style: styleName } });
  };

  const handleRequestDesign = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    // Navigate to artist page with message intent
    const artistSlug = tattoo?.artist?.slug || tattoo?.artist?.id;
    if (artistSlug) {
      onClose();
      router.push(`/artists/${artistSlug}?action=message`);
    }
  };

  const getPrimaryImageUri = () => {
    return tattoo?.primary_image?.uri || tattoo?.image?.uri || null;
  };

  const getArtistAvatarUri = () => {
    return tattoo?.artist?.primary_image?.uri || tattoo?.artist?.image?.uri || null;
  };

  const getArtistInitials = () => {
    const name = tattoo?.artist?.name || '';
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
    const location = tattoo?.studio?.location || tattoo?.artist?.location;
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
              <Box sx={{ color: colors.textSecondary }}>Loading...</Box>
            ) : getPrimaryImageUri() ? (
              <Box sx={{ position: 'relative', width: '100%', height: '100%', minHeight: { xs: '300px', md: '500px' } }}>
                <Image
                  src={getPrimaryImageUri()!}
                  alt={tattoo?.title || 'Tattoo'}
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </Box>
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
                    href={`/artists/${tattoo?.artist?.slug || tattoo?.artist?.id}`}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      color: colors.textPrimary,
                      textDecoration: 'none',
                      '&:hover': { color: colors.accent },
                    }}
                  >
                    {artistName || tattoo?.artist?.name || 'Unknown Artist'}
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

                {/* Subject Tags (Gray) */}
                {tattoo?.tags?.map((tag: any, index: number) => {
                  const tagName = typeof tag === 'string' ? tag : tag?.tag || tag?.name;
                  if (!tagName) return null;
                  return (
                    <Box
                      key={`tag-${index}`}
                      component="span"
                      onClick={() => handleTagClick(tagName)}
                      sx={{
                        px: '0.75rem',
                        py: '0.3rem',
                        bgcolor: surfaceElevated,
                        border: `1px solid ${borderLight}`,
                        borderRadius: '100px',
                        fontSize: '0.75rem',
                        color: colors.textSecondary,
                        cursor: 'pointer',
                        '&:hover': { borderColor: colors.accent, color: colors.accent },
                      }}
                    >
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
              {(tattoo?.placement || tattoo?.size || tattoo?.sessions || tattoo?.created_at) && (
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

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: '0.75rem',
                    }}
                  >
                    {tattoo?.placement && (
                      <Box sx={{ bgcolor: colors.background, p: '0.75rem', borderRadius: '6px' }}>
                        <Typography sx={{ fontSize: '0.75rem', color: colors.textSecondary, mb: '0.2rem' }}>
                          Placement
                        </Typography>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: colors.textPrimary }}>
                          {tattoo.placement}
                        </Typography>
                      </Box>
                    )}

                    {tattoo?.size && (
                      <Box sx={{ bgcolor: colors.background, p: '0.75rem', borderRadius: '6px' }}>
                        <Typography sx={{ fontSize: '0.75rem', color: colors.textSecondary, mb: '0.2rem' }}>
                          Size
                        </Typography>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: colors.textPrimary }}>
                          {tattoo.size}
                        </Typography>
                      </Box>
                    )}

                    {tattoo?.sessions && (
                      <Box sx={{ bgcolor: colors.background, p: '0.75rem', borderRadius: '6px' }}>
                        <Typography sx={{ fontSize: '0.75rem', color: colors.textSecondary, mb: '0.2rem' }}>
                          Sessions
                        </Typography>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: colors.textPrimary }}>
                          {tattoo.sessions} {tattoo.sessions === 1 ? 'session' : 'sessions'}
                        </Typography>
                      </Box>
                    )}

                    {tattoo?.created_at && (
                      <Box sx={{ bgcolor: colors.background, p: '0.75rem', borderRadius: '6px' }}>
                        <Typography sx={{ fontSize: '0.75rem', color: colors.textSecondary, mb: '0.2rem' }}>
                          Completed
                        </Typography>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: colors.textPrimary }}>
                          {formatDate(tattoo.created_at)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {/* CTA Button */}
              <Box sx={{ mb: '1.5rem' }}>
                <Box
                  component="button"
                  onClick={handleRequestDesign}
                  sx={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    px: '1.5rem',
                    py: '0.875rem',
                    bgcolor: colors.accent,
                    border: 'none',
                    borderRadius: '6px',
                    color: colors.background,
                    fontFamily: 'inherit',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: colors.accentHover,
                    },
                  }}
                >
                  <ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />
                  Request Similar Design
                </Box>
              </Box>

              {/* Comments Section Placeholder */}
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
                    src={user?.image?.uri || undefined}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: surfaceElevated,
                      fontSize: '0.75rem',
                      color: colors.accent,
                    }}
                  >
                    {!user?.image?.uri && getUserInitials()}
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

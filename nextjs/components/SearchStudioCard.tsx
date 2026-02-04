import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Box, Typography, Avatar, Button } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import StarIcon from '@mui/icons-material/Star';
import AddIcon from '@mui/icons-material/Add';
import { colors } from '@/styles/colors';

interface SearchStudio {
  id: number;
  name: string;
  slug: string;
  location?: string;
  about?: string;
  rating?: number;
  is_claimed?: boolean;
  is_featured?: boolean;
  primary_image?: { uri: string };
  styles?: Array<{ id: number; name: string } | string>;
}

interface SearchStudioCardProps {
  studio: SearchStudio;
}

const SearchStudioCard: React.FC<SearchStudioCardProps> = ({ studio }) => {
  const getInitials = () => {
    if (!studio.name) return 'S';
    const parts = studio.name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return studio.name.substring(0, 2).toUpperCase();
  };

  const getStyleTags = () => {
    if (!studio.styles || studio.styles.length === 0) return [];
    return studio.styles.slice(0, 3).map((style) => {
      if (typeof style === 'string') return style;
      if (style && typeof style === 'object' && 'name' in style) return style.name;
      return '';
    }).filter(Boolean);
  };

  const styleTags = getStyleTags();
  const isClaimed = studio.is_claimed !== false;

  // Unclaimed studio - show CTA to claim
  if (!isClaimed) {
    return (
      <Box
        sx={{
          bgcolor: colors.surface,
          borderRadius: '12px',
          overflow: 'hidden',
          border: `1px dashed ${colors.border}`,
          transition: 'all 0.25s ease',
          '&:hover': {
            borderColor: `${colors.accent}4D`,
          },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 44,
              height: 44,
              bgcolor: colors.surfaceElevated,
              flexShrink: 0,
            }}
          >
            <BusinessIcon sx={{ color: colors.textMuted }} />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                color: colors.textPrimary,
                fontWeight: 600,
                fontSize: '1rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {studio.name}
            </Typography>
            {studio.location && (
              <Typography
                sx={{
                  fontSize: '0.8rem',
                  color: colors.textSecondary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  mt: 0.25,
                }}
              >
                <LocationOnIcon sx={{ fontSize: 14, flexShrink: 0 }} />
                <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {studio.location}
                </Box>
              </Typography>
            )}
          </Box>
          {studio.rating && studio.rating > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: colors.accent, flexShrink: 0 }}>
              <StarIcon sx={{ fontSize: 16 }} />
              <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>{studio.rating}</Typography>
            </Box>
          )}
        </Box>

        {/* CTA Area */}
        <Box
          sx={{
            bgcolor: colors.surfaceElevated,
            aspectRatio: '4/5',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: colors.accentDim,
              border: `1px solid ${colors.accent}4D`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <AddIcon sx={{ fontSize: 32, color: colors.accent }} />
          </Box>
          <Typography sx={{ color: colors.textSecondary, mb: 2, fontSize: '0.9rem' }}>
            This studio hasn't joined InkedIn yet
          </Typography>
          <Button
            component={Link}
            href="/register"
            sx={{
              bgcolor: colors.accent,
              color: colors.textOnLight,
              textTransform: 'none',
              fontWeight: 500,
              px: 3,
              py: 1,
              borderRadius: '24px',
              '&:hover': { bgcolor: colors.accentHover },
            }}
          >
            Is this your studio?
          </Button>
        </Box>
      </Box>
    );
  }

  // Claimed studio - show full card with link
  return (
    <Link href={`/studios/${studio.slug}`} style={{ textDecoration: 'none' }}>
      <Box
        sx={{
          bgcolor: colors.surface,
          borderRadius: '12px',
          overflow: 'hidden',
          border: `1px solid ${colors.border}`,
          transition: 'all 0.25s ease',
          cursor: 'pointer',
          '&:hover': {
            borderColor: `${colors.accent}4D`,
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.3)',
            '& .card-image img': {
              transform: 'scale(1.03)',
            },
          },
        }}
      >
        {/* Card Header */}
        <Box sx={{ p: '1rem 1rem 0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          {studio.primary_image?.uri ? (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '8px',
                overflow: 'hidden',
                flexShrink: 0,
                position: 'relative',
              }}
            >
              <Image
                src={studio.primary_image.uri}
                alt={studio.name || 'Studio'}
                fill
                style={{ objectFit: 'cover' }}
              />
            </Box>
          ) : (
            <Avatar
              sx={{
                width: 44,
                height: 44,
                bgcolor: colors.background,
                color: colors.accent,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '8px',
                flexShrink: 0,
              }}
            >
              {getInitials()}
            </Avatar>
          )}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: '1rem',
                fontWeight: 600,
                color: colors.textPrimary,
                mb: '0.1rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {studio.name}
            </Typography>
            {studio.location && (
              <Typography
                sx={{
                  fontSize: '0.8rem',
                  color: colors.textSecondary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <LocationOnIcon sx={{ fontSize: 12, flexShrink: 0 }} />
                <Box component="span" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {studio.location}
                </Box>
              </Typography>
            )}
          </Box>

          {studio.rating && studio.rating > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: colors.accent, flexShrink: 0 }}>
              <StarIcon sx={{ fontSize: 16 }} />
              <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>{studio.rating}</Typography>
            </Box>
          )}
        </Box>

        {/* Card Image */}
        <Box
          className="card-image"
          sx={{
            aspectRatio: '4/5',
            bgcolor: colors.background,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {studio.primary_image?.uri ? (
            <Image
              src={studio.primary_image.uri}
              alt={`${studio.name}`}
              fill
              style={{ objectFit: 'cover', transition: 'transform 0.3s ease' }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.textSecondary,
                fontSize: '0.8rem',
              }}
            >
              <BusinessIcon sx={{ fontSize: 48, color: colors.textMuted, mb: 1 }} />
              No Image
            </Box>
          )}

          {/* Style Badges */}
          {styleTags.length > 0 && (
            <Box
              sx={{
                position: 'absolute',
                bottom: '0.75rem',
                left: '0.75rem',
                right: '0.75rem',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.35rem',
              }}
            >
              {styleTags.map((style, index) => (
                <Box
                  key={index}
                  sx={{
                    px: '0.6rem',
                    py: '0.25rem',
                    bgcolor: 'rgba(15, 15, 15, 0.85)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: '100px',
                    fontSize: '0.7rem',
                    color: colors.textPrimary,
                    fontWeight: 500,
                  }}
                >
                  {style}
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Card Footer */}
        <Box
          sx={{
            p: '0.75rem 1rem',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            borderTop: `1px solid ${colors.border}`,
          }}
        >
          <Box
            sx={{
              fontSize: '0.75rem',
              px: '0.6rem',
              py: '0.3rem',
              borderRadius: '100px',
              fontWeight: 500,
              bgcolor: `${colors.accent}1A`,
              color: colors.accent,
            }}
          >
            Studio
          </Box>
        </Box>
      </Box>
    </Link>
  );
};

export default SearchStudioCard;

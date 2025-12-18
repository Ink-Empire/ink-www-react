import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Box, Typography, IconButton, Avatar } from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import { ArtistType } from '../models/artist.interface';
import { useUserData } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/colors';

interface ArtistCardProps {
    artist: ArtistType;
    onSaveClick?: (artist: ArtistType, isSaved: boolean) => void;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onSaveClick }) => {
    const user = useUserData();
    const { isAuthenticated } = useAuth();
    const [isSaved, setIsSaved] = useState(false);

    // Update saved status when user data changes
    React.useEffect(() => {
        if (user?.favorites?.artist && artist.id) {
            setIsSaved(user.favorites.artist.includes(artist.id));
        }
    }, [user, artist.id]);

    // Handle bookmark click
    const handleSaveClick = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (!isAuthenticated) {
            onSaveClick?.(artist, false);
            return;
        }

        if (user?.toggleFavorite) {
            user.toggleFavorite('artist', artist.id)
                .then(() => setIsSaved(!isSaved))
                .catch(err => console.error('Error toggling favorite:', err));
        }
    };

    // Get style tags (limit to first 3 for card)
    const getStyleTags = () => {
        if (!artist.styles || artist.styles.length === 0) return [];
        return artist.styles.slice(0, 3).map((style) => {
            if (typeof style === 'string') return style;
            if (style && typeof style === 'object' && 'name' in style) return style.name;
            return '';
        }).filter(Boolean);
    };

    const styleTags = getStyleTags();

    // Get initials for avatar fallback
    const getInitials = () => {
        if (!artist.name) return 'A';
        const parts = artist.name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return artist.name.substring(0, 2).toUpperCase();
    };

    // Get featured image (first tattoo or primary image)
    const featuredImage = artist.tattoos?.[0]?.primary_image?.uri || artist.primary_image?.uri;

    // Determine availability status
    const getAvailability = () => {
        if (artist.settings?.books_open) {
            return { label: 'Books Open', status: 'open' };
        }
        return { label: 'Limited', status: 'limited' };
    };

    const availability = getAvailability();

    return (
        <Link href={`/artists/${artist.slug || artist.id}`} style={{ textDecoration: 'none' }}>
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
                            transform: 'scale(1.03)'
                        }
                    }
                }}
            >
                {/* Card Header */}
                <Box sx={{
                    p: '1rem 1rem 0.75rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem'
                }}>
                    {/* Avatar */}
                    {artist.primary_image?.uri ? (
                        <Box sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            overflow: 'hidden',
                            flexShrink: 0,
                            position: 'relative'
                        }}>
                            <Image
                                src={artist.primary_image.uri}
                                alt={artist.name || 'Artist'}
                                fill
                                style={{ objectFit: 'cover' }}
                            />
                        </Box>
                    ) : (
                        <Avatar sx={{
                            width: 44,
                            height: 44,
                            bgcolor: colors.background,
                            color: colors.accent,
                            fontSize: '1rem',
                            fontWeight: 600,
                            flexShrink: 0
                        }}>
                            {getInitials()}
                        </Avatar>
                    )}

                    {/* Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: colors.textPrimary,
                            mb: '0.1rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {artist.name}
                        </Typography>
                        {artist.studio_name && (
                            <Typography sx={{
                                fontSize: '0.8rem',
                                color: colors.accent,
                                mb: '0.1rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {artist.studio_name}
                            </Typography>
                        )}
                        {artist.location && (
                            <Typography sx={{
                                fontSize: '0.8rem',
                                color: colors.textSecondary,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                            }}>
                                <LocationOnIcon sx={{ fontSize: 12, flexShrink: 0 }} />
                                <Box component="span" sx={{
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {artist.location}
                                </Box>
                            </Typography>
                        )}
                    </Box>

                    {/* Bookmark Button */}
                    <IconButton
                        onClick={handleSaveClick}
                        sx={{
                            p: '0.25rem',
                            color: isSaved ? colors.accent : colors.textSecondary,
                            transition: 'color 0.15s ease',
                            '&:hover': {
                                color: colors.accent,
                                bgcolor: 'transparent'
                            }
                        }}
                    >
                        {isSaved ? (
                            <BookmarkIcon sx={{ fontSize: 20 }} />
                        ) : (
                            <BookmarkBorderIcon sx={{ fontSize: 20 }} />
                        )}
                    </IconButton>
                </Box>

                {/* Card Image */}
                <Box
                    className="card-image"
                    sx={{
                        aspectRatio: '4/5',
                        bgcolor: colors.background,
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    {featuredImage ? (
                        <Image
                            src={featuredImage}
                            alt={`${artist.name} portfolio`}
                            fill
                            style={{
                                objectFit: 'cover',
                                transition: 'transform 0.3s ease'
                            }}
                        />
                    ) : (
                        <Box sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: colors.textSecondary,
                            fontSize: '0.8rem'
                        }}>
                            No Portfolio Image
                        </Box>
                    )}

                    {/* Style Badges */}
                    {styleTags.length > 0 && (
                        <Box sx={{
                            position: 'absolute',
                            bottom: '0.75rem',
                            left: '0.75rem',
                            right: '0.75rem',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.35rem'
                        }}>
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
                                        fontWeight: 500
                                    }}
                                >
                                    {style}
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>

                {/* Card Footer */}
                <Box sx={{
                    p: '0.75rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: `1px solid ${colors.border}`
                }}>
                    {/* Rating */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.85rem',
                        color: colors.accent,
                        fontWeight: 500
                    }}>
                        <StarIcon sx={{ fontSize: 16 }} />
                        <span>4.9</span>
                        <Typography component="span" sx={{
                            color: colors.textSecondary,
                            fontWeight: 400
                        }}>
                            (127)
                        </Typography>
                    </Box>

                    {/* Availability */}
                    <Box sx={{
                        fontSize: '0.75rem',
                        px: '0.6rem',
                        py: '0.3rem',
                        borderRadius: '100px',
                        fontWeight: 500,
                        ...(availability.status === 'open' ? {
                            bgcolor: 'rgba(74, 155, 127, 0.15)',
                            color: colors.success
                        } : {
                            bgcolor: 'rgba(212, 162, 76, 0.15)',
                            color: colors.warning
                        })
                    }}>
                        {availability.label}
                    </Box>
                </Box>
            </Box>
        </Link>
    );
};

export default ArtistCard;

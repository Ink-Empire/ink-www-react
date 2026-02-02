import React, { useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Box, Typography, IconButton, Avatar } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { useUserData } from '@/contexts/AuthContext';
import { useTattooImagePreload } from '@/contexts/ImageCacheContext';
import { colors } from '@/styles/colors';

interface TattooCardProps {
    tattoo: any;
    onTattooClick?: (tattooId: string) => void;
}

const TattooCard: React.FC<TattooCardProps> = ({ tattoo, onTattooClick }) => {
    const [isFavorite, setIsFavorite] = React.useState(false);
    const user = useUserData();
    const { preloadTattooImages } = useTattooImagePreload();

    const imageUri = tattoo.primary_image?.uri || tattoo.image?.uri;
    const artistImageUri = tattoo.artist_image_uri;

    // Preload all tattoo images on hover for instant modal display
    const handleMouseEnter = useCallback(() => {
        preloadTattooImages(tattoo);
    }, [tattoo, preloadTattooImages]);

    React.useEffect(() => {
        if (user?.favorites?.tattoos && tattoo.id) {
            setIsFavorite(user.favorites.tattoos.includes(tattoo.id));
        }
    }, [user, tattoo.id]);

    const handleAddToFavorites = (event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();

        if (user?.toggleFavorite) {
            user.toggleFavorite('tattoo', tattoo.id)
                .catch(err => console.error('Error toggling favorite:', err));
        }
    };

    // Get style tags (limit to first 2 for card)
    const getStyleTags = () => {
        if (!tattoo.styles || tattoo.styles.length === 0) return [];
        return tattoo.styles.slice(0, 2).map((style: any) => {
            if (typeof style === 'string') return style;
            if (style && typeof style === 'object' && 'name' in style) return style.name;
            return '';
        }).filter(Boolean);
    };

    // Get subject tags (limit to first 2 for card) - return objects to preserve is_pending
    const getSubjectTags = (): Array<{ name: string; is_pending?: boolean }> => {
        if (!tattoo.tags || tattoo.tags.length === 0) return [];
        return tattoo.tags.slice(0, 2).map((tag: any) => {
            if (typeof tag === 'string') return { name: tag, is_pending: false };
            if (tag && typeof tag === 'object') {
                const name = tag.tag || tag.name || '';
                return name ? { name, is_pending: tag.is_pending === true } : null;
            }
            return null;
        }).filter(Boolean) as Array<{ name: string; is_pending?: boolean }>;
    };

    const styleTags = getStyleTags();
    const subjectTags = getSubjectTags();

    // Get artist initials for avatar fallback
    const getArtistInitials = () => {
        const name = tattoo.artist_name;
        if (!name) return 'A';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const handleTattooClick = () => {
        if (onTattooClick && tattoo.id) {
            onTattooClick(tattoo.id.toString());
        }
    };

    return (
        <Box
            onClick={handleTattooClick}
            onMouseEnter={handleMouseEnter}
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
                {/* Artist Avatar */}
                <Link
                    href={`/artists/${tattoo.artist_slug || tattoo.artist_id}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{ textDecoration: 'none' }}
                >
                    {artistImageUri ? (
                        <Box sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            overflow: 'hidden',
                            flexShrink: 0,
                            position: 'relative',
                            transition: 'transform 0.2s ease',
                            '&:hover': { transform: 'scale(1.05)' }
                        }}>
                            <Image
                                src={artistImageUri}
                                alt={tattoo.artist_name || 'Artist'}
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
                            flexShrink: 0,
                            transition: 'transform 0.2s ease',
                            '&:hover': { transform: 'scale(1.05)' }
                        }}>
                            {getArtistInitials()}
                        </Avatar>
                    )}
                </Link>

                {/* Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Link
                        href={`/artists/${tattoo.artist_slug || tattoo.artist_id}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ textDecoration: 'none' }}
                    >
                        <Typography sx={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: colors.textPrimary,
                            mb: '0.1rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            transition: 'color 0.15s ease',
                            '&:hover': { color: colors.accent }
                        }}>
                            {tattoo.artist_name || 'Unknown Artist'}
                        </Typography>
                    </Link>
                    {tattoo.studio?.name && (
                        tattoo.studio.slug ? (
                            <Link
                                href={`/studios/${tattoo.studio.slug}`}
                                onClick={(e) => e.stopPropagation()}
                                style={{ textDecoration: 'none' }}
                            >
                                <Typography sx={{
                                    fontSize: '0.8rem',
                                    color: colors.accent,
                                    mb: '0.1rem',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    '&:hover': { textDecoration: 'underline' }
                                }}>
                                    {tattoo.studio.name}
                                </Typography>
                            </Link>
                        ) : (
                            <Typography sx={{
                                fontSize: '0.8rem',
                                color: colors.accent,
                                mb: '0.1rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {tattoo.studio.name}
                            </Typography>
                        )
                    )}
                    {tattoo.studio?.location && (
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
                                {tattoo.studio.location}
                            </Box>
                        </Typography>
                    )}
                </Box>

                {/* Bookmark Button */}
                {user && (
                    <IconButton
                        onClick={handleAddToFavorites}
                        sx={{
                            p: '0.25rem',
                            color: isFavorite ? colors.accent : colors.textSecondary,
                            transition: 'color 0.15s ease',
                            '&:hover': {
                                color: colors.accent,
                                bgcolor: 'transparent'
                            }
                        }}
                    >
                        {isFavorite ? (
                            <BookmarkIcon sx={{ fontSize: 20 }} />
                        ) : (
                            <BookmarkBorderIcon sx={{ fontSize: 20 }} />
                        )}
                    </IconButton>
                )}
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
                {imageUri ? (
                    <Image
                        src={imageUri}
                        alt={tattoo.title || 'Tattoo'}
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
                        No Image
                    </Box>
                )}

                {/* Style & Tag Badges */}
                {(styleTags.length > 0 || subjectTags.length > 0) && (
                    <Box sx={{
                        position: 'absolute',
                        bottom: '0.75rem',
                        left: '0.75rem',
                        right: '0.75rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.35rem'
                    }}>
                        {/* Style badges (gold) */}
                        {styleTags.map((style: string, index: number) => (
                            <Box
                                key={`style-${index}`}
                                sx={{
                                    px: '0.6rem',
                                    py: '0.25rem',
                                    bgcolor: 'rgba(15, 15, 15, 0.85)',
                                    backdropFilter: 'blur(4px)',
                                    borderRadius: '100px',
                                    fontSize: '0.7rem',
                                    color: colors.accent,
                                    fontWeight: 500,
                                    border: `1px solid ${colors.accent}4D`
                                }}
                            >
                                {style}
                            </Box>
                        ))}
                        {/* Subject tag badges (coral for approved, dotted gold for pending) */}
                        {subjectTags.map((tag, index) => (
                            <Box
                                key={`tag-${index}`}
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    px: '0.6rem',
                                    py: '0.25rem',
                                    bgcolor: 'rgba(15, 15, 15, 0.85)',
                                    backdropFilter: 'blur(4px)',
                                    borderRadius: '100px',
                                    fontSize: '0.7rem',
                                    color: tag.is_pending ? colors.accent : colors.tag,
                                    fontWeight: 500,
                                    border: tag.is_pending
                                        ? `1px dashed ${colors.accent}`
                                        : `1px solid ${colors.tag}4D`
                                }}
                            >
                                <LocalOfferIcon sx={{ fontSize: 10 }} />
                                {tag.name}
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>

            {/* Card Footer */}
            {tattoo.title && (
                <Box sx={{
                    p: '0.75rem 1rem',
                    borderTop: `1px solid ${colors.border}`
                }}>
                    <Typography sx={{
                        fontSize: '0.85rem',
                        color: colors.textPrimary,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {tattoo.title}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default TattooCard;

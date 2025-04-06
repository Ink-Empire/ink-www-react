import React, {useState} from 'react';
import Link from 'next/link';
import {ArtistType} from '../models/artist.interface';
import {Card, CardContent, CardActionArea, Typography, Box, Stack, Chip, Avatar, IconButton} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import {useUserData} from '@/contexts/UserContext';

interface ArtistCardProps {
    artist: ArtistType;
}

const ArtistCard: React.FC<ArtistCardProps> = ({artist}) => {
    // State to track if artist is favorited
    const [isFavorite, setIsFavorite] = useState(false);
    const user = useUserData();

    // Update favorite status when user data changes
    React.useEffect(() => {
        if (user?.favorites?.artist) {
            setIsFavorite(user.favorites.artist.includes(artist.id));
        }
    }, [user, artist.id]);

    // Handle adding artist to favorites
    const handleAddToFavorites = (event: React.MouseEvent) => {
        // Stop event propagation to prevent card click
        event.stopPropagation();
        
        // Toggle favorite status via the UserContext method
        if (user?.toggleFavorite) {
            user.toggleFavorite('artist', artist.id)
                .catch(err => console.error('Error toggling favorite:', err));
        } else {
            console.warn('User not logged in or toggleFavorite not available');
        }
    };

    // Get style tags (limit to first 6 for consistent card height)
    const getStyleTags = () => {
        if (!artist.styles || artist.styles.length === 0) return null;

        // Limit to max 6 style tags (for 2 rows of 3 tags)
        const limitedStyles = artist.styles.slice(0, 6);

        return limitedStyles.map((style, index) => {
            // Handle both string styles and object styles
            const styleText = typeof style === 'string'
                ? style
                : style && typeof style === 'object' && 'name' in style
                    ? style.name
                    : '';

            return styleText ? (
                <Chip
                    key={index}
                    label={styleText}
                    size="small"
                    variant="outlined"
                    color="secondary"
                    sx={{
                        m: 0.5,
                        borderRadius: 1,
                        fontSize: '0.7rem'
                    }}
                />
            ) : null;
        });
    };

    // Calculate if we need to show "more styles" indicator
    const hasMoreStyles = artist.styles && artist.styles.length > 6;

    return (
        <Card
            variant="outlined"
            sx={{
                minHeight: 420, // Minimum height
                height: 'auto', // Allow height to adjust based on content
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                boxShadow: '0 2px 8px rgba(232, 219, 197, 0.4)',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 6px 12px rgba(232, 219, 197, 0.6)'
                },
                position: 'relative' // Added for absolute positioning of the heart icon
            }}
        >
            {/* Favorite Button */}
            <IconButton
                size="small"
                onClick={handleAddToFavorites}
                sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 2,
                    backgroundColor: 'rgba(28, 15, 19, 0.7)', // Licorice with opacity
                    '&:hover': {
                        backgroundColor: 'rgba(28, 15, 19, 0.9)'
                    },
                    borderRadius: '50%'
                }}
            >
                {isFavorite ? (
                    <FavoriteIcon sx={{color: '#DC0F38', fontSize: '1.2rem'}}/>
                ) : (
                    <FavoriteBorderIcon sx={{color: '#e8dbc5', fontSize: '1.2rem'}}/>
                )}
            </IconButton>

            <CardActionArea
                component={Link}
                href={`/artists/${artist.id}`}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    height: '100%'
                }}
            >
                <Box sx={{p: 2, pb: 1, display: 'flex', justifyContent: 'center'}}>
                    {artist.primary_image ? (
                        <Avatar
                            src={artist.primary_image.uri}
                            alt={artist.name || 'Artist'}
                            sx={{
                                width: 180,
                                height: 180,
                                boxShadow: 3,
                                border: '4px solid',
                                borderColor: 'primary.main'
                            }}
                        />
                    ) : (
                        <Avatar
                            alt={artist.name || 'Artist'}
                            sx={{
                                width: 180,
                                height: 180,
                                bgcolor: 'primary.light'
                            }}
                        >
                            {artist.name?.charAt(0) || 'A'}
                        </Avatar>
                    )}
                </Box>

                <CardContent sx={{pt: 1, pb: '16px !important'}}>
                    <Stack spacing={1}>
                        <Typography
                            variant="h6"
                            component="h3"
                            align="center"
                            gutterBottom
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical'
                            }}
                        >
                            {artist.name}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            align="center"
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical'
                            }}
                        >
                            {artist.studio_name}
                        </Typography>

                        {artist.location && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                align="center"
                                sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: 'vertical'
                                }}
                            >
                                {artist.location}
                            </Typography>
                        )}

                        {artist.styles && artist.styles.length > 0 && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    justifyContent: 'center',
                                    mt: 1,
                                    minHeight: 58,
                                    maxHeight: 84, // Allow for up to 3 rows if needed
                                    overflow: 'visible' // Don't hide overflowing content
                                }}
                            >
                                {getStyleTags()}
                                {hasMoreStyles && (
                                    <Chip
                                        label={`+${artist.styles.length - 6}`}
                                        size="small"
                                        variant="outlined"
                                        color="secondary"
                                        sx={{ 
                                            m: 0.5,
                                            borderRadius: 1,
                                            fontSize: '0.7rem'
                                        }}
                                    />
                                )}
                            </Box>
                        )}
                    </Stack>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default ArtistCard;
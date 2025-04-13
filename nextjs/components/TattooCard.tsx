import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {TattooType} from '../models/tattoo.interface';
import {Card, CardContent, CardActionArea, CardMedia, Typography, Box, Stack, Chip} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface TattooCardProps {
    tattoo: any; // Using any for now as the tattoo JSON doesn't match the interface exactly
}

const TattooCard: React.FC<TattooCardProps> = ({tattoo}) => {
    // Determine the image URI from either primary_image or image
    const imageUri = tattoo.primary_image?.uri || tattoo.image?.uri;

    // Determine the artist image URI
    const artistImageUri = tattoo.artist?.primary_image?.uri || tattoo.artist?.image?.uri;

    // Get style tags (limit to first 6 for consistent card height)
    const getStyleTags = () => {
        if (!tattoo.styles || tattoo.styles.length === 0) return null;

        // Limit to max 6 style tags (for 2 rows of 3 tags)
        const limitedStyles = tattoo.styles.slice(0, 6);

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
    const hasMoreStyles = tattoo.styles && tattoo.styles.length > 6;

    return (
        <Card
            variant="outlined"
            sx={{
                height: 400, // Adjusted height
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                boxShadow: '0 2px 8px rgba(232, 219, 197, 0.4)',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 6px 12px rgba(232, 219, 197, 0.6)'
                }
            }}
        >
            <CardActionArea
                component={Link}
                href={`/tattoos/${tattoo.id}`}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    height: '100%'
                }}
            >
                {/* Artist Avatar */}
                <Box sx={{
                    px: 2,
                    pt: 2,
                    pb: 1
                }}>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 0.2
                    }}>
                        {artistImageUri && (
                            <Link
                                href={`/artists/${tattoo.artist?.slug || tattoo.artist?.id}`}
                                onClick={(e) => e.stopPropagation()} // Prevent triggering the card click
                            >
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        mr: 1.5,
                                        border: '1px solid #eee',
                                        transition: 'transform 0.2s ease-in-out',
                                        '&:hover': {
                                            transform: 'scale(1.05)'
                                        }
                                    }}
                                >
                                    <Image
                                        src={artistImageUri}
                                        alt={tattoo.artist?.name || 'Artist'}
                                        fill
                                        style={{objectFit: 'cover'}}
                                    />
                                </Box>
                            </Link>
                        )}
                        <Link
                            href={`/artists/${tattoo.artist?.slug || tattoo.artist?.id}`}
                            onClick={(e) => e.stopPropagation()} // Prevent triggering the card click
                            style={{
                                textDecoration: 'none',
                                color: 'inherit',
                                '&:hover': {textDecoration: 'underline'}
                            }}
                        >
                            <Typography variant="subtitle2" noWrap sx={{'&:hover': {color: '#339989'}}}>
                                {tattoo.artist?.name || 'Unknown Artist'}
                            </Typography>
                        </Link>
                    </Box>

                    {/* Studio details moved to the left */}
                    {tattoo?.studio?.name && (
                        <Link
                            href={`/?studio_id=${tattoo.studio.id}`}
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the card click
                            }}
                            style={{
                                textDecoration: 'none',
                                color: 'inherit'
                            }}
                        >
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    fontSize: '0.75rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    mt: 0.5,
                                    '&:hover': {
                                        color: '#339989',
                                        textDecoration: 'underline'
                                    },
                                    cursor: 'pointer'
                                }}
                            >
                                {tattoo.studio.name}
                            </Typography>
                        </Link>
                    )}

                    {tattoo?.studio?.location && (
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            mt: 0.5 
                        }}>
                            <LocationOnIcon 
                                fontSize="small" 
                                sx={{ 
                                    fontSize: '0.75rem', 
                                    mr: 0.5, 
                                    color: 'text.secondary' 
                                }} 
                            />
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    fontSize: '0.75rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {tattoo.studio.location}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Tattoo Image - Takes up the rest of the card */}
                {imageUri && (
                    <Box sx={{
                        position: 'relative',
                        flexGrow: 1,
                        width: '100%'
                    }}>
                        <CardMedia
                            component="img"
                            image={imageUri}
                            alt={tattoo.title || 'Tattoo'}
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center'
                            }}
                        />

                        {/* Optional title overlay at the bottom */}
                        {tattoo.title && (
                            <Box sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                padding: '20px 16px 8px',
                                textShadow: '0 1px 2px rgba(0,0,0,0.6)'
                            }}>
                                <Typography
                                    variant="body2"
                                    color="white"
                                    sx={{
                                        fontWeight: 'medium',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </CardActionArea>
        </Card>
    );
};

export default TattooCard;
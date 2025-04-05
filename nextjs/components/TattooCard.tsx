import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TattooType } from '../models/tattoo.interface';
import { Card, CardContent, CardActionArea, CardMedia, Typography, Box, Stack, Chip } from '@mui/material';

interface TattooCardProps {
  tattoo: any; // Using any for now as the tattoo JSON doesn't match the interface exactly
}

const TattooCard: React.FC<TattooCardProps> = ({ tattoo }) => {
  // Determine the image URI from either primary_image or image
  const imageUri = tattoo.primary_image?.uri || tattoo.image?.uri;
  
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
        height: 450, // Fixed height for consistent cards
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
        {imageUri && (
          <Box sx={{ position: 'relative', paddingTop: '65%', width: '100%' }}>
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
          </Box>
        )}
        
        <CardContent sx={{ flexGrow: 1, pt: 2 }}>
          <Stack spacing={1}>
            <Typography 
              variant="h6" 
              component="h3" 
              gutterBottom
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {tattoo.title}
            </Typography>
            
            {tattoo?.studio?.name && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {tattoo.studio.name}
              </Typography>
            )}
            
            {tattoo.artist && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {tattoo.artist.name}
              </Typography>
            )}
            
            {tattoo.styles && tattoo.styles.length > 0 && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  mt: 1,
                  height: 64, // Fixed height for 2 rows of styles
                  overflow: 'hidden'
                }}
              >
                {getStyleTags()}
                {hasMoreStyles && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ width: '100%', textAlign: 'center', mt: 0.5 }}
                  >
                    +{tattoo.styles.length - 6} more
                  </Typography>
                )}
              </Box>
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default TattooCard;
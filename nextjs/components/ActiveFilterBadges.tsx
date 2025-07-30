import React from 'react';
import { Chip, Box, Typography } from '@mui/material';
import { useStyles } from '@/contexts/StyleContext';

interface ActiveFilterBadgesProps {
  searchString?: string;
  selectedStyles?: number[];
  distance?: number;
  distanceUnit?: 'mi' | 'km';
  location?: string;
  useMyLocation?: boolean;
  useAnyLocation?: boolean;
  locationCoords?: { lat: number; lng: number };
  studioId?: string | string[];
  studioName?: string;
  onClearSearch: () => void;
  onClearStyle: (styleId: number) => void;
  onClearDistance: () => void;
  onClearLocation?: () => void;
  onClearStudio?: () => void;
}

const ActiveFilterBadges: React.FC<ActiveFilterBadgesProps> = ({
  searchString,
  selectedStyles = [],
  distance,
  distanceUnit = 'mi',
  location,
  useMyLocation = true,
  useAnyLocation = false,
  locationCoords,
  studioId,
  studioName,
  onClearSearch,
  onClearStyle,
  onClearDistance,
  onClearLocation,
  onClearStudio
}) => {
  const { styles } = useStyles();
  
  // Only render if there are active filters
  const hasActiveFilters = searchString || selectedStyles.length > 0 || distance || (!useMyLocation && !useAnyLocation && location) || studioId || useAnyLocation;
  
  if (!hasActiveFilters) return null;
  
  // Get style name by id
  const getStyleName = (styleId: number) => {
    const style = styles.find(s => s.id === styleId);
    return style ? style.name : 'Unknown Style';
  };

  return (
    <Box sx={{ 
      mb: 3, 
      display: 'flex',
      flexDirection: 'column',
      gap: 1
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2 
      }}>
        
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 1 
        }}>
          {/* Search filter */}
          {searchString && (
            <Chip
              label={`Search: ${searchString}`}
              onDelete={onClearSearch}
              color="primary"
              variant="outlined"
              size="small"
            />
          )}
          
          {/* Distance filter */}
          {distance && !useAnyLocation && (
            <Chip
              label={`Distance: ${distance} ${distanceUnit === 'mi' ? 'miles' : 'km'}`}
              onDelete={onClearDistance}
              color="primary"
              variant="outlined"
              size="small"
            />
          )}
          
          {/* Location filter */}
          {!useMyLocation && !useAnyLocation && location && onClearLocation && (
            <Chip
              label={`Location: ${location}`}
              onDelete={onClearLocation}
              color="primary"
              variant="outlined"
              size="small"
            />
          )}
          
          {/* Anywhere filter */}
          {useAnyLocation && (
            <Chip
              label="Location: Anywhere"
              onDelete={onClearLocation}
              color="primary"
              variant="outlined"
              size="small"
            />
          )}
          
          {/* Style filters */}
          {selectedStyles.map(styleId => (
            <Chip
              key={styleId}
              label={getStyleName(styleId)}
              onDelete={() => onClearStyle(styleId)}
              color="secondary"
              variant="outlined"
              size="small"
            />
          ))}
          
          {/* Studio filter */}
          {studioId && onClearStudio && (
            <Chip
              label={`Studio: ${studioName || (typeof studioId === 'string' ? studioId : studioId[0])}`}
              onDelete={onClearStudio}
              color="primary"
              variant="outlined"
              size="small"
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ActiveFilterBadges;
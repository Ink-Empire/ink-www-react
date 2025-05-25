import React, { useState, useEffect } from 'react';
import { useArtists } from '@/hooks';
import { ArtistType } from '@/models/artist.interface';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  CircularProgress,
  Grid, 
  Card, 
  CardContent,
  Alert,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  MenuItem,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface ArtistSearchProps {
  initialStyles?: number[];
  initialLocation?: string;
}

// Style names for display
const STYLE_OPTIONS = [
  { id: 1, name: 'Traditional' },
  { id: 2, name: 'Neo-Traditional' },
  { id: 3, name: 'Japanese' },
  { id: 4, name: 'Realism' },
  { id: 5, name: 'Watercolor' },
  { id: 6, name: 'Blackwork' },
  { id: 7, name: 'Tribal' },
  { id: 8, name: 'New School' }
];

const ArtistSearch: React.FC<ArtistSearchProps> = ({ 
  initialStyles = [], 
  initialLocation = ''
}) => {
  // Search states
  const [styles, setStyles] = useState<number[]>(initialStyles);
  const [location, setLocation] = useState<string>(initialLocation);
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  
  // Use our hook with the search parameters
  const { artists, loading, error } = useArtists(searchParams);
  
  // Function to perform the search
  const handleSearch = () => {
    // Build the search parameters object
    const params: Record<string, any> = {};
    
    // Only add parameters if they have values
    if (styles && styles.length > 0) {
      params.styles = styles;
    }
    
    if (location && location.trim() !== '') {
      params.location = location.trim();
    }
    
    // Update the search parameters state, which will trigger the hook
    setSearchParams(params);
  };
  
  // Initialize search on component mount if initial values are provided
  useEffect(() => {
    if (initialStyles.length > 0 || initialLocation !== '') {
      handleSearch();
    }
  }, []);

  // Get style name by id
  const getStyleName = (styleId: number) => {
    const style = STYLE_OPTIONS.find(s => s.id === styleId);
    return style ? style.name : '';
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          borderRadius: 2 
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom fontWeight="medium">
          Find Artists
        </Typography>
        
        {/* Style selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="styles-select-label">Styles</InputLabel>
          <Select
            labelId="styles-select-label"
            id="styles-select"
            multiple
            value={styles}
            onChange={(e) => {
              const value = e.target.value as number[];
              setStyles(value);
            }}
            input={<OutlinedInput label="Styles" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as number[]).map((value) => (
                  <Chip key={value} label={getStyleName(value)} size="small" />
                ))}
              </Box>
            )}
          >
            {STYLE_OPTIONS.map((style) => (
              <MenuItem key={style.id} value={style.id}>
                {style.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Location input */}
        <TextField
          fullWidth
          label="Location"
          placeholder="City, State or Zip"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          sx={{ mb: 3 }}
        />
        
        {/* Search button */}
        <Button
          fullWidth
          variant="contained"
          color="secondary"
          startIcon={<SearchIcon />}
          onClick={handleSearch}
          size="large"
        >
          Search Artists
        </Button>
      </Paper>
      
      {/* Results section */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          borderRadius: 2 
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom fontWeight="medium">
          Results
        </Typography>
        
        {loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={40} color="primary" />
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              Loading artists...
            </Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            Error: {error.message}
          </Alert>
        )}
        
        {!loading && !error && artists.length === 0 && (
          <Alert severity="info" sx={{ my: 2 }}>
            No artists found. Try adjusting your search.
          </Alert>
        )}
        
        {!loading && !error && artists.length > 0 && (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: '1fr', 
              md: 'repeat(2, 1fr)', 
              lg: 'repeat(3, 1fr)' 
            }, 
            gap: 3 
          }}>
            {artists.map((artist: ArtistType) => (
              <Card 
                key={artist.id as number}
                variant="outlined"
                sx={{ 
                  height: '100%',
                    transition: 'box-shadow 0.3s ease-in-out',
                    '&:hover': {
                      boxShadow: 3
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {artist.name || 'Artist'}
                    </Typography>
                    {artist.location && (
                      <Typography variant="body2" color="text.secondary">
                        {artist.location}
                      </Typography>
                    )}
                    {artist.styles && artist.styles.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                        {artist.styles.map((style, index) => {
                          // Handle different style formats
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
                              color="primary"
                              variant="outlined"
                            />
                          ) : null;
                        })}
                      </Box>
                    )}
                  </CardContent>
                </Card>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ArtistSearch;
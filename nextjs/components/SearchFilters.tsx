import React, { useState, useEffect, useRef } from 'react';
import { useStyles } from '@/contexts/StyleContext';
import { useAppGeolocation } from '@/utils/geolocation';
import { useUserData } from '@/contexts/UserContext';
import { distancePreferences } from '@/utils/distancePreferences';

// MUI Material imports
import { styled, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';

// MUI Icons
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';

// Styled components
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginBottom: theme.spacing(2),
  width: '100%',
  border: `1px solid #e8dbc5`,
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
  },
}));

const FilterPaper = styled(Paper)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  boxShadow: theme.shadows[3],
  borderRadius: 0,
}));

const StylesContainer = styled(Box)(({ theme }) => ({
  maxHeight: 200,
  overflow: 'auto',
  padding: theme.spacing(1),
  border: `1px solid #e8dbc5`,
  borderRadius: theme.shape.borderRadius,
  marginTop: theme.spacing(1),
}));

interface SearchFiltersProps {
  initialFilters?: {
    searchString?: string;
    styles?: number[];
    distance?: number;
    distanceUnit?: 'mi' | 'km';
    location?: string;
    useMyLocation?: boolean;
    useAnyLocation?: boolean;
    applySavedStyles?: boolean;
    locationCoords?: {
      lat: number;
      lng: number;
    };
  };
  currentFilters?: {
    searchString?: string;
    styles?: number[];
    distance?: number;
    distanceUnit?: 'mi' | 'km';
    location?: string;
    useMyLocation?: boolean;
    applySavedStyles?: boolean;
    locationCoords?: {
      lat: number;
      lng: number;
    };
  };
  onFilterChange: (filters: {
    searchString: string;
    styles: number[];
    distance: number;
    distanceUnit?: 'mi' | 'km';
    location?: string;
    useMyLocation?: boolean;
    useAnyLocation?: boolean;
    applySavedStyles?: boolean;
    locationCoords?: {
      lat: number;
      lng: number;
    };
  }) => void;
  type: 'artists' | 'tattoos';
  onSidebarToggle?: (isExpanded: boolean) => void;
  initialExpanded?: boolean;
  isLoading?: boolean;
  onCreateTattoo?: () => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  initialFilters = {},
  currentFilters,
  onFilterChange,
  type,
  onSidebarToggle,
  initialExpanded = true,
  isLoading = false,
  onCreateTattoo
}) => {
  // Get styles from context
  const { styles, loading: stylesLoading } = useStyles();
  
  // Get user data from context
  const me = useUserData();

  // Get geolocation service
  const geoService = useAppGeolocation();
  
  // Filter states
  const [searchString, setSearchString] = useState(initialFilters.searchString || '');
  const [selectedStyles, setSelectedStyles] = useState<number[]>(initialFilters.styles || []);
  const [distance, setDistance] = useState<number>(initialFilters.distance || 50);
  const [distanceUnit, setDistanceUnit] = useState<'mi' | 'km'>(initialFilters.distanceUnit || 'mi');
  const [useMyLocation, setUseMyLocation] = useState<boolean>(initialFilters.useMyLocation !== undefined ? initialFilters.useMyLocation : true);
  const [useAnyLocation, setUseAnyLocation] = useState<boolean>(initialFilters.useAnyLocation || false);
  const [applySavedStyles, setApplySavedStyles] = useState<boolean>(initialFilters.applySavedStyles || false);
  const [location, setLocation] = useState<string>(initialFilters.location || '');
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | undefined>(initialFilters.locationCoords);
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  
  // Track geolocation status
  const [geoLoading, setGeoLoading] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  
  // Debounce search with timer ref
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Watch for external filter changes (e.g., from ActiveFilterBadges)
  useEffect(() => {
    if (currentFilters) {
      // Only update if the values are different from current state
      if (currentFilters.searchString !== undefined && 
          currentFilters.searchString !== searchString) {
        setSearchString(currentFilters.searchString);
      }
      
      if (currentFilters.styles !== undefined) {
        // Check if arrays are different
        const currentStylesArray = currentFilters.styles || [];
        const isDifferent = 
          currentStylesArray.length !== selectedStyles.length || 
          currentStylesArray.some(id => !selectedStyles.includes(id));
          
        if (isDifferent) {
          setSelectedStyles(currentFilters.styles || []);
        }
      }
      
      if (currentFilters.distance !== undefined && 
          currentFilters.distance !== distance) {
        setDistance(currentFilters.distance);
      }
      
      if (currentFilters.distanceUnit !== undefined && 
          currentFilters.distanceUnit !== distanceUnit) {
        setDistanceUnit(currentFilters.distanceUnit);
      }
      
      if (currentFilters.useMyLocation !== undefined && 
          currentFilters.useMyLocation !== useMyLocation) {
        setUseMyLocation(currentFilters.useMyLocation);
      }
      
      if (currentFilters.useAnyLocation !== undefined && 
          currentFilters.useAnyLocation !== useAnyLocation) {
        setUseAnyLocation(currentFilters.useAnyLocation);
      }
      
      if (currentFilters.applySavedStyles !== undefined && 
          currentFilters.applySavedStyles !== applySavedStyles) {
        setApplySavedStyles(currentFilters.applySavedStyles);
      }
      
      if (currentFilters.location !== undefined && 
          currentFilters.location !== location) {
        setLocation(currentFilters.location);
      }
      
      if (currentFilters.locationCoords !== undefined &&
          JSON.stringify(currentFilters.locationCoords) !== JSON.stringify(locationCoords)) {
        setLocationCoords(currentFilters.locationCoords);
      }
    }
  }, [currentFilters]);

  // Distance options in miles
  const distanceOptions = [25, 50, 75, 100];

  // Apply filters when component mounts if initial filters are provided
  useEffect(() => {
    if (initialFilters.searchString || (initialFilters.styles && initialFilters.styles.length > 0) || initialFilters.distance) {
      handleApplyFilters();
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  // Handle search string change with debounce (500ms)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchString = e.target.value;
    setSearchString(newSearchString);
    
    // Clear any existing timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    
    // Set a new timer to apply the filter after typing stops
    searchTimerRef.current = setTimeout(() => {
      onFilterChange({
        searchString: newSearchString,
        styles: selectedStyles,
        distance,
        distanceUnit,
        location,
        useMyLocation,
        useAnyLocation,
        applySavedStyles,
        locationCoords
      });
    }, 500);
  };

  // Handle apply saved styles checkbox change
  const handleApplySavedStylesChange = () => {
    const newApplySavedStyles = !applySavedStyles;
    setApplySavedStyles(newApplySavedStyles);
    
    // If applying saved styles, merge user's saved styles with current selection
    let newStyles = selectedStyles;
    if (newApplySavedStyles && me?.styles) {
      const userStyleIds = me.styles.map(style => style.id || style);
      // Merge without duplicates
      newStyles = [...new Set([...selectedStyles, ...userStyleIds])];
      setSelectedStyles(newStyles);
    }
    
    // Immediately trigger search with updated styles and applySavedStyles flag
    onFilterChange({
      searchString,
      styles: newStyles,
      distance,
      distanceUnit,
      location,
      useMyLocation,
      useAnyLocation,
      applySavedStyles: newApplySavedStyles,
      locationCoords
    });
  };

  // Handle style checkbox change
  const handleStyleChange = (styleId: number) => {
    // Create new styles array first
    const newStyles = selectedStyles.includes(styleId)
      ? selectedStyles.filter(id => id !== styleId)
      : [...selectedStyles, styleId];
    
    // Update state
    setSelectedStyles(newStyles);
    
    // Immediately trigger search with updated styles
    onFilterChange({
      searchString,
      styles: newStyles,
      distance,
      distanceUnit,
      location,
      useMyLocation,
      useAnyLocation,
      applySavedStyles,
      locationCoords
    });
  };

  // Handle distance change
  const handleDistanceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDistance = Number(e.target.value);
    setDistance(newDistance);
    
    // Immediately apply filter with new distance
    onFilterChange({
      searchString,
      styles: selectedStyles,
      distance: newDistance,
      distanceUnit,
      location,
      useMyLocation,
      useAnyLocation,
      applySavedStyles,
      locationCoords
    });
  };
  
  // Handle distance unit change
  const handleDistanceUnitChange = (unit: 'mi' | 'km') => {
    setDistanceUnit(unit);
    
    // Immediately apply filter with new distance unit
    onFilterChange({
      searchString,
      styles: selectedStyles,
      distance,
      distanceUnit: unit,
      location,
      useMyLocation,
      useAnyLocation,
      applySavedStyles,
      locationCoords
    });
  };
  
  // Handle location option change
  const handleLocationOptionChange = async (locationType: 'my' | 'custom' | 'any') => {
    // Reset state
    setUseMyLocation(locationType === 'my');
    setUseAnyLocation(locationType === 'any');
    
    if (locationType === 'my') {
      // If switching to "my location", get the user's coordinates
      try {
        setGeoLoading(true);
        
        // Get the user's current position
        const position = await geoService.getCurrentPosition();
        const myCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setLocationCoords(myCoords);
        
        // Apply filter with user's coordinates
        onFilterChange({
          searchString,
          styles: selectedStyles,
          distance,
          distanceUnit,
          location: '',
          useMyLocation: true,
          useAnyLocation: false,
          applySavedStyles,
          locationCoords: myCoords
        });
      } catch (error) {
        console.error('Error getting user location:', error);
        setGeoError(error instanceof Error ? error.message : 'Error getting your location');
        
        // Still update the UI state even if we can't get coordinates
        onFilterChange({
          searchString,
          styles: selectedStyles,
          distance,
          distanceUnit,
          location: '',
          useMyLocation: true,
          useAnyLocation: false,
          applySavedStyles,
          locationCoords
        });
      } finally {
        setGeoLoading(false);
      }
    } else if (locationType === 'custom') {
      // If switching to custom location, use any existing location text/coords
      onFilterChange({
        searchString,
        styles: selectedStyles,
        distance,
        distanceUnit,
        location,
        useMyLocation: false,
        useAnyLocation: false,
        applySavedStyles,
        locationCoords
      });
      
      // If there's already a location entered, get its coordinates
      if (location.trim() && !locationCoords) {
        getLocationCoordinates(location);
      }
    } else if (locationType === 'any') {
      // Using "anywhere" option, clear location info
      setLocation('');
      setLocationCoords(undefined);
      setGeoError(null);
      
      onFilterChange({
        searchString,
        styles: selectedStyles,
        distance,
        distanceUnit,
        location: '',
        useMyLocation: false,
        useAnyLocation: true,
        applySavedStyles,
        locationCoords: undefined
      });
    }
  };
  
  // Get lat/long for a location string
  const getLocationCoordinates = async (locationString: string) => {
    if (!locationString.trim()) return;
    
    try {
      setGeoLoading(true);
      setGeoError(null);
      
      // Use the geoService to get coordinates
      const geoResult = await geoService.getLatLong(locationString);
      
      if (geoResult.items && geoResult.items.length > 0) {
        const coords = {
          lat: geoResult.items[0].position.lat,
          lng: geoResult.items[0].position.lng
        };
        
        setLocationCoords(coords);

        // Update filters with new coordinates
        onFilterChange({
          searchString,
          styles: selectedStyles,
          distance,
          distanceUnit,
          location: locationString,
          useMyLocation: false,
          useAnyLocation: false,
          applySavedStyles,
          locationCoords: coords
        });
        
        return coords;
      } else {
        setGeoError('No results found for this location');
      }
    } catch (error) {
      console.error('Geolocation error:', error);
      setGeoError(error instanceof Error ? error.message : 'Error finding location');
    } finally {
      setGeoLoading(false);
    }
  };
  
  // Debounce location input for geocoding
  const locationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle location input change
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLocation = e.target.value;
    setLocation(newLocation);
    
    // Only update if using custom location (not my location or anywhere)
    if (!useMyLocation && !useAnyLocation) {
      // Update the search params immediately with the text
      onFilterChange({
        searchString,
        styles: selectedStyles,
        distance,
        distanceUnit,
        location: newLocation,
        useMyLocation: false,
        useAnyLocation: false,
        applySavedStyles,
        locationCoords
      });
      
      // Clear any existing timer
      if (locationTimerRef.current) {
        clearTimeout(locationTimerRef.current);
      }
      
      // Set a new timer to get coordinates after typing stops
      if (newLocation.trim()) {
        locationTimerRef.current = setTimeout(() => {
          getLocationCoordinates(newLocation);
        }, 1000); // 1 second debounce
      } else {
        // If location is cleared, also clear coordinates
        setLocationCoords(undefined);
      }
    }
  };

  // Apply all filters
  const handleApplyFilters = () => {
    onFilterChange({
      searchString,
      styles: selectedStyles,
      distance,
      distanceUnit,
      location,
      useMyLocation,
      useAnyLocation,
      applySavedStyles,
      locationCoords
    });
  };

  // Clear all filters
  const handleClearFilters = async () => {
    const locationSettings = distancePreferences.getDefaultLocationSettings(!!me?.location_lat_long);
    
    setSearchString('');
    setSelectedStyles([]);
    setDistance(locationSettings.distance);
    setDistanceUnit('mi');
    setUseMyLocation(locationSettings.useMyLocation);
    setUseAnyLocation(locationSettings.useAnyLocation);
    setApplySavedStyles(false);
    setLocation(locationSettings.location);
    setLocationCoords(undefined);
    
    // Only try to get location if not dismissed and user has location preference
    if (!distancePreferences.hasUserDismissedDistance() && locationSettings.useMyLocation) {
      try {
        setGeoLoading(true);
        const position = await geoService.getCurrentPosition();
        const myCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setLocationCoords(myCoords);
        
        onFilterChange({
          searchString: '',
          styles: [],
          ...locationSettings,
          distanceUnit: 'mi',
          applySavedStyles: false,
          locationCoords: myCoords
        });
      } catch (error) {
        console.error('Error getting user location:', error);
        
        onFilterChange({
          searchString: '',
          styles: [],
          ...locationSettings,
          distanceUnit: 'mi',
          applySavedStyles: false
        });
      } finally {
        setGeoLoading(false);
      }
    } else {
      // Don't try to get location - use the default settings
      onFilterChange({
        searchString: '',
        styles: [],
        ...locationSettings,
        distanceUnit: 'mi',
        applySavedStyles: false
      });
    }
  };

  // Toggle sidebar expansion
  const toggleSidebar = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Notify parent component if callback exists
    if (onSidebarToggle) {
      onSidebarToggle(newExpandedState);
    }
  };

  return (
    <>
      {/* Loading Overlay */}
      {isLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Paper
            elevation={4}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 2
            }}
          >
            <CircularProgress color="primary" size={48} sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Loading {type}...
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Sidebar */}
      <FilterPaper
        sx={{
          position: 'fixed',
          left: 0,
          top: '96px',
          height: 'calc(100% - 96px)',
          width: isExpanded ? '260px' : '40px',
          transition: 'width 0.3s ease',
          zIndex: 10
        }}
      >
        {/* Toggle button */}
        <IconButton
          onClick={toggleSidebar}
          aria-label={isExpanded ? 'Collapse filter sidebar' : 'Expand filter sidebar'}
          sx={{
            position: 'absolute',
            right: -5,
            top: '20px',
            transform: 'translateX(50%)',
            backgroundColor: 'secondary.main',
             color: 'white',
            '&:hover': {
              backgroundColor: 'secondary.dark',
            },
            width: 32,
            height: 32,
            boxShadow: 2,
            zIndex: 2
          }}
        >
          {isExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>

        {/* Filter content - only show when expanded */}
        {isExpanded && (
          <Box sx={{ 
            width: '100%', 
            height: '100%', 
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column'
          }}>
            
            {/* Search input */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Search
              </Typography>
              <Search>
                <SearchIconWrapper>
                  <SearchIcon />
                </SearchIconWrapper>
                <StyledInputBase
                  placeholder={type === 'artists' ? "Artist name or studio" : "Tattoo description or tags"}
                  value={searchString}
                  onChange={handleSearchChange}
                  inputProps={{ 'aria-label': 'search' }}
                  endAdornment={
                    searchString ? (
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          setSearchString('');
                          onFilterChange({
                            searchString: '',
                            styles: selectedStyles,
                            distance,
                            distanceUnit,
                            location,
                            useMyLocation,
                            useAnyLocation,
                            applySavedStyles,
                            locationCoords
                          });
                        }}
                        sx={{ mr: 1 }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    ) : null
                  }
                />
              </Search>
            </Box>

            {/* Create Tattoo Button for Artists */}
            {me?.type === 'artist' && onCreateTattoo && (
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={onCreateTattoo}
                  fullWidth
                  sx={{
                    py: 1.5,
                    backgroundColor: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    }
                  }}
                >
                  Create Tattoo
                </Button>
              </Box>
            )}

            {/* Location origin selection */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Location:
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={
                      useAnyLocation 
                        ? 'any' 
                        : useMyLocation 
                          ? 'my' 
                          : 'custom'
                    }
                    onChange={(e) => handleLocationOptionChange(e.target.value as 'my' | 'custom' | 'any')}
                  >
                    <FormControlLabel
                        value="any"
                        control={<Radio size="small" color="primary" />}
                        label={<Typography variant="body2">Anywhere</Typography>}
                    />
                    <FormControlLabel 
                      value="my" 
                      control={<Radio size="small" color="primary" />} 
                      label={<Typography variant="body2">Near Me</Typography>}
                    />
                    <FormControlLabel 
                      value="custom" 
                      control={<Radio size="small" color="primary" />} 
                      label={<Typography variant="body2">Near:</Typography>}
                    />
                  </RadioGroup>
                </FormControl>
                
                {/* Only show the location input when custom location is selected */}
                {!useMyLocation && !useAnyLocation && (
                  <TextField
                    placeholder="Enter city, zip, or address"
                    value={location}
                    onChange={handleLocationChange}
                    size="small"
                    fullWidth
                    variant="outlined"
                    error={Boolean(geoError)}
                    helperText={geoError}
                    InputProps={{
                      sx: {
                        fontSize: '0.875rem',
                        '& .MuiOutlinedInput-notchedOutline': { 
                          borderColor: '#e8dbc5'
                        }
                      },
                      endAdornment: geoLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : null
                    }}
                  />
                )}
              </Box>
            </Box>
            
            {/* Distance selection - only show when location-based filtering is active */}
            {(useMyLocation || (!useMyLocation && !useAnyLocation)) && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Distance
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControlLabel
                      value="mi"
                      control={
                        <Radio 
                          size="small" 
                          checked={distanceUnit === 'mi'} 
                          onChange={() => handleDistanceUnitChange('mi')}
                          color="primary"
                        />
                      }
                      label={<Typography variant="body2">miles</Typography>}
                    />
                    <FormControlLabel
                      value="km"
                      control={
                        <Radio 
                          size="small" 
                          checked={distanceUnit === 'km'} 
                          onChange={() => handleDistanceUnitChange('km')}
                          color="primary"
                        />
                      }
                      label={<Typography variant="body2">km</Typography>}
                    />
                  </Box>
                </Box>
                <FormControl fullWidth variant="outlined" size="small" sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e8dbc5' } }}>
                  <Select
                    value={distance}
                    onChange={handleDistanceChange}
                    displayEmpty
                    sx={{ borderColor: '#e8dbc5' }}
                  >
                    {distanceOptions.map(option => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
            
            {/* Apply Saved Search */}
            {me?.styles && me.styles.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={applySavedStyles}
                      onChange={handleApplySavedStylesChange}
                      size="small"
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2">Apply my saved styles</Typography>
                  }
                />
              </Box>
            )}

            {/* Styles */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Styles
              </Typography>
              <StylesContainer>
                {stylesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={20} />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {styles.map(style => (
                      <FormControlLabel
                        key={style.id}
                        control={
                          <Checkbox 
                            checked={selectedStyles.includes(style.id)} 
                            onChange={() => handleStyleChange(style.id)}
                            size="small"
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="body2">{style.name}</Typography>
                        }
                      />
                    ))}
                  </Box>
                )}
              </StylesContainer>
            </Box>
            
            {/* Filter buttons */}
            <Box sx={{ 
              mt: 'auto', 
              pt: 2, 
              borderTop: 1, 
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={handleApplyFilters}
              >
                Apply Filters
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                fullWidth
                onClick={handleClearFilters}
              >
                Clear
              </Button>
            </Box>
          </Box>
        )}
      </FilterPaper>
    </>
  );
};

export default SearchFilters;
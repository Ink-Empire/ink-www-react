import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Box,
  CircularProgress,
  Paper,
  Typography
} from '@mui/material';
import { useStyles } from '@/contexts/StyleContext';
import { useAppGeolocation } from '@/utils/geolocation';
import { useUserData } from '@/contexts/AuthContext';
import { distancePreferences } from '@/utils/distancePreferences';
import { MobileSearchFiltersUI } from './MobileSearchFiltersUI';
import { DesktopSearchFiltersUI } from './DesktopSearchFiltersUI';

interface SearchFiltersProps {
  initialFilters?: {
    searchString?: string;
    styles?: number[];
    tags?: number[];
    distance?: number;
    distanceUnit?: 'mi' | 'km';
    location?: string;
    useMyLocation?: boolean;
    useAnyLocation?: boolean;
    applySavedStyles?: boolean;
    booksOpen?: boolean;
    locationCoords?: {
      lat: number;
      lng: number;
    };
  };
  currentFilters?: {
    searchString?: string;
    styles?: number[];
    tags?: number[];
    distance?: number;
    distanceUnit?: 'mi' | 'km';
    location?: string;
    useMyLocation?: boolean;
    useAnyLocation?: boolean;
    applySavedStyles?: boolean;
    booksOpen?: boolean;
    locationCoords?: {
      lat: number;
      lng: number;
    };
  };
  onFilterChange: (filters: {
    searchString: string;
    styles: number[];
    tags: number[];
    distance: number;
    distanceUnit?: 'mi' | 'km';
    location?: string;
    useMyLocation?: boolean;
    useAnyLocation?: boolean;
    applySavedStyles?: boolean;
    booksOpen?: boolean;
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
  urlStyleName?: string; // Style name from URL to auto-select
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  initialFilters = {},
  currentFilters,
  onFilterChange,
  type,
  onSidebarToggle,
  initialExpanded = true,
  isLoading = false,
  onCreateTattoo,
  urlStyleName
}) => {
  // Mobile detection
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Get contexts
  const { styles } = useStyles();
  const me = useUserData();
  const geoService = useAppGeolocation();

  // Resolve URL style name to ID
  const urlStyleId = useMemo(() => {
    if (!urlStyleName || styles.length === 0) return undefined;
    const found = styles.find(s => s.name.toLowerCase() === urlStyleName.toLowerCase());
    return found?.id;
  }, [urlStyleName, styles]);

  // Compute initial styles including URL style
  const initialStylesWithUrl = useMemo(() => {
    const baseStyles = initialFilters.styles || [];
    if (urlStyleId && !baseStyles.includes(urlStyleId)) {
      return [...baseStyles, urlStyleId];
    }
    return baseStyles;
  }, [initialFilters.styles, urlStyleId]);

  // Filter states
  const [searchString, setSearchString] = useState(initialFilters.searchString || '');
  const [selectedStyles, setSelectedStyles] = useState<number[]>(initialStylesWithUrl);
  const [selectedTags, setSelectedTags] = useState<number[]>(initialFilters.tags || []);
  const [distance, setDistance] = useState<number>(initialFilters.distance || 50);
  const [distanceUnit, setDistanceUnit] = useState<'mi' | 'km'>(initialFilters.distanceUnit || 'mi');
  const [useMyLocation, setUseMyLocation] = useState<boolean>(initialFilters.useMyLocation !== undefined ? initialFilters.useMyLocation : true);
  const [useAnyLocation, setUseAnyLocation] = useState<boolean>(initialFilters.useAnyLocation || false);
  const [applySavedStyles, setApplySavedStyles] = useState<boolean>(initialFilters.applySavedStyles || false);
  const [booksOpen, setBooksOpen] = useState<boolean>(initialFilters.booksOpen || false);
  const [location, setLocation] = useState<string>(initialFilters.location || '');
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | undefined>(initialFilters.locationCoords);
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  // Track geolocation status
  const [geoLoading, setGeoLoading] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Debounce search with timer ref
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const locationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const urlStyleAppliedRef = useRef(false);

  // Apply URL style when it resolves (styles may load async)
  useEffect(() => {
    if (urlStyleId && !urlStyleAppliedRef.current && !selectedStyles.includes(urlStyleId)) {
      urlStyleAppliedRef.current = true;
      const newStyles = [...selectedStyles, urlStyleId];
      setSelectedStyles(newStyles);
      // Immediately trigger search with the URL style
      onFilterChange({
        searchString,
        styles: newStyles,
        tags: selectedTags,
        distance,
        distanceUnit,
        location,
        useMyLocation,
        useAnyLocation,
        applySavedStyles,
        booksOpen,
        locationCoords
      });
    }
  }, [urlStyleId]);

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

      if (currentFilters.tags !== undefined) {
        // Check if arrays are different
        const currentTagsArray = currentFilters.tags || [];
        const isDifferent =
          currentTagsArray.length !== selectedTags.length ||
          currentTagsArray.some(id => !selectedTags.includes(id));

        if (isDifferent) {
          setSelectedTags(currentFilters.tags || []);
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

      if (currentFilters.booksOpen !== undefined &&
          currentFilters.booksOpen !== booksOpen) {
        setBooksOpen(currentFilters.booksOpen);
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
      if (locationTimerRef.current) {
        clearTimeout(locationTimerRef.current);
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
        tags: selectedTags,
        distance,
        distanceUnit,
        location,
        useMyLocation,
        useAnyLocation,
        applySavedStyles,
        booksOpen,
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
      // styles is already an array of numbers
      const userStyleIds = me.styles as number[];
      // Merge without duplicates
      newStyles = Array.from(new Set([...selectedStyles, ...userStyleIds]));
      setSelectedStyles(newStyles);
    }

    // Immediately trigger search with updated styles and applySavedStyles flag
    onFilterChange({
      searchString,
      styles: newStyles,
      tags: selectedTags,
      distance,
      distanceUnit,
      location,
      useMyLocation,
      useAnyLocation,
      applySavedStyles: newApplySavedStyles,
      booksOpen,
      locationCoords
    });
  };

  // Handle books open checkbox change
  const handleBooksOpenChange = () => {
    const newBooksOpen = !booksOpen;
    setBooksOpen(newBooksOpen);

    // Immediately trigger search with updated booksOpen flag
    onFilterChange({
      searchString,
      styles: selectedStyles,
      tags: selectedTags,
      distance,
      distanceUnit,
      location,
      useMyLocation,
      useAnyLocation,
      applySavedStyles,
      booksOpen: newBooksOpen,
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
      tags: selectedTags,
      distance,
      distanceUnit,
      location,
      useMyLocation,
      useAnyLocation,
      applySavedStyles,
      booksOpen,
      locationCoords
    });
  };

  // Handle tag checkbox change
  const handleTagChange = (tagId: number) => {
    // Create new tags array first
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];

    // Update state
    setSelectedTags(newTags);

    // Immediately trigger search with updated tags
    onFilterChange({
      searchString,
      styles: selectedStyles,
      tags: newTags,
      distance,
      distanceUnit,
      location,
      useMyLocation,
      useAnyLocation,
      applySavedStyles,
      booksOpen,
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
      tags: selectedTags,
      distance: newDistance,
      distanceUnit,
      location,
      useMyLocation,
      useAnyLocation,
      applySavedStyles,
      booksOpen,
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
      tags: selectedTags,
      distance,
      distanceUnit: unit,
      location,
      useMyLocation,
      useAnyLocation,
      applySavedStyles,
      booksOpen,
      locationCoords
    });
  };

  // Helper to get lat/lng from user's profile location
  // Handles both string format ("lat,lng") and object format ({lat, lng} or {latitude, longitude})
  const getUserProfileCoords = (): { lat: number; lng: number } | null => {
    const loc = me?.location_lat_long;
    if (!loc) return null;

    // Handle string format: "34.0549076,-118.242643"
    if (typeof loc === 'string') {
      const parts = loc.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
      return null;
    }

    // Handle object format: {lat, lng} or {latitude, longitude}
    const lat = loc.latitude ?? loc.lat;
    const lng = loc.longitude ?? loc.lng;
    if (lat !== undefined && lng !== undefined) {
      return { lat: Number(lat), lng: Number(lng) };
    }
    return null;
  };

  // Handle location option change
  const handleLocationOptionChange = async (locationType: 'my' | 'custom' | 'any') => {
    // Reset state
    setUseMyLocation(locationType === 'my');
    setUseAnyLocation(locationType === 'any');

    if (locationType === 'my') {
      // First try to use user's profile location
      const profileCoords = getUserProfileCoords();

      if (profileCoords) {
        // User has a saved profile location - use it
        setLocationCoords(profileCoords);
        setGeoError(null);

        onFilterChange({
          searchString,
          styles: selectedStyles,
          tags: selectedTags,
          distance,
          distanceUnit,
          location: '',
          useMyLocation: true,
          useAnyLocation: false,
          applySavedStyles,
          booksOpen,
          locationCoords: profileCoords
        });
      } else {
        // No profile location - fall back to browser geolocation
        try {
          setGeoLoading(true);

          const position = await geoService.getCurrentPosition();
          const myCoords = {
            lat: position.latitude,
            lng: position.longitude
          };

          setLocationCoords(myCoords);

          onFilterChange({
            searchString,
            styles: selectedStyles,
            tags: selectedTags,
            distance,
            distanceUnit,
            location: '',
            useMyLocation: true,
            useAnyLocation: false,
            applySavedStyles,
            booksOpen,
            locationCoords: myCoords
          });
        } catch (error) {
          console.error('Error getting user location:', error);
          setGeoError(error instanceof Error ? error.message : 'Error getting your location');

          onFilterChange({
            searchString,
            styles: selectedStyles,
            tags: selectedTags,
            distance,
            distanceUnit,
            location: '',
            useMyLocation: true,
            useAnyLocation: false,
            applySavedStyles,
            booksOpen,
            locationCoords
          });
        } finally {
          setGeoLoading(false);
        }
      }
    } else if (locationType === 'custom') {
      // If switching to custom location, use any existing location text/coords
      onFilterChange({
        searchString,
        styles: selectedStyles,
        tags: selectedTags,
        distance,
        distanceUnit,
        location,
        useMyLocation: false,
        useAnyLocation: false,
        applySavedStyles,
        booksOpen,
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
        tags: selectedTags,
        distance,
        distanceUnit,
        location: '',
        useMyLocation: false,
        useAnyLocation: true,
        applySavedStyles,
        booksOpen,
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
          tags: selectedTags,
          distance,
          distanceUnit,
          location: locationString,
          useMyLocation: false,
          useAnyLocation: false,
          applySavedStyles,
          booksOpen,
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

  // Handle location input change (legacy, kept for compatibility)
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLocation = e.target.value;
    setLocation(newLocation);

    // Only update if using custom location (not my location or anywhere)
    if (!useMyLocation && !useAnyLocation) {
      // Update the search params immediately with the text
      onFilterChange({
        searchString,
        styles: selectedStyles,
        tags: selectedTags,
        distance,
        distanceUnit,
        location: newLocation,
        useMyLocation: false,
        useAnyLocation: false,
        applySavedStyles,
        booksOpen,
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

  // Handle location selection from autocomplete
  const handleLocationSelect = (newLocation: string, coords: { lat: number; lng: number } | undefined) => {
    setLocation(newLocation);
    setLocationCoords(coords);
    setGeoError(null);

    // Immediately trigger search with new location and coordinates
    onFilterChange({
      searchString,
      styles: selectedStyles,
      tags: selectedTags,
      distance,
      distanceUnit,
      location: newLocation,
      useMyLocation: false,
      useAnyLocation: false,
      applySavedStyles,
      booksOpen,
      locationCoords: coords
    });
  };

  // Handle guided search apply - applies all guided search params at once
  const handleGuidedSearchApply = async (data: {
    searchText: string;
    locationType: 'anywhere' | 'near_me' | 'custom' | null;
    customLocation: string;
    locationCoords?: { lat: number; lng: number };
  }) => {
    // Set search string state
    setSearchString(data.searchText);

    // Determine location settings based on locationType
    let newUseMyLocation = false;
    let newUseAnyLocation = false;
    let newLocation = '';
    let newLocationCoords: { lat: number; lng: number } | undefined = undefined;

    if (data.locationType === 'anywhere') {
      newUseAnyLocation = true;
    } else if (data.locationType === 'near_me') {
      newUseMyLocation = true;
      // Try to get coordinates
      const profileCoords = getUserProfileCoords();
      if (profileCoords) {
        newLocationCoords = profileCoords;
      } else {
        try {
          setGeoLoading(true);
          const position = await geoService.getCurrentPosition();
          newLocationCoords = {
            lat: position.latitude,
            lng: position.longitude
          };
        } catch (error) {
          console.error('Error getting user location:', error);
          setGeoError(error instanceof Error ? error.message : 'Error getting your location');
        } finally {
          setGeoLoading(false);
        }
      }
    } else if (data.locationType === 'custom' && data.customLocation) {
      newLocation = data.customLocation;
      newLocationCoords = data.locationCoords;
    }

    // Update all state at once
    setUseMyLocation(newUseMyLocation);
    setUseAnyLocation(newUseAnyLocation);
    setLocation(newLocation);
    setLocationCoords(newLocationCoords);

    // Apply all filters in one call
    onFilterChange({
      searchString: data.searchText,
      styles: selectedStyles,
      tags: selectedTags,
      distance,
      distanceUnit,
      location: newLocation,
      useMyLocation: newUseMyLocation,
      useAnyLocation: newUseAnyLocation,
      applySavedStyles,
      booksOpen,
      locationCoords: newLocationCoords
    });
  };

  // Apply all filters
  const handleApplyFilters = () => {
    onFilterChange({
      searchString,
      styles: selectedStyles,
      tags: selectedTags,
      distance,
      distanceUnit,
      location,
      useMyLocation,
      useAnyLocation,
      applySavedStyles,
      booksOpen,
      locationCoords
    });
  };

  // Clear all filters
  const handleClearFilters = async () => {
    const locationSettings = distancePreferences.getDefaultLocationSettings(!!me?.location_lat_long);

    setSearchString('');
    setSelectedStyles([]);
    setSelectedTags([]);
    setDistance(locationSettings.distance);
    setDistanceUnit('mi');
    setUseMyLocation(locationSettings.useMyLocation);
    setUseAnyLocation(locationSettings.useAnyLocation);
    setApplySavedStyles(false);
    setBooksOpen(false);
    setLocation(locationSettings.location);
    setLocationCoords(undefined);

    // Only try to get location if not dismissed and user has location preference
    if (!distancePreferences.hasUserDismissedDistance() && locationSettings.useMyLocation) {
      // First try user's profile location
      const profileCoords = getUserProfileCoords();

      if (profileCoords) {
        setLocationCoords(profileCoords);

        onFilterChange({
          searchString: '',
          styles: [],
          tags: [],
          ...locationSettings,
          distanceUnit: 'mi',
          applySavedStyles: false,
          booksOpen: false,
          locationCoords: profileCoords
        });
      } else {
        // Fall back to browser geolocation
        try {
          setGeoLoading(true);
          const position = await geoService.getCurrentPosition();
          const myCoords = {
            lat: position.latitude,
            lng: position.longitude
          };

          setLocationCoords(myCoords);

          onFilterChange({
            searchString: '',
            styles: [],
            tags: [],
            ...locationSettings,
            distanceUnit: 'mi',
            applySavedStyles: false,
            booksOpen: false,
            locationCoords: myCoords
          });
        } catch (error) {
          console.error('Error getting user location:', error);

          onFilterChange({
            searchString: '',
            styles: [],
            tags: [],
            ...locationSettings,
            distanceUnit: 'mi',
            applySavedStyles: false,
            booksOpen: false
          });
        } finally {
          setGeoLoading(false);
        }
      }
    } else {
      // Don't try to get location - use the default settings
      onFilterChange({
        searchString: '',
        styles: [],
        tags: [],
        ...locationSettings,
        distanceUnit: 'mi',
        applySavedStyles: false,
        booksOpen: false
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

  // Prepare props for UI components
  const uiProps = {
    type,
    searchString,
    selectedStyles,
    selectedTags,
    distance,
    distanceUnit,
    useMyLocation,
    useAnyLocation,
    applySavedStyles,
    booksOpen,
    location,
    locationCoords,
    geoLoading,
    geoError,
    onSearchChange: handleSearchChange,
    onApplySavedStylesChange: handleApplySavedStylesChange,
    onBooksOpenChange: handleBooksOpenChange,
    onStyleChange: handleStyleChange,
    onTagChange: handleTagChange,
    onDistanceChange: handleDistanceChange,
    onDistanceUnitChange: handleDistanceUnitChange,
    onLocationOptionChange: handleLocationOptionChange,
    onLocationChange: handleLocationChange,
    onLocationSelect: handleLocationSelect,
    onApplyFilters: handleApplyFilters,
    onClearFilters: handleClearFilters,
    onGuidedSearchApply: handleGuidedSearchApply,
    onCreateTattoo
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

      {/* Render appropriate UI based on screen size */}
      {isMobile ? (
        <MobileSearchFiltersUI
          {...uiProps}
          isExpanded={isExpanded}
          onToggleSidebar={toggleSidebar}
        />
      ) : (
        <DesktopSearchFiltersUI
          {...uiProps}
          isExpanded={isExpanded}
          onToggleSidebar={toggleSidebar}
        />
      )}
    </>
  );
};
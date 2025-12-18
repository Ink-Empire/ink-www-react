import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Box, Typography, Select, MenuItem, FormControl, IconButton, Button } from "@mui/material";
import { useTheme, useMediaQuery } from "@mui/material";
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import FilterListIcon from '@mui/icons-material/FilterList';
import TattooCard from "../components/TattooCard";
import TattooModal from "../components/TattooModal";
import SearchFilters from "../components/SearchFilters";
import Layout from "../components/Layout";
import TattooCreateWizard from "../components/TattooCreateWizard";
import { useTattoos } from "../hooks";
import { useUserData, useAuth } from "@/contexts/AuthContext";
import { useStyles } from "@/contexts/StyleContext";
import { distancePreferences } from "@/utils/distancePreferences";
import { colors } from "@/styles/colors";

export default function TattoosPage() {
  const me = useUserData();
  const { isAuthenticated } = useAuth();
  const { styles } = useStyles();
  const router = useRouter();
  const { studio_id } = router.query;
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // State for studio name (for filter display)
  const [studioName, setStudioName] = useState<string>("");

  // State for Create Tattoo modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // State for Tattoo detail modal
  const [selectedTattooId, setSelectedTattooId] = useState<string | null>(null);
  const [isTattooModalOpen, setIsTattooModalOpen] = useState(false);

  // State to track dismissed styles (to prevent them from returning)
  const [dismissedStyles, setDismissedStyles] = useState<number[]>([]);

  // UI state
  const [sortBy, setSortBy] = useState('relevant');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Handler for opening tattoo modal
  const handleTattooClick = (tattooId: string) => {
    setSelectedTattooId(tattooId);
    setIsTattooModalOpen(true);
  };

  // Handler for closing tattoo modal
  const handleCloseTattooModal = () => {
    setIsTattooModalOpen(false);
    setSelectedTattooId(null);
  };

  const getTattooFavoriteStatus = (tattooId: string) => {
    if (!me?.tattoos) return false;
    return me.tattoos.includes(parseInt(tattooId));
  };

  const getArtistFollowStatus = (artistId: number) => {
    if (!me?.artists) return false;
    return me.artists.includes(artistId);
  };

  const getCurrentTattoo = () => {
    if (!selectedTattooId || !tattoos?.response) return null;
    return tattoos.response.find((t: any) => t.id.toString() === selectedTattooId);
  };

  // Get current tattoo index for navigation
  const getCurrentTattooIndex = () => {
    if (!selectedTattooId || !tattoos?.response) return -1;
    return tattoos.response.findIndex((t: any) => t.id.toString() === selectedTattooId);
  };

  // Navigation handlers
  const handlePreviousTattoo = () => {
    const currentIndex = getCurrentTattooIndex();
    if (currentIndex > 0) {
      setSelectedTattooId(tattoos.response[currentIndex - 1].id.toString());
    }
  };

  const handleNextTattoo = () => {
    const currentIndex = getCurrentTattooIndex();
    if (currentIndex < tattoos.response.length - 1) {
      setSelectedTattooId(tattoos.response[currentIndex + 1].id.toString());
    }
  };

  // Initialize with user preferences
  const initialSearchParams = useMemo(() => {
    const locationSettings = distancePreferences.getDefaultLocationSettings(!!me?.location_lat_long);

    return {
      searchString: router.query.searchString || "",
      styles: [],
      applySavedStyles: false,
      booksOpen: false,
      ...locationSettings,
      distanceUnit: "mi",
      subject: "tattoos",
      studio_id: studio_id || undefined,
    };
  }, [me?.location_lat_long, studio_id, router.query.searchString]);

  const [searchParams, setSearchParams] = useState<Record<string, any>>(initialSearchParams);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const { tattoos, loading, error } = useTattoos(searchParams);

  // When we get tattoo data back, try to find the studio name based on the studio_id
  useEffect(() => {
    if (tattoos?.response && Array.isArray(tattoos.response) && studio_id) {
      const studioIdStr = String(studio_id);
      const tattooWithStudio = tattoos.response.find(
        (tattoo) => tattoo.studio && String(tattoo.studio.id) === studioIdStr
      );
      if (tattooWithStudio?.studio?.name) {
        setStudioName(tattooWithStudio.studio.name);
      }
    }
  }, [tattoos, studio_id]);

  // Update searchParams when studio_id changes in the URL
  useEffect(() => {
    if (studio_id) {
      setSearchParams((prev) => ({ ...prev, studio_id }));
    }
  }, [studio_id]);

  // Update searchParams when searchString query parameter changes
  useEffect(() => {
    if (router.query.searchString) {
      setSearchParams((prev) => ({
        ...prev,
        searchString: router.query.searchString as string
      }));
    }
  }, [router.query.searchString]);

  // Update searchParams when styleSearch query parameter changes
  useEffect(() => {
    if (router.query.styleSearch && styles.length > 0) {
      const styleSearchName = router.query.styleSearch as string;
      const matchingStyle = styles.find(style =>
        style.name.toLowerCase() === styleSearchName.toLowerCase()
      );
      if (matchingStyle) {
        setSearchParams((prev) => ({
          ...prev,
          styles: [matchingStyle.id],
          searchString: ""
        }));
      }
    }
  }, [router.query.styleSearch, styles]);

  // Handle filter changes from SearchFilters component
  const handleFilterChange = (filters: {
    searchString: string;
    styles: number[];
    distance: number;
    distanceUnit?: "mi" | "km";
    location?: string;
    useMyLocation?: boolean;
    useAnyLocation?: boolean;
    applySavedStyles?: boolean;
    booksOpen?: boolean;
    locationCoords?: { lat: number; lng: number };
  }) => {
    let finalStyles = filters?.styles || [];
    if (filters.applySavedStyles && me?.styles) {
      const userStyleIds = me.styles.map(style => style.id || style);
      const mergedStyles = [...new Set([...finalStyles, ...userStyleIds])];
      finalStyles = mergedStyles.filter(style => !dismissedStyles.includes(style));
    }

    const newParams: Record<string, any> = {
      searchString: filters.searchString,
      styles: finalStyles,
      distance: filters.distance,
      distanceUnit: filters.distanceUnit,
      location: filters.location,
      useMyLocation: filters.useMyLocation,
      useAnyLocation: filters.useAnyLocation,
      applySavedStyles: filters.applySavedStyles,
      booksOpen: filters.booksOpen,
      subject: "tattoos",
    };

    if (studio_id) {
      newParams.studio_id = studio_id;
    }

    if (filters.locationCoords && filters.locationCoords.lat && filters.locationCoords.lng) {
      newParams.locationCoords = `${filters.locationCoords.lat},${filters.locationCoords.lng}`;
    }

    if (filters.useMyLocation) {
      delete newParams.locationCoords;
    } else if (filters.useAnyLocation) {
      delete newParams.locationCoords;
    }

    setSearchParams(newParams);
  };

  // Get active filters for display
  const getActiveFilters = () => {
    const filters: { label: string; key: string; value?: any }[] = [];

    if (searchParams.searchString) {
      filters.push({ label: `"${searchParams.searchString}"`, key: 'search' });
    }

    if (searchParams.styles && searchParams.styles.length > 0) {
      searchParams.styles.forEach((styleId: number) => {
        const style = styles.find(s => s.id === styleId);
        if (style) {
          filters.push({ label: style.name, key: 'style', value: styleId });
        }
      });
    }

    if (searchParams.useMyLocation) {
      filters.push({ label: 'Near me', key: 'location' });
    } else if (searchParams.useAnyLocation) {
      filters.push({ label: 'Anywhere', key: 'location' });
    } else if (searchParams.location) {
      filters.push({ label: searchParams.location, key: 'location' });
    }

    if (searchParams.distance && !searchParams.useAnyLocation) {
      filters.push({ label: `Within ${searchParams.distance} ${searchParams.distanceUnit || 'mi'}`, key: 'distance' });
    }

    if (searchParams.booksOpen) {
      filters.push({ label: 'Books Open', key: 'booksOpen' });
    }

    if (studioName) {
      filters.push({ label: studioName, key: 'studio' });
    }

    return filters;
  };

  // Remove individual filter
  const handleRemoveFilter = (key: string, value?: any) => {
    const newParams = { ...searchParams };

    switch (key) {
      case 'search':
        newParams.searchString = '';
        break;
      case 'style':
        setDismissedStyles(prev => [...prev, value]);
        newParams.styles = newParams.styles.filter((id: number) => id !== value);
        break;
      case 'location':
        newParams.useAnyLocation = true;
        newParams.useMyLocation = false;
        newParams.location = '';
        break;
      case 'distance':
        distancePreferences.setDistanceDismissed();
        newParams.distance = '';
        newParams.useAnyLocation = true;
        newParams.useMyLocation = false;
        break;
      case 'booksOpen':
        newParams.booksOpen = false;
        break;
      case 'studio':
        router.push("/tattoos", undefined, { shallow: true });
        delete newParams.studio_id;
        break;
    }

    setSearchParams(newParams);
  };

  const activeFilters = getActiveFilters();
  const tattooCount = tattoos?.response?.length || 0;

  return (
    <Layout>
      <Head>
        <title>Browse Tattoos | InkedIn</title>
        <meta name="description" content="Browse our collection of amazing tattoos" />
        <link rel="icon" href="/assets/img/logo.png" />
      </Head>

      {/* Search Filters Sidebar */}
      <SearchFilters
        type="tattoos"
        onFilterChange={handleFilterChange}
        initialFilters={{
          searchString: initialSearchParams.searchString,
          styles: initialSearchParams.styles,
          distance: initialSearchParams.distance,
          distanceUnit: initialSearchParams.distanceUnit,
          useMyLocation: initialSearchParams.useMyLocation,
          useAnyLocation: initialSearchParams.useAnyLocation,
          applySavedStyles: initialSearchParams.applySavedStyles,
          booksOpen: initialSearchParams.booksOpen,
          location: initialSearchParams.location,
        }}
        currentFilters={{
          searchString: searchParams.searchString,
          styles: searchParams.styles,
          distance: searchParams.distance,
          distanceUnit: searchParams.distanceUnit,
          useMyLocation: searchParams.useMyLocation,
          useAnyLocation: searchParams.useAnyLocation,
          applySavedStyles: searchParams.applySavedStyles,
          booksOpen: searchParams.booksOpen,
          location: searchParams.location,
          locationCoords: searchParams.locationCoords,
        }}
        onSidebarToggle={setSidebarExpanded}
        initialExpanded={sidebarExpanded}
        isLoading={loading}
        onCreateTattoo={() => setIsCreateModalOpen(true)}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          ml: isDesktop ? (sidebarExpanded ? '280px' : '48px') : 0,
          transition: 'margin-left 0.3s ease',
          p: { xs: '1rem', md: '1.5rem 2rem' },
          minWidth: 0
        }}
      >
        {/* Results Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <Box>
            <Typography sx={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: colors.textPrimary,
              mb: '0.25rem'
            }}>
              Browse Tattoos
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary }}>
              <Box component="strong" sx={{ color: colors.accent }}>
                {tattooCount}
              </Box>
              {' '}tattoos available
            </Typography>
          </Box>

          <Box sx={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center'
          }}>
            {/* Mobile Filter Button */}
            {!isDesktop && (
              <Button
                onClick={() => setSidebarExpanded(true)}
                startIcon={<FilterListIcon />}
                sx={{
                  color: colors.textPrimary,
                  border: `1px solid ${colors.textPrimary}33`,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: colors.accent,
                    color: colors.accent
                  }
                }}
              >
                Filters
              </Button>
            )}

            {/* Sort Dropdown */}
            <FormControl size="small">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                sx={{
                  bgcolor: colors.surface,
                  color: colors.textPrimary,
                  fontSize: '0.875rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${colors.textPrimary}1A`
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${colors.textPrimary}1A`
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.accent
                  },
                  '& .MuiSelect-icon': { color: colors.textSecondary }
                }}
              >
                <MenuItem value="relevant">Most Relevant</MenuItem>
                <MenuItem value="recent">Most Recent</MenuItem>
                <MenuItem value="popular">Most Popular</MenuItem>
                <MenuItem value="nearest">Nearest</MenuItem>
              </Select>
            </FormControl>

            {/* View Toggle */}
            <Box sx={{
              display: { xs: 'none', sm: 'flex' },
              bgcolor: colors.surface,
              borderRadius: '6px',
              p: '3px'
            }}>
              <IconButton
                onClick={() => setViewMode('grid')}
                sx={{
                  p: '0.5rem 0.75rem',
                  borderRadius: '4px',
                  color: viewMode === 'grid' ? colors.accent : colors.textSecondary,
                  bgcolor: viewMode === 'grid' ? colors.background : 'transparent',
                  '&:hover': { color: colors.textPrimary }
                }}
              >
                <GridViewIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton
                onClick={() => setViewMode('list')}
                sx={{
                  p: '0.5rem 0.75rem',
                  borderRadius: '4px',
                  color: viewMode === 'list' ? colors.accent : colors.textSecondary,
                  bgcolor: viewMode === 'list' ? colors.background : 'transparent',
                  '&:hover': { color: colors.textPrimary }
                }}
              >
                <ViewListIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            mb: '1.25rem'
          }}>
            {activeFilters.map((filter, index) => (
              <Box
                key={`${filter.key}-${index}`}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  px: '0.75rem',
                  py: '0.4rem',
                  bgcolor: `${colors.accent}1A`,
                  border: `1px solid ${colors.accent}4D`,
                  borderRadius: '100px',
                  fontSize: '0.8rem',
                  color: colors.accent
                }}
              >
                {filter.label}
                <Box
                  component="button"
                  onClick={() => handleRemoveFilter(filter.key, filter.value)}
                  sx={{
                    background: 'none',
                    border: 'none',
                    color: colors.accent,
                    cursor: 'pointer',
                    p: 0,
                    fontSize: '1rem',
                    lineHeight: 1,
                    opacity: 0.7,
                    transition: 'opacity 0.15s ease',
                    '&:hover': { opacity: 1 }
                  }}
                >
                  ×
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Tattoos Grid */}
        {error ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ color: colors.error }}>Error: {error.message}</Typography>
          </Box>
        ) : tattooCount === 0 && !loading ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography sx={{
              color: colors.textSecondary,
              fontSize: '1.1rem',
              mb: 1
            }}>
              No tattoos found for your search
            </Typography>
            <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
              Try adjusting your filters or search terms
            </Typography>
          </Box>
        ) : (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(auto-fill, minmax(280px, 1fr))'
            },
            gap: '1.25rem'
          }}>
            {tattoos?.response &&
              Array.isArray(tattoos.response) &&
              tattoos.response.map((tattoo: any) => (
                <TattooCard
                  key={tattoo.id}
                  tattoo={tattoo}
                  onTattooClick={handleTattooClick}
                />
              ))}
          </Box>
        )}
      </Box>

      {/* Create Tattoo Modal */}
      {isCreateModalOpen && (
        <TattooCreateWizard
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            window.location.reload();
          }}
        />
      )}

      <TattooModal
        tattooId={selectedTattooId}
        open={isTattooModalOpen}
        onClose={handleCloseTattooModal}
        onPrevious={handlePreviousTattoo}
        onNext={handleNextTattoo}
        hasPrevious={getCurrentTattooIndex() > 0}
        hasNext={tattoos?.response ? getCurrentTattooIndex() < tattoos.response.length - 1 : false}
        tattooFavorite={selectedTattooId ? getTattooFavoriteStatus(selectedTattooId) : false}
        artistFavorite={getCurrentTattoo()?.artist?.id ? getArtistFollowStatus(getCurrentTattoo().artist.id) : false}
      />
    </Layout>
  );
}

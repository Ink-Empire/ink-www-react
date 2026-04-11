import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Box, Typography, Select, MenuItem, FormControl, Button, CircularProgress, Tooltip, IconButton } from "@mui/material";
import { useTheme, useMediaQuery } from "@mui/material";
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TattooCard from "../components/TattooCard";
import TattooModal from "../components/TattooModal";
import SearchFilters from "../components/SearchFilters";
import Layout from "../components/Layout";
import TattooCreateWizard from "../components/TattooCreateWizard";
import UnclaimedStudioCard from "../components/UnclaimedStudioCard";
import { useTattoos, UnclaimedStudio } from "../hooks";
import { useUserData, useAuth } from "@/contexts/AuthContext";
import { useStyles } from "@/contexts/StyleContext";
import { useTags } from "@/contexts/TagContext";
import { distancePreferences } from "@/utils/distancePreferences";
import { colors } from "@/styles/colors";
import { useDemoMode } from "@/contexts/DemoModeContext";
import EmptyStateFoundingArtist from "@/components/EmptyStateFoundingArtist";

export default function TattoosPage() {
  const me = useUserData();
  const { isAuthenticated } = useAuth();
  const { isDemoMode } = useDemoMode();
  const { styles } = useStyles();
  const { tags } = useTags();
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

  // State for new user fallback (remove location filter if no results)
  const [hasAttemptedFallback, setHasAttemptedFallback] = useState(false);

  // Quick filter toggles - seeking defaults ON for artists (type 2), OFF for clients (type 1)
  const [showFlash, setShowFlash] = useState(false);
  const [showSeeking, setShowSeeking] = useState(me?.type_id === 2);

  // Update seeking default when user data loads
  useEffect(() => {
    if (me?.type_id === 2) {
      setShowSeeking(true);
    }
  }, [me?.type_id]);

  // UI state
  const [sortBy, setSortBy] = useState<string>('relevant');

  // Map UI sort values to API sort values
  const getSortParam = (uiSort: string) => {
    switch (uiSort) {
      case 'popular': return 'popular';
      case 'recent': return 'recent';
      case 'nearest': return 'nearest';
      default: return undefined; // 'relevant' uses default sorting
    }
  };

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
    if (!selectedTattooId || !tattoos) return null;
    return tattoos.find((t: any) => t.id.toString() === selectedTattooId);
  };

  // Get current tattoo index for navigation
  const getCurrentTattooIndex = () => {
    if (!selectedTattooId || !tattoos) return -1;
    return tattoos.findIndex((t: any) => t.id.toString() === selectedTattooId);
  };

  // Navigation handlers
  const handlePreviousTattoo = () => {
    const currentIndex = getCurrentTattooIndex();
    if (currentIndex > 0) {
      setSelectedTattooId(tattoos[currentIndex - 1].id.toString());
    }
  };

  const handleNextTattoo = () => {
    const currentIndex = getCurrentTattooIndex();
    if (currentIndex < tattoos.length - 1) {
      setSelectedTattooId(tattoos[currentIndex + 1].id.toString());
    }
  };

  // Parse URL query params for styles and tags
  const getStylesFromQuery = () => {
    const stylesParam = router.query.styles;
    if (!stylesParam) return [];
    if (Array.isArray(stylesParam)) return stylesParam.map(Number).filter(n => !isNaN(n));
    // Handle comma-separated string (e.g., "1,2,3")
    if (typeof stylesParam === 'string' && stylesParam.includes(',')) {
      return stylesParam.split(',').map(Number).filter(n => !isNaN(n));
    }
    return [Number(stylesParam)].filter(n => !isNaN(n));
  };

  // Parse location coordinates from URL (format: "lat,lng")
  const getLocationCoordsFromQuery = () => {
    const coordsParam = router.query.locationCoords as string;
    if (!coordsParam) return null;
    const parts = coordsParam.split(',');
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    return null;
  };

  // Check if this is a new user redirect that should try location fallback
  const isNewUserRedirect = router.query.newUser === 'true';

  const getTagsFromQuery = () => {
    const tagsParam = router.query.tags;
    if (!tagsParam) return [];
    if (Array.isArray(tagsParam)) return tagsParam.map(Number).filter(n => !isNaN(n));
    return [Number(tagsParam)].filter(n => !isNaN(n));
  };

  // Get tag names from query (for direct tag name filtering)
  const getTagNamesFromQuery = (): string[] => {
    const tagParam = router.query.tag;
    if (!tagParam) return [];
    if (Array.isArray(tagParam)) return tagParam.filter(Boolean);
    return [tagParam].filter(Boolean);
  };

  // Initialize with user preferences
  const initialSearchParams = useMemo(() => {
    const locationSettings = distancePreferences.getDefaultLocationSettings(!!me?.location_lat_long);
    const urlLocationCoords = getLocationCoordsFromQuery();
    const urlDistance = router.query.distance ? parseInt(router.query.distance as string, 10) : null;

    // If URL has location coords, use those instead of default settings
    const locationOverrides: Record<string, any> = {};
    if (urlLocationCoords && urlDistance) {
      locationOverrides.locationCoords = urlLocationCoords;
      locationOverrides.distance = urlDistance;
      locationOverrides.useAnyLocation = false;
      locationOverrides.useMyLocation = false;
      // Set location for API query
      locationOverrides.artist_near_me = {
        latitude: urlLocationCoords.lat,
        longitude: urlLocationCoords.lng
      };
    }

    return {
      searchString: (router.query.search || router.query.searchString || "") as string,
      styles: getStylesFromQuery(),
      tags: getTagsFromQuery(),
      tagNames: getTagNamesFromQuery(),
      applySavedStyles: false,
      booksOpen: false,
      ...locationSettings,
      ...locationOverrides,
      distanceUnit: "mi",
      subject: "tattoos",
      studio_id: studio_id || undefined,
      post_types: me?.type_id === 2 ? ['portfolio', 'seeking'] : ['portfolio'],
    };
  }, [me?.location_lat_long, me?.type_id, studio_id, router.query.searchString, router.query.search, router.query.styles, router.query.tags, router.query.tag, router.query.locationCoords, router.query.distance]);

  // Check if there's a style in the URL to pass to SearchFilters
  const urlStyleParam = (router.query.styleSearch || router.query.style) as string | undefined;

  const [searchParams, setSearchParams] = useState<Record<string, any>>(() => initialSearchParams);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Merge sortBy directly into the params passed to the hook so it always reflects the dropdown
  const effectiveSearchParams = useMemo(() => {
    const sortParam = getSortParam(sortBy);
    if (sortParam) {
      return { ...searchParams, sort: sortParam };
    }
    const { sort, ...rest } = searchParams;
    return rest;
  }, [searchParams, sortBy]);

  // Fetch tattoos based on search params
  const { tattoos, unclaimedStudios, total, loading, loadingMore, error, hasMore, loadMore } = useTattoos(effectiveSearchParams, me?.blocked_user_ids);

  // Ref for infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadMore]);

  const getInterleavedResults = () => {
    if (!tattoos || !unclaimedStudios || unclaimedStudios.length === 0) {
      return tattoos?.map(tattoo => ({ type: 'tattoo' as const, data: tattoo })) || [];
    }

    const results: Array<{ type: 'tattoo' | 'unclaimed_studio'; data: any }> = [];
    let studioIndex = 0;

    tattoos.forEach((tattoo, index) => {
      results.push({ type: 'tattoo', data: tattoo });
      // Insert an unclaimed studio after every 6 tattoos
      if ((index + 1) % 6 === 0 && studioIndex < unclaimedStudios.length) {
        results.push({ type: 'unclaimed_studio', data: unclaimedStudios[studioIndex] });
        studioIndex++;
      }
    });

    // Add remaining studios at the end
    while (studioIndex < unclaimedStudios.length) {
      results.push({ type: 'unclaimed_studio', data: unclaimedStudios[studioIndex] });
      studioIndex++;
    }

    return results;
  };

  const interleavedResults = getInterleavedResults();

  // New user fallback: if no results with location filter, try without location
  useEffect(() => {
    if (
      isNewUserRedirect &&
      !loading &&
      !hasAttemptedFallback &&
      tattoos &&
      tattoos.length === 0 &&
      (searchParams.artist_near_me || searchParams.locationCoords)
    ) {
      console.log('New user search returned 0 results with location - removing location filter');
      setHasAttemptedFallback(true);
      setSearchParams((prev) => {
        const newParams = { ...prev };
        delete newParams.artist_near_me;
        delete newParams.locationCoords;
        delete newParams.distance;
        newParams.useAnyLocation = true;
        return newParams;
      });
      // Also update URL to remove location params
      const newQuery = { ...router.query };
      delete newQuery.locationCoords;
      delete newQuery.distance;
      delete newQuery.newUser;
      router.replace({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
    }
  }, [isNewUserRedirect, loading, tattoos, searchParams, hasAttemptedFallback, router]);

  // When we get tattoo data back, try to find the studio name based on the studio_id
  useEffect(() => {
    if (tattoos && Array.isArray(tattoos) && studio_id) {
      const studioIdStr = String(studio_id);
      const tattooWithStudio = tattoos.find(
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

  // Update searchParams when quick filter toggles change
  useEffect(() => {
    const postTypes: string[] = ['portfolio'];
    if (showFlash) postTypes.push('flash');
    if (showSeeking) postTypes.push('seeking');
    setSearchParams((prev) => {
      const prevTypes = prev.post_types;
      if (JSON.stringify(prevTypes) === JSON.stringify(postTypes)) return prev;
      return { ...prev, post_types: postTypes };
    });
  }, [showFlash, showSeeking]);

  // Update searchParams when URL query parameters change
  useEffect(() => {
    const searchString = (router.query.search || router.query.searchString) as string;
    const stylesFromUrl = getStylesFromQuery();
    const tagsFromUrl = getTagsFromQuery();
    const tagNamesFromUrl = getTagNamesFromQuery();
    const urlLocationCoords = getLocationCoordsFromQuery();
    const urlDistance = router.query.distance ? parseInt(router.query.distance as string, 10) : null;

    const updates: Record<string, any> = {};

    if (searchString) updates.searchString = searchString;
    if (stylesFromUrl.length > 0) updates.styles = stylesFromUrl;
    if (tagsFromUrl.length > 0) updates.tags = tagsFromUrl;
    if (tagNamesFromUrl.length > 0) updates.tagNames = tagNamesFromUrl;

    // Handle location from URL (for new user redirect)
    if (urlLocationCoords && urlDistance) {
      updates.locationCoords = urlLocationCoords;
      updates.distance = urlDistance;
      updates.useAnyLocation = false;
      updates.artist_near_me = {
        latitude: urlLocationCoords.lat,
        longitude: urlLocationCoords.lng
      };
    }

    if (Object.keys(updates).length > 0) {
      setSearchParams((prev) => ({ ...prev, ...updates }));
    }
  }, [router.query.search, router.query.searchString, router.query.styles, router.query.tags, router.query.tag, router.query.locationCoords, router.query.distance]);

  // Handle filter changes from SearchFilters component
  const handleFilterChange = (filters: {
    searchString: string;
    styles: number[];
    tags: number[];
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
      tags: filters.tags || [],
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

    // Preserve post_types from quick filter toggles
    const postTypes: string[] = ['portfolio'];
    if (showFlash) postTypes.push('flash');
    if (showSeeking) postTypes.push('seeking');
    newParams.post_types = postTypes;

    // Sort is merged in via effectiveSearchParams from sortBy state

    // Store locationCoords as object for passing back to SearchFilters
    // Also create string version for API calls
    if (filters.locationCoords && filters.locationCoords.lat && filters.locationCoords.lng) {
      newParams.locationCoords = filters.locationCoords; // Keep as object
      newParams.locationCoordsString = `${filters.locationCoords.lat},${filters.locationCoords.lng}`; // String for API
    }

    if (filters.useMyLocation) {
      // Keep locationCoords from browser geolocation for "Near me"
      // The coords are passed from SearchFilters after getting browser position
    } else if (filters.useAnyLocation) {
      // "Anywhere" - remove location filtering
      delete newParams.locationCoords;
      delete newParams.locationCoordsString;
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

    if (searchParams.tags && searchParams.tags.length > 0) {
      searchParams.tags.forEach((tagId: number) => {
        const tag = tags.find(t => t.id === tagId);
        if (tag) {
          filters.push({ label: tag.name, key: 'tag', value: tagId });
        }
      });
    }

    // Also show tagNames (when filtering by tag name directly, e.g., from TattooModal)
    if (searchParams.tagNames && searchParams.tagNames.length > 0) {
      searchParams.tagNames.forEach((tagName: string) => {
        filters.push({ label: tagName, key: 'tagName', value: tagName });
      });
    }

    if (searchParams.useMyLocation) {
      filters.push({ label: 'Near me', key: 'location' });
    } else if (searchParams.useAnyLocation) {
      // "Anywhere" is shown but marked as non-restrictive (default state)
      filters.push({ label: 'Anywhere', key: 'location', isDefault: true });
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
      case 'tag':
        newParams.tags = newParams.tags.filter((id: number) => id !== value);
        break;
      case 'tagName':
        newParams.tagNames = (newParams.tagNames || []).filter((name: string) => name !== value);
        // Also clear URL query param
        if (newParams.tagNames.length === 0) {
          router.push('/tattoos', undefined, { shallow: true });
        }
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

  // Determine if there's an active search query (filters applied)
  const hasActiveSearch = !!(
    searchParams.searchString ||
    (searchParams.styles && searchParams.styles.length > 0) ||
    (searchParams.tags && searchParams.tags.length > 0) ||
    (searchParams.tagNames && searchParams.tagNames.length > 0)
  );

  // Only use total when there's an active search, otherwise just use array length for display
  const tattooCount = hasActiveSearch ? (total || tattoos?.length || 0) : (tattoos?.length || 0);

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
          searchString: initialSearchParams.searchString as string,
          styles: initialSearchParams.styles as number[],
          tags: initialSearchParams.tags as number[],
          distance: initialSearchParams.distance as number,
          distanceUnit: initialSearchParams.distanceUnit as 'mi' | 'km',
          useMyLocation: initialSearchParams.useMyLocation as boolean,
          useAnyLocation: initialSearchParams.useAnyLocation as boolean,
          applySavedStyles: initialSearchParams.applySavedStyles as boolean,
          booksOpen: initialSearchParams.booksOpen as boolean,
          location: initialSearchParams.location as string,
        }}
        currentFilters={{
          searchString: searchParams.searchString,
          styles: searchParams.styles,
          tags: searchParams.tags,
          distance: searchParams.distance,
          distanceUnit: searchParams.distanceUnit,
          useMyLocation: searchParams.useMyLocation,
          useAnyLocation: searchParams.useAnyLocation,
          applySavedStyles: searchParams.applySavedStyles,
          booksOpen: searchParams.booksOpen,
          location: searchParams.location,
          locationCoords: searchParams.locationCoords,
        }}
        urlStyleName={urlStyleParam}
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
          minWidth: 0,
          minHeight: { md: 'calc(100vh - 64px)' }
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
              Discover amazing tattoos and artists
            </Typography>
          </Box>

          <Box sx={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            flexWrap: 'wrap',
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

            {/* Quick Filter Chips */}
            <Box
              component="button"
              onClick={() => setShowFlash(!showFlash)}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                px: '0.85rem',
                py: '0.45rem',
                borderRadius: '100px',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: `1px solid ${showFlash ? colors.flash : colors.border}`,
                bgcolor: showFlash ? colors.flashDim : 'transparent',
                color: showFlash ? colors.flash : colors.textSecondary,
                '&:hover': {
                  borderColor: colors.flash,
                  color: colors.flash,
                },
              }}
            >
              <FlashOnIcon sx={{ fontSize: 14 }} />
              Flash
            </Box>
            <Box
              component="button"
              onClick={() => setShowSeeking(!showSeeking)}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                px: '0.85rem',
                py: '0.45rem',
                borderRadius: '100px',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: `1px solid ${showSeeking ? colors.seeking : colors.border}`,
                bgcolor: showSeeking ? colors.seekingDim : 'transparent',
                color: showSeeking ? colors.seeking : colors.textSecondary,
                '&:hover': {
                  borderColor: colors.seeking,
                  color: colors.seeking,
                },
              }}
            >
              <SearchIcon sx={{ fontSize: 14 }} />
              Seeking Work
            </Box>

            {/* What's this? info tooltip */}
            <Tooltip
              arrow
              placement="bottom-end"
              title={
                <Box sx={{ p: '0.25rem', maxWidth: 260 }}>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, mb: '0.4rem', color: '#fff' }}>
                    What do these show?
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', mb: '0.35rem', color: '#fff' }}>
                    <Box component="span" sx={{ color: colors.flash, fontWeight: 600 }}>Flash</Box>
                    {' — '}available designs artists are ready to tattoo, often with a set price.
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#fff' }}>
                    <Box component="span" sx={{ color: colors.seeking, fontWeight: 600 }}>Seeking Work</Box>
                    {' — '}clients looking for an artist to bring their idea to life.
                  </Typography>
                </Box>
              }
            >
              <IconButton
                size="small"
                aria-label="What do these toggles show?"
                sx={{
                  color: colors.textSecondary,
                  '&:hover': { color: colors.accent },
                }}
              >
                <InfoOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

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
        ) : tattooCount === 0 && unclaimedStudios.length === 0 && !loading ? (
          // Show "founding artists" CTA when live site is empty (no demo mode, no restrictive filters)
          // Only count non-default filters as restrictive
          !isDemoMode && activeFilters.filter(f => !(f as any).isDefault).length === 0 && !showFlash && !showSeeking ? (
            <Box sx={{ py: 6 }}>
              <EmptyStateFoundingArtist />
            </Box>
          ) : (() => {
            const isArtist = me?.type_id === 2;
            // Contextual messages based on which post-type chip(s) are active
            let title = 'Nothing matches that search';
            let subtitle = 'Try removing some filters to see more results';
            let ctaLabel: string | null = null;
            let ctaAction: (() => void) | null = null;

            if (showFlash && !showSeeking) {
              title = 'No flash posts available';
              if (isArtist) {
                subtitle = 'Have some flash to sell? Add it here.';
                ctaLabel = 'Add Flash';
                ctaAction = () => setIsCreateModalOpen(true);
              } else {
                subtitle = 'Check back soon — artists are adding flash all the time.';
              }
            } else if (showSeeking && !showFlash) {
              title = 'No seeking posts right now';
              if (!isArtist) {
                subtitle = 'Looking for an artist? Post your idea and let them find you.';
                ctaLabel = 'Post a Request';
                ctaAction = () => router.push('/dashboard');
              } else {
                subtitle = 'Check back soon — clients post new ideas every day.';
              }
            } else if (showFlash && showSeeking) {
              title = 'No flash or seeking posts available';
              subtitle = isArtist
                ? 'Have flash to sell? Add it here.'
                : 'Looking for an artist? Post your idea.';
              if (isArtist) {
                ctaLabel = 'Add Flash';
                ctaAction = () => setIsCreateModalOpen(true);
              } else {
                ctaLabel = 'Post a Request';
                ctaAction = () => router.push('/dashboard');
              }
            }

            return (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography sx={{
                  color: colors.textPrimary,
                  fontSize: '1.25rem',
                  fontWeight: 500,
                  mb: 1
                }}>
                  {title}
                </Typography>
                <Typography sx={{
                  color: colors.textSecondary,
                  fontSize: '0.95rem',
                  mb: 3
                }}>
                  {subtitle}
                </Typography>
                {ctaLabel && ctaAction && (
                  <Button
                    onClick={ctaAction}
                    sx={{
                      color: colors.accent,
                      borderColor: colors.accent,
                      border: '1px solid',
                      textTransform: 'none',
                      px: 3,
                      mr: activeFilters.length > 0 ? 1.5 : 0,
                      '&:hover': {
                        bgcolor: `${colors.accent}1A`,
                        borderColor: colors.accent
                      }
                    }}
                  >
                    {ctaLabel}
                  </Button>
                )}
                {activeFilters.length > 0 && (
                  <Button
                    onClick={() => {
                      setSearchParams({
                        ...initialSearchParams,
                        subject: 'tattoos'
                      });
                      setDismissedStyles([]);
                    }}
                    sx={{
                      color: colors.accent,
                      borderColor: colors.accent,
                      border: '1px solid',
                      textTransform: 'none',
                      px: 3,
                      '&:hover': {
                        bgcolor: `${colors.accent}1A`,
                        borderColor: colors.accent
                      }
                    }}
                  >
                    Clear all filters
                  </Button>
                )}
              </Box>
            );
          })()
        ) : (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(auto-fill, minmax(280px, 1fr))'
            },
            gap: '1.25rem'
          }}>
            {interleavedResults.map((item, index) => (
              item.type === 'tattoo' ? (
                <TattooCard
                  key={`tattoo-${item.data.id}`}
                  tattoo={item.data}
                  onTattooClick={handleTattooClick}
                />
              ) : (
                <UnclaimedStudioCard
                  key={`unclaimed-${item.data.id}`}
                  studio={item.data}
                />
              )
            ))}
          </Box>
        )}

        {/* Infinite scroll sentinel and loading indicator */}
        {!loading && tattoos.length > 0 && (
          <Box
            ref={sentinelRef}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 4,
              minHeight: 80,
            }}
          >
            {loadingMore && (
              <CircularProgress size={32} sx={{ color: colors.accent }} />
            )}
            {!hasMore && tattoos.length > 25 && (
              <Typography sx={{ color: colors.textMuted, fontSize: '0.875rem' }}>
                You've seen all results
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Create Tattoo Modal */}
      {isCreateModalOpen && (
        <TattooCreateWizard
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={(newTattoo) => {
            setIsCreateModalOpen(false);
            // Navigate to artist's portfolio to show the new tattoo
            if (me?.slug) {
              router.push(`/artists/${me.slug}`);
            }
          }}
        />
      )}

      <TattooModal
        tattooId={selectedTattooId}
        artistName={getCurrentTattoo()?.artist?.name || null}
        open={isTattooModalOpen}
        onClose={handleCloseTattooModal}
        onPrevious={handlePreviousTattoo}
        onNext={handleNextTattoo}
        hasPrevious={getCurrentTattooIndex() > 0}
        hasNext={tattoos ? getCurrentTattooIndex() < tattoos.length - 1 : false}
        tattooFavorite={selectedTattooId ? getTattooFavoriteStatus(selectedTattooId) : false}
        artistFavorite={getCurrentTattoo()?.artist?.id ? getArtistFollowStatus(getCurrentTattoo().artist.id) : false}
      />
    </Layout>
  );
}

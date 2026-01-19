import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Box, Typography, Select, MenuItem, FormControl, Button, Modal, Paper, IconButton } from '@mui/material';
import { useTheme, useMediaQuery } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import ArtistCard from '../../components/ArtistCard';
import UnclaimedStudioCard from '../../components/UnclaimedStudioCard';
import SearchFilters from '../../components/SearchFilters';
import Layout from '../../components/Layout';
import { useArtists, UnclaimedStudio } from '@/hooks';
import { useUserData } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStyles } from '@/contexts/StyleContext';
import { useTags } from '@/contexts/TagContext';
import { distancePreferences } from '@/utils/distancePreferences';
import { colors } from '@/styles/colors';
import { useDemoMode } from '@/contexts/DemoModeContext';
import EmptyStateFoundingArtist from '@/components/EmptyStateFoundingArtist';

export default function ArtistList() {
    const user = useUserData();
    const { isAuthenticated } = useAuth();
    const { isDemoMode } = useDemoMode();
    const { styles } = useStyles();
    const { tags } = useTags();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    // Helper to safely get lat/lng from user location
    const getUserLat = () => {
        const loc = user?.location_lat_long;
        if (!loc) return undefined;
        return loc.latitude ?? loc.lat;
    };
    const getUserLng = () => {
        const loc = user?.location_lat_long;
        if (!loc) return undefined;
        return loc.longitude ?? loc.lng;
    };
    const userLat = getUserLat();
    const userLng = getUserLng();
    const hasValidUserCoords = userLat !== undefined && userLng !== undefined;

    const locationSettings = distancePreferences.getDefaultLocationSettings(hasValidUserCoords);

    const initialFilters = {
        searchString: '',
        styles: [],
        tags: [],
        applySavedStyles: false,
        booksOpen: false,
        ...locationSettings,
        distanceUnit: 'mi' as const,
        locationCoords: hasValidUserCoords ? `${userLat},${userLng}` : undefined,
        studio_near_me: hasValidUserCoords ? user?.location_lat_long : undefined,
        artist_near_me: hasValidUserCoords ? user?.location_lat_long : undefined,
        studios: user?.studios,
        subject: 'artists'
    };

    const [searchParams, setSearchParams] = useState<Record<string, any>>(initialFilters);
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [sortBy, setSortBy] = useState('relevant');
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const { artists, unclaimedStudios, loading, error } = useArtists(searchParams);

    // Handle filter changes from SearchFilters component
    const handleFilterChange = (filters: {
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
        locationCoords?: { lat: number; lng: number };
    }) => {
        let finalStyles = filters.styles && filters?.styles.length > 0 ? filters.styles : [];
        if (filters.applySavedStyles && user?.styles) {
            // styles is already an array of number IDs
            const userStyleIds = user.styles as number[];
            finalStyles = Array.from(new Set([...finalStyles, ...userStyleIds]));
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
            subject: 'artists'
        };

        // Store locationCoords as object for passing back to SearchFilters
        // Also create string version for API calls
        if (filters.locationCoords && filters.locationCoords.lat && filters.locationCoords.lng) {
            newParams.locationCoords = filters.locationCoords; // Keep as object
            newParams.locationCoordsString = `${filters.locationCoords.lat},${filters.locationCoords.lng}`; // String for API
        }

        if (filters.useMyLocation) {
            // Use browser geolocation coords if available, otherwise fall back to user profile location
            if (filters.locationCoords && filters.locationCoords.lat && filters.locationCoords.lng) {
                // Browser geolocation was successful - use those coordinates
                newParams.studio_near_me = {
                    latitude: filters.locationCoords.lat,
                    longitude: filters.locationCoords.lng
                };
                newParams.artist_near_me = {
                    latitude: filters.locationCoords.lat,
                    longitude: filters.locationCoords.lng
                };
            } else if (user?.location_lat_long) {
                // Fallback to user's saved profile location
                newParams.studio_near_me = user.location_lat_long;
                newParams.artist_near_me = user.location_lat_long;
                // Also set locationCoords for Google Places search
                const lat = user.location_lat_long.latitude ?? user.location_lat_long.lat;
                const lng = user.location_lat_long.longitude ?? user.location_lat_long.lng;
                if (lat && lng) {
                    newParams.locationCoords = { lat, lng };
                    newParams.locationCoordsString = `${lat},${lng}`;
                }
            }
            newParams.studios = user?.studios;
        } else if (filters.useAnyLocation) {
            delete newParams.studio_near_me;
            delete newParams.artist_near_me;
            delete newParams.locationCoords;
            delete newParams.locationCoordsString;
        } else {
            delete newParams.studio_near_me;
            delete newParams.artist_near_me;
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
                newParams.styles = newParams.styles.filter((id: number) => id !== value);
                break;
            case 'tag':
                newParams.tags = newParams.tags.filter((id: number) => id !== value);
                break;
            case 'location':
                newParams.useAnyLocation = true;
                newParams.useMyLocation = false;
                newParams.location = '';
                break;
            case 'distance':
                newParams.distance = '';
                newParams.useAnyLocation = true;
                newParams.useMyLocation = false;
                break;
            case 'booksOpen':
                newParams.booksOpen = false;
                break;
        }

        setSearchParams(newParams);
    };

    // Handle artist save click when not authenticated
    const handleArtistSaveClick = () => {
        if (!isAuthenticated) {
            setLoginModalOpen(true);
        }
    };

    const activeFilters = getActiveFilters();
    const artistCount = artists?.length || 0;

    const getInterleavedResults = () => {
        if (!artists || artists.length === 0) return [];
        if (!unclaimedStudios || unclaimedStudios.length === 0) {
            return artists.map(artist => ({ type: 'artist' as const, data: artist }));
        }

        const results: Array<{ type: 'artist' | 'unclaimed'; data: any }> = [];
        let unclaimedIndex = 0;
        const insertInterval = 4; // Insert unclaimed studio after every 4 artists

        artists.forEach((artist, index) => {
            results.push({ type: 'artist', data: artist });

            // After every insertInterval artists, add an unclaimed studio if available
            if ((index + 1) % insertInterval === 0 && unclaimedIndex < unclaimedStudios.length) {
                results.push({ type: 'unclaimed', data: unclaimedStudios[unclaimedIndex] });
                unclaimedIndex++;
            }
        });

        // Add any remaining unclaimed studios at the end
        while (unclaimedIndex < unclaimedStudios.length) {
            results.push({ type: 'unclaimed', data: unclaimedStudios[unclaimedIndex] });
            unclaimedIndex++;
        }

        return results;
    };

    const interleavedResults = getInterleavedResults();

    return (
        <Layout>
            <Head>
                <title>Find Tattoo Artists | InkedIn</title>
                <meta name="description" content="Browse our collection of talented tattoo artists" />
                <link rel="icon" href="/assets/img/logo.png" />
            </Head>

            {/* Search Filters Sidebar */}
            <SearchFilters
                type="artists"
                onFilterChange={handleFilterChange}
                initialFilters={{
                    searchString: initialFilters.searchString,
                    styles: initialFilters.styles,
                    tags: initialFilters.tags,
                    distance: initialFilters.distance,
                    distanceUnit: initialFilters.distanceUnit,
                    useMyLocation: initialFilters.useMyLocation,
                    useAnyLocation: initialFilters.useAnyLocation,
                    applySavedStyles: initialFilters.applySavedStyles,
                    booksOpen: initialFilters.booksOpen,
                    location: initialFilters.location,
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
                onSidebarToggle={setSidebarExpanded}
                initialExpanded={sidebarExpanded}
                isLoading={loading}
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
                            Find Artists
                        </Typography>
                        <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary }}>
                            <Box component="strong" sx={{ color: colors.accent }}>
                                {artistCount}
                            </Box>
                            {' '}artists available
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

                {/* Artists Grid */}
                {error ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography sx={{ color: colors.error }}>Error: {error.message}</Typography>
                    </Box>
                ) : artistCount === 0 && !loading ? (
                    // Show "founding artists" CTA when live site is empty (no demo mode, no restrictive filters)
                    // Only count non-default filters as restrictive
                    !isDemoMode && activeFilters.filter(f => !(f as any).isDefault).length === 0 ? (
                        <Box sx={{ py: 6 }}>
                            <EmptyStateFoundingArtist />
                        </Box>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                            <Typography sx={{
                                color: colors.textPrimary,
                                fontSize: '1.25rem',
                                fontWeight: 500,
                                mb: 1
                            }}>
                                Nothing matches that search
                            </Typography>
                            <Typography sx={{
                                color: colors.textSecondary,
                                fontSize: '0.95rem',
                                mb: 3
                            }}>
                                Try removing some filters to see more results
                            </Typography>
                            {activeFilters.length > 0 && (
                                <Button
                                    onClick={() => {
                                        setSearchParams({
                                            ...initialFilters,
                                            subject: 'artists'
                                        });
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
                    )
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
                            item.type === 'artist' ? (
                                <ArtistCard
                                    key={`artist-${item.data.id}`}
                                    artist={item.data}
                                    onSaveClick={handleArtistSaveClick}
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
            </Box>

            {/* Login Required Modal */}
            <Modal
                open={loginModalOpen}
                onClose={() => setLoginModalOpen(false)}
                aria-labelledby="login-required-modal"
            >
                <Paper sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    maxWidth: '90%',
                    bgcolor: colors.surface,
                    boxShadow: 24,
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center'
                }}>
                    <IconButton
                        onClick={() => setLoginModalOpen(false)}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: colors.textSecondary
                        }}
                    >
                        <CloseIcon />
                    </IconButton>

                    <Typography sx={{
                        fontFamily: '"Cormorant Garamond", Georgia, serif',
                        fontSize: '1.5rem',
                        fontWeight: 500,
                        color: colors.textPrimary,
                        mb: 1
                    }}>
                        Login Required
                    </Typography>

                    <Typography sx={{
                        color: colors.textSecondary,
                        mb: 3,
                        lineHeight: 1.6
                    }}>
                        Please log in or create an account to save your favorite artists.
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button
                            component={Link}
                            href="/login"
                            variant="outlined"
                            sx={{
                                color: colors.textPrimary,
                                borderColor: colors.border,
                                textTransform: 'none',
                                px: 3,
                                '&:hover': { borderColor: colors.accent, color: colors.accent }
                            }}
                        >
                            Log In
                        </Button>
                        <Button
                            component={Link}
                            href="/register"
                            sx={{
                                bgcolor: colors.accent,
                                color: colors.background,
                                textTransform: 'none',
                                px: 3,
                                '&:hover': { bgcolor: colors.accentHover }
                            }}
                        >
                            Sign Up
                        </Button>
                    </Box>
                </Paper>
            </Modal>
        </Layout>
    );
}

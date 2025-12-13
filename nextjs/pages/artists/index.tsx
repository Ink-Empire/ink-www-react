import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Box, Typography, Select, MenuItem, FormControl, IconButton, Button, Modal, Paper } from '@mui/material';
import { useTheme, useMediaQuery } from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import ArtistCard from '../../components/ArtistCard';
import SearchFilters from '../../components/SearchFilters';
import Layout from '../../components/Layout';
import { useArtists } from '@/hooks';
import { useUserData } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStyles } from '@/contexts/StyleContext';
import { distancePreferences } from '@/utils/distancePreferences';
import { colors } from '@/styles/colors';

export default function ArtistList() {
    const user = useUserData();
    const { isAuthenticated } = useAuth();
    const { styles } = useStyles();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    const locationSettings = distancePreferences.getDefaultLocationSettings(!!user?.location_lat_long);

    const initialFilters = {
        searchString: '',
        styles: [],
        applySavedStyles: false,
        booksOpen: false,
        ...locationSettings,
        distanceUnit: 'mi',
        locationCoords: user?.location_lat_long ?
            `${user.location_lat_long.latitude || user.location_lat_long.lat},${user.location_lat_long.longitude || user.location_lat_long.lng}`
            : undefined,
        studio_near_me: user?.location_lat_long,
        artist_near_me: user?.location_lat_long,
        studios: user?.studios,
        subject: 'artists'
    };

    const [searchParams, setSearchParams] = useState<Record<string, any>>(initialFilters);
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [sortBy, setSortBy] = useState('relevant');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const { artists, loading, error } = useArtists(searchParams);

    // Handle filter changes from SearchFilters component
    const handleFilterChange = (filters: {
        searchString: string;
        styles: number[];
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
            const userStyleIds = user.styles.map(style => style.id || style);
            finalStyles = [...new Set([...finalStyles, ...userStyleIds])];
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
            subject: 'artists'
        };

        if (filters.locationCoords && filters.locationCoords.lat && filters.locationCoords.lng) {
            newParams.locationCoords = `${filters.locationCoords.lat},${filters.locationCoords.lng}`;
        }

        if (filters.useMyLocation) {
            newParams.studio_near_me = user?.location_lat_long;
            newParams.artist_near_me = user?.location_lat_long;
            newParams.studios = user?.studios;
        } else if (filters.useAnyLocation) {
            delete newParams.studio_near_me;
            delete newParams.artist_near_me;
            delete newParams.locationCoords;
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
    const artistCount = artists?.response?.length || 0;

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
                                <MenuItem value="rating">Highest Rated</MenuItem>
                                <MenuItem value="reviews">Most Reviewed</MenuItem>
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

                {/* Artists Grid */}
                {error ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography sx={{ color: colors.error }}>Error: {error.message}</Typography>
                    </Box>
                ) : artistCount === 0 && !loading ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Typography sx={{
                            color: colors.textSecondary,
                            fontSize: '1.1rem',
                            mb: 1
                        }}>
                            No artists found for your search
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
                        {artists?.response &&
                            Array.isArray(artists.response) &&
                            artists.response.map((artist: any) => (
                                <ArtistCard
                                    key={artist.id}
                                    artist={artist}
                                    onSaveClick={handleArtistSaveClick}
                                />
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

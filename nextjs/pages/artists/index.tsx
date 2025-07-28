import React, {useState} from 'react';
import Head from 'next/head';
import ArtistCard from '../../components/ArtistCard';
import SearchFilters from '../../components/SearchFilters';
import ActiveFilterBadges from '../../components/ActiveFilterBadges';
import Layout from '../../components/Layout';
import {useArtists} from '@/hooks';
import {useUserData} from '@/contexts/UserContext';
import { distancePreferences } from '@/utils/distancePreferences';

export default function ArtistList() {
    const user = useUserData();
    
    const locationSettings = distancePreferences.getDefaultLocationSettings(!!user?.location_lat_long);
    
    const initialFilters = {
        searchString: '',
        styles: [], // Empty array - no auto-applied styles  
        applySavedStyles: false, // Default to false
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
    const {artists, loading, error} = useArtists(searchParams);

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
        locationCoords?: { lat: number; lng: number };
    }) => {
        // Handle applySavedStyles - merge user's saved styles with selected styles if enabled
        let finalStyles = filters.styles && filters?.styles.length > 0 ? filters.styles : [];
        if (filters.applySavedStyles && user?.styles) {
            const userStyleIds = user.styles.map(style => style.id || style);
            // Merge without duplicates
            finalStyles = [...new Set([...finalStyles, ...userStyleIds])];
        }

        // Build new params object
        const newParams: Record<string, any> = {
            searchString: filters.searchString,
            styles: finalStyles,
            distance: filters.distance,
            distanceUnit: filters.distanceUnit,
            location: filters.location,
            useMyLocation: filters.useMyLocation,
            useAnyLocation: filters.useAnyLocation,
            applySavedStyles: filters.applySavedStyles,
            subject: 'artists'
        };

        console.log(newParams.styles);
        
        // Format locationCoords as comma-separated string if present
        if (filters.locationCoords && filters.locationCoords.lat && filters.locationCoords.lng) {
            newParams.locationCoords = `${filters.locationCoords.lat},${filters.locationCoords.lng}`;
        }
        
        // Handle location-based parameters
        if (filters.useMyLocation) {
            // Using "My location"
            newParams.studio_near_me = user?.location_lat_long;
            newParams.artist_near_me = user?.location_lat_long;
            newParams.studios = user?.studios;
        } else if (filters.useAnyLocation) {
            // Using "Anywhere" - explicitly remove location parameters
            delete newParams.studio_near_me;
            delete newParams.artist_near_me;
            delete newParams.locationCoords;
        } else {
            // Using custom location - remove my location parameters
            delete newParams.studio_near_me;
            delete newParams.artist_near_me;
        }
        
        // Update state with new parameters
        setSearchParams(newParams);
    };

    return (
        <Layout>
            <Head>
                <title>Tattoo Artists | InkedIn</title>
                <meta name="description" content="Browse our collection of talented tattoo artists"/>
                <link rel="icon" href="/assets/img/logo.png"/>
                <link rel="preload" href="/fonts/Tattoo-dKGR.ttf" as="font" type="font/ttf" crossOrigin="anonymous"/>
                <link rel="preload" href="/fonts/tattoo.ttf" as="font" type="font/ttf" crossOrigin="anonymous"/>
            </Head>

            <div className="py-6">
                <div className={`transition-all duration-300 ${sidebarExpanded ? 'md:pl-60' : 'pl-16'}`}>
                    <h1 className="tattoo-heading text-center mb-8">Artists</h1>

                    {/* Search Filters Component */}
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
                            location: searchParams.location,
                            locationCoords: searchParams.locationCoords,
                        }}
                        onSidebarToggle={setSidebarExpanded}
                        initialExpanded={sidebarExpanded}
                        isLoading={loading}
                    />

                    {/* Active Filters Component */}
                    <ActiveFilterBadges 
                        searchString={searchParams.searchString}
                        selectedStyles={searchParams.styles}
                        distance={searchParams.distance}
                        distanceUnit={searchParams.distanceUnit}
                        location={searchParams.location}
                        useMyLocation={searchParams.useMyLocation}
                        useAnyLocation={searchParams.useAnyLocation}
                        locationCoords={searchParams.locationCoords}
                        onClearSearch={() => {
                            const newParams = { ...searchParams, searchString: '' };
                            setSearchParams(newParams);
                            
                            // Maintain all existing parameters except the search string
                            handleFilterChange({
                                searchString: '',
                                styles: newParams.styles || [],
                                distance: newParams.distance || 50,
                                distanceUnit: newParams.distanceUnit,
                                location: newParams.location,
                                useMyLocation: newParams.useMyLocation,
                                locationCoords: newParams.locationCoords,
                                subject: 'artists'
                            });
                        }}
                        onClearStyle={(styleId) => {
                            const newStyles = searchParams.styles ? 
                                searchParams.styles.filter(id => id !== styleId) : 
                                [];
                            
                            const newParams = { 
                                ...searchParams, 
                                styles: newStyles.length > 0 ? newStyles : [] 
                            };
                            
                            setSearchParams(newParams);
                            
                            // Maintain all existing parameters except the updated styles
                            handleFilterChange({
                                searchString: searchParams.searchString || '',
                                styles: newStyles,
                                distance: searchParams.distance || 50,
                                distanceUnit: searchParams.distanceUnit,
                                location: searchParams.location,
                                useMyLocation: searchParams.useMyLocation,
                                locationCoords: searchParams.locationCoords,
                                subject: 'artists'
                            });
                        }}
                        onClearDistance={() => {
                            const newParams = { ...searchParams, distance: 50 };
                            setSearchParams(newParams);
                            
                            // Maintain all existing parameters except reset distance to 50
                            handleFilterChange({
                                searchString: newParams.searchString || '',
                                styles: newParams.styles || [],
                                distance: "",
                                distanceUnit: newParams.distanceUnit || 'mi',
                                location: newParams.location || '',
                                useMyLocation: newParams.useMyLocation !== undefined ? newParams.useMyLocation : true,
                                locationCoords: newParams.locationCoords,
                                subject: 'artists'
                            });
                        }}
                        onClearLocation={() => {
                            // When clearing location, we switch back to using "My Location"
                            const newParams = { 
                                ...searchParams, 
                                location: '',
                                useMyLocation: true,
                                studio_near_me: user?.location_lat_long,
                                artist_near_me: user?.location_lat_long,
                                subject: 'artists'
                            };
                            setSearchParams(newParams);
                            handleFilterChange({
                                searchString: searchParams.searchString || '',
                                styles: searchParams.styles || [],
                                distance: searchParams.distance || 50,
                                distanceUnit: searchParams.distanceUnit || 'mi',
                                location: '',
                                useMyLocation: true,
                                locationCoords: user?.location_lat_long ? 
                                    `${user.location_lat_long.latitude || user.location_lat_long.lat},${user.location_lat_long.longitude || user.location_lat_long.lng}` 
                                    : undefined,
                                subject: 'artists'
                            });
                        }}
                    />
                  
                    {error ? (
                        <div className="error">Error: {error.message}</div>
                    ) : (
                        <div className="artist-grid">
                            {artists && artists.response &&
                                Array.isArray(artists.response) &&
                                artists.response.map(artist => (
                                    <ArtistCard key={artist.id} artist={artist}/>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

import React, {useState, useEffect} from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import TattooCard from '../components/TattooCard';
import SearchFilters from '../components/SearchFilters';
import ActiveFilterBadges from '../components/ActiveFilterBadges';
import LogoText from '../components/LogoText';
import Layout from '../components/Layout';
import {useTattoos} from '../hooks';
import {useUserData} from "@/contexts/UserContext";

export default function Home() {
    const me = useUserData();
    const router = useRouter();
    const { studio_id } = router.query;
    
    // State for studio name (for filter display)
    const [studioName, setStudioName] = useState<string>('');

    // Initialize with user preferences - default to 50mi from user's location
    const initialSearchParams = {
        searchString: '',
        styles: me?.styles || [],
        distance: 50,
        distanceUnit: 'mi',
        useMyLocation: me?.location_lat_long ? true : false,
        useAnyLocation: me?.location_lat_long ? false : true,
        location: '',
        subject: 'tattoos',
        studio_id: studio_id || undefined
    };

    const [searchParams, setSearchParams] = useState<Record<string, any>>(initialSearchParams);
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const {tattoos, loading, error} = useTattoos(searchParams);
    
    // When we get tattoo data back, try to find the studio name based on the studio_id
    useEffect(() => {
        if (tattoos?.response && Array.isArray(tattoos.response) && studio_id) {
            // Find the first tattoo that has the matching studio ID
            const studioIdStr = String(studio_id);
            
            const tattooWithStudio = tattoos.response.find(
                tattoo => tattoo.studio && String(tattoo.studio.id) === studioIdStr
            );
            
            if (tattooWithStudio?.studio?.name) {
                setStudioName(tattooWithStudio.studio.name);
            }
        }
    }, [tattoos, studio_id]);
    
    // Update searchParams when studio_id changes in the URL
    useEffect(() => {
        if (studio_id) {
            setSearchParams(prev => ({ ...prev, studio_id }));
        }
    }, [studio_id]);

    // Handle filter changes from SearchFilters component
    const handleFilterChange = (filters: {
        searchString: string;
        styles: number[];
        distance: number;
        distanceUnit?: 'mi' | 'km';
        location?: string;
        useMyLocation?: boolean;
        useAnyLocation?: boolean;
        locationCoords?: { lat: number; lng: number };
    }) => {
        // Build new params object
        const newParams: Record<string, any> = {
            searchString: filters.searchString,
            styles: filters?.styles && filters.styles.length > 0 ? filters.styles : me?.styles || [],
            distance: filters.distance,
            distanceUnit: filters.distanceUnit,
            location: filters.location,
            useMyLocation: filters.useMyLocation,
            useAnyLocation: filters.useAnyLocation,
            subject: 'tattoos'
        };
        
        // Preserve studio_id from URL if it exists
        if (studio_id) {
            newParams.studio_id = studio_id;
        }
        
        // Format locationCoords as comma-separated string if present
        if (filters.locationCoords && filters.locationCoords.lat && filters.locationCoords.lng) {
            newParams.locationCoords = `${filters.locationCoords.lat},${filters.locationCoords.lng}`;
        }
        
        // Handle location-based parameters
        if (filters.useMyLocation) {
            // Using "My location" - backend will use user's location_lat_long directly
            // Remove any conflicting location parameters
            delete newParams.locationCoords;
        } else if (filters.useAnyLocation) {
            // Using "Anywhere" - remove all location parameters
            delete newParams.locationCoords;
        } else {
            // Using custom location - locationCoords should be set by the calling component
            // Keep locationCoords as is
        }
        
        // Update state with new parameters
        setSearchParams(newParams);
    };

    return (
        <Layout>
            <Head>
                <title>InkedIn | Find Your Perfect Tattoo</title>
                <meta name="description" content="Browse our collection of amazing tattoos"/>
                <link rel="icon" href="/assets/img/logo.png"/>
                <link rel="preload" href="/fonts/tattoo.ttf" as="font" type="font/ttf" crossOrigin="anonymous"/>
            </Head>

            <div className="py-3">
                <div className={`transition-all duration-300 ${sidebarExpanded ? 'pl-16 md:pl-64' : 'pl-16'}`}>
                    {/* Search Filters Component */}
                    <SearchFilters
                        type="tattoos"
                        onFilterChange={handleFilterChange}
                        initialFilters={{
                            searchString: initialSearchParams.searchString,
                            styles: initialSearchParams.styles,
                            distance: initialSearchParams.distance
                        }}
                        currentFilters={{
                            searchString: searchParams.searchString,
                            styles: searchParams.styles,
                            distance: searchParams.distance
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
                        studioId={searchParams.studio_id}
                        studioName={studioName}
                        onClearSearch={() => {
                            const newParams = { ...searchParams, searchString: '' };
                            setSearchParams(newParams);
                            handleFilterChange({
                                searchString: '',
                                styles: newParams.styles,
                                distance: newParams.distance,
                                distanceUnit: newParams.distanceUnit,
                                location: newParams.location,
                                useMyLocation: newParams.useMyLocation,
                                locationCoords: newParams.locationCoords,
                                subject: 'tattoos'
                            });
                        }}
                        onClearStyle={(styleId) => {
                            const newStyles = searchParams.styles.filter(id => id !== styleId);
                            const newParams = { ...searchParams, styles: newStyles };
                            setSearchParams(newParams);
                            handleFilterChange({
                                searchString: newParams.searchString,
                                styles: newStyles,
                                distance: newParams.distance,
                                distanceUnit: newParams.distanceUnit,
                                location: newParams.location,
                                useMyLocation: newParams.useMyLocation,
                                locationCoords: newParams.locationCoords,
                                subject: 'tattoos'
                            });
                        }}
                        onClearDistance={() => {
                            const newParams = { ...searchParams, distance: 50 };
                            setSearchParams(newParams);
                            handleFilterChange({
                                searchString: newParams.searchString,
                                styles: newParams.styles,
                                distance: 50,
                                distanceUnit: newParams.distanceUnit,
                                location: newParams.location,
                                useMyLocation: newParams.useMyLocation,
                                locationCoords: newParams.locationCoords,
                                subject: 'tattoos'
                            });
                        }}
                        onClearStudio={() => {
                            // Remove studio_id from URL
                            router.push('/', undefined, { shallow: true });
                            
                            // Clear studio_id from search params
                            const { studio_id: _studio_id, ...rest } = searchParams;
                            setSearchParams(rest);
                            
                            // Refresh results without studio_id
                            handleFilterChange({
                                searchString: rest.searchString || '',
                                styles: rest.styles || [],
                                distance: rest.distance,
                                distanceUnit: rest.distanceUnit,
                                location: rest.location,
                                useMyLocation: rest.useMyLocation,
                                locationCoords: rest.locationCoords
                            });
                        }}
                        onClearLocation={() => {
                            // When clearing location, we switch back to using "My Location"
                            const newParams = { 
                                ...searchParams, 
                                location: '',
                                useMyLocation: true,
                                useAnyLocation: false,
                                subject: 'tattoos'
                            };
                            setSearchParams(newParams);
                            handleFilterChange({
                                searchString: newParams.searchString,
                                styles: newParams.styles,
                                distance: newParams.distance,
                                distanceUnit: newParams.distanceUnit,
                                location: '',
                                useMyLocation: true,
                                useAnyLocation: false
                            });
                        }}
                    />

                    {error ? (
                        <div className="error">Error: {error.message}</div>
                    ) : (
                        <div className="artist-grid">
                            {tattoos && tattoos.response &&
                                Array.isArray(tattoos.response) &&
                                tattoos.response.map(tattoo => (
                                    <TattooCard key={tattoo.id} tattoo={tattoo}/>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

import React, {useState, useEffect} from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import TattooCard from '../../components/TattooCard';
import SearchFilters from '../../components/SearchFilters';
import LogoText from '../../components/LogoText';
import Layout from '../../components/Layout';
import {useTattoos} from '../../hooks';
import {useUserData} from "@/contexts/UserContext";

export default function TattooList() {
    const me = useUserData();

    // Initialize with user preferences
    const initialSearchParams = {
        searchString: '',
        styles: me?.styles || [],
        distance: 100,
        studio_near_me: me?.location_lat_long,
        artist_near_me: me?.location_lat_long,
        studios: me?.studios
    };

    const [searchParams, setSearchParams] = useState<Record<string, any>>(initialSearchParams);
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const {tattoos, loading, error} = useTattoos(searchParams);

    // Handle filter changes from SearchFilters component
    const handleFilterChange = (filters: {
        searchString: string;
        styles: number[];
        distance: number;
    }) => {
        // Merge new filters with existing search params
        setSearchParams({
            ...searchParams,
            searchString: filters.searchString,
            styles: filters?.styles.length > 0 ? filters.styles : me?.styles,
            distance: filters.distance
        });
    };

    return (
        <Layout>
            <Head>
                <title> Gallery | InkedIn</title>
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
                            searchString: searchParams.searchString,
                            styles: searchParams.styles,
                            distance: searchParams.distance
                        }}
                        onSidebarToggle={setSidebarExpanded}
                        initialExpanded={sidebarExpanded}
                        isLoading={loading}
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
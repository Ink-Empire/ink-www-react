import React, {useState} from 'react';
import Head from 'next/head';
import ArtistCard from '../../components/ArtistCard';
import SearchFilters from '../../components/SearchFilters';
import Layout from '../../components/Layout';
import {useArtists} from '@/hooks';
import {useUserData} from '@/contexts/UserContext';

export default function ArtistList() {
    const [searchParams, setSearchParams] = useState<Record<string, any>>({});
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const {artists, loading, error} = useArtists(searchParams);
    const user = useUserData();

    console.log(user);

    // Handle filter changes from SearchFilters component
    const handleFilterChange = (filters: {
        searchString: string;
        styles: number[];
        distance: number;
    }) => {
        const params: Record<string, any> = {};

        // Only add parameters that have values
        if (filters.searchString) {
            params.searchString = filters.searchString;
        }

        if (filters.styles && filters.styles.length > 0) {
            params.styles = filters.styles;
        }

        if (filters.distance) {
            params.distance = filters.distance;
        }

        setSearchParams(params);
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
                    <h1 className="tattoo-heading text-center mb-8">Tattoo Artists</h1>

                    {/* Search Filters Component */}
                    <SearchFilters
                        type="artists"
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

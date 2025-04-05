import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import ArtistCard from '../../components/ArtistCard';
import SearchFilters from '../../components/SearchFilters';
import { useArtists } from '@/hooks';

export default function ArtistList() {
    const [searchParams, setSearchParams] = useState<Record<string, any>>({});
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const { artists, loading, error } = useArtists(searchParams);

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
        <div className="container">
            <Head>
                <title>Tattoo Artists | Inked In</title>
                <meta name="description" content="Browse our collection of talented tattoo artists"/>
                <link rel="icon" href="/assets/img/appicon.svg"/>
            </Head>

            <header className="page-header">
                <Link href="/" className="home-link">
                    <Image
                        src="/assets/img/appicon.svg"
                        alt="Inked In Logo"
                        width={40}
                        height={40}
                    />
                    <span>Inked In</span>
                </Link>
                <h1>Tattoo Artists</h1>
            </header>

            <main className={`main transition-all duration-300 ${sidebarExpanded ? 'pl-16 md:pl-72' : 'pl-16'}`}>
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
                />
                
                {loading ? (
                    <div className="loading">Loading artists...</div>
                ) : error ? (
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
            </main>

            <footer className="footer">
                <p>Powered by Inked In</p>
            </footer>
        </div>
    );
}

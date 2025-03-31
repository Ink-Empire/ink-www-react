import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import TattooCard from '../../components/TattooCard';
import {useArtists, useTattoos} from '../../hooks';
import {useUserData} from "@/contexts/UserContext";
import ArtistCard from "@/components/ArtistCard";

export default function TattooList() {

    const me = useUserData();

    const myLocation = me?.location_lat_long;
    const myStyles = me?.styles;
    const myStudios = me?.studios;

    const searchParams = {
        studio_near_me: myLocation,
        artist_near_me: myLocation,
        styles: myStyles,
        studios: myStudios,
    }

    const {tattoos, loading, error} = useTattoos(searchParams);

    console.log(tattoos);

    return (
        <div className="container">
            <Head>
                <title>Tattoo Gallery | Inked In</title>
                <meta name="description" content="Browse our collection of amazing tattoos"/>
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
                <h1>Tattoo Gallery</h1>
            </header>

            <main className="main">
                {loading ? (
                    <div className="loading">Loading tattoos...</div>
                ) : error ? (
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
            </main>

            <footer className="footer">
                <p>Powered by Inked In</p>
            </footer>
        </div>
    );
}
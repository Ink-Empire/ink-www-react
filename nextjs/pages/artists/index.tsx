import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { GetStaticProps } from 'next';
import { ArtistType } from '../../models/artist.interface';
import ArtistCard from '../../components/ArtistCard';
import artistData from '../../data/artists.json';

interface ArtistListProps {
  artists: ArtistType[];
}

export default function ArtistList({ artists }: ArtistListProps) {
  return (
    <div className="container">
      <Head>
        <title>Tattoo Artists | Inked In</title>
        <meta name="description" content="Browse our collection of talented tattoo artists" />
        <link rel="icon" href="/assets/img/appicon.svg" />
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

      <main className="main">
        <div className="artist-grid">
          {artists.map(artist => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      </main>

      <footer className="footer">
        <p>Powered by Inked In</p>
      </footer>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      artists: artistData
    }
  };
}

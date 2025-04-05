import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { GetStaticProps } from 'next';
import { ArtistType } from '../models/artist.interface';
import ArtistCard from '../components/ArtistCard';
import Layout from '../components/Layout';
import LogoText from '../components/LogoText';
import artistData from '../data/artists.json';

interface SearchProps {
  artists: ArtistType[];
  styles: string[];
}

export default function Search({ artists, styles }: SearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  
  // Filter artists based on search criteria
  const filteredArtists = artists.filter(artist => {
    const nameMatch = artist.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const styleMatch = !selectedStyle || (artist.styles && artist.styles.includes(selectedStyle));
    const locationMatch = !searchLocation || 
      (artist.location?.toLowerCase().includes(searchLocation.toLowerCase()) || false);
    
    return nameMatch && styleMatch && locationMatch;
  });

  return (
    <Layout>
      <Head>
        <title>Search Artists | InkedIn</title>
        <meta name="description" content="Search for tattoo artists by name, style, or location" />
        <link rel="icon" href="/assets/img/logo.png" />
        <link rel="preload" href="/fonts/Tattoo-dKGR.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/tattoo.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
      </Head>

      <div className="py-6">
        <h1 className="tattoo-heading text-center mb-8">Search Artists</h1>
      
        <div className="search-container">
          <div className="search-form">
            <div className="form-group">
              <label htmlFor="name-search">Artist Name</label>
              <input
                id="name-search"
                type="text"
                placeholder="Search by name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="style-select">Tattoo Style</label>
              <select
                id="style-select"
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="search-select"
              >
                <option value="">All Styles</option>
                {styles.map((style) => (
                  <option key={style} value={style}>
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="location-search">Location</label>
              <input
                id="location-search"
                type="text"
                placeholder="Search by location"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="search-results">
            <h2>Results ({filteredArtists.length})</h2>
            
            {filteredArtists.length > 0 ? (
              <div className="artist-grid">
                {filteredArtists.map(artist => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
            ) : (
              <div className="no-results">
                <p>No artists found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .search-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        
        .search-form {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          padding: 1.5rem;
          background: #2a1a1e;
          border-radius: 10px;
          border: 1px solid #382932;
          color: white;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        label {
          font-weight: 500;
        }
        
        .search-input,
        .search-select {
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 5px;
          font-size: 1rem;
        }
        
        .search-results h2 {
          margin-bottom: 1.5rem;
          color: #339989;
        }
        
        .no-results {
          text-align: center;
          padding: 3rem;
          background: #2a1a1e;
          color: white;
          border-radius: 10px;
        }
      `}</style>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  // Extract all unique styles from artists
  const allStyles = artistData.flatMap(artist => artist.styles || []);
  const uniqueStyles = [...new Set(allStyles)].sort();
  
  return {
    props: {
      artists: artistData,
      styles: uniqueStyles
    }
  };
};
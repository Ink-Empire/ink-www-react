import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { GetStaticProps } from 'next';
import { Box, Grid, Container } from '@mui/material';
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

      <Box sx={{ minHeight: '100vh', bgcolor: '#1A1A1D', py: 3 }}>
        <Container maxWidth="xl">
          <h1 className="tattoo-heading text-center mb-8" style={{ color: 'white' }}>Search Artists</h1>
          
          <Grid container spacing={3}>
            {/* Main Content Area */}
            <Grid item xs={12} lg={12}>
              <Box sx={{ bgcolor: '#2a1a1e', p: 3, borderRadius: 2, border: '1px solid #444' }}>
                {/* Search Form */}
                <Box sx={{ mb: 4 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <div className="form-group">
                        <label htmlFor="name-search" style={{ color: 'white', marginBottom: '8px', display: 'block' }}>Artist Name</label>
                        <input
                          id="name-search"
                          type="text"
                          placeholder="Search by name"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="search-input"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            border: '1px solid #444',
                            backgroundColor: '#1a1a1a',
                            color: 'white'
                          }}
                        />
                      </div>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <div className="form-group">
                        <label htmlFor="style-select" style={{ color: 'white', marginBottom: '8px', display: 'block' }}>Tattoo Style</label>
                        <select
                          id="style-select"
                          value={selectedStyle}
                          onChange={(e) => setSelectedStyle(e.target.value)}
                          className="search-select"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            border: '1px solid #444',
                            backgroundColor: '#1a1a1a',
                            color: 'white'
                          }}
                        >
                          <option value="">All Styles</option>
                          {styles.map((style) => (
                            <option key={style} value={style}>
                              {style.charAt(0).toUpperCase() + style.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <div className="form-group">
                        <label htmlFor="location-search" style={{ color: 'white', marginBottom: '8px', display: 'block' }}>Location</label>
                        <input
                          id="location-search"
                          type="text"
                          placeholder="Search by location"
                          value={searchLocation}
                          onChange={(e) => setSearchLocation(e.target.value)}
                          className="search-input"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            border: '1px solid #444',
                            backgroundColor: '#1a1a1a',
                            color: 'white'
                          }}
                        />
                      </div>
                    </Grid>
                  </Grid>
                </Box>

                {/* Search Results */}
                <Box>
                  <h2 style={{ color: 'white', marginBottom: '16px' }}>Results ({filteredArtists.length})</h2>
                  
                  {filteredArtists.length > 0 ? (
                    <Grid container spacing={2}>
                      {filteredArtists.map(artist => (
                        <Grid item xs={12} sm={6} md={4} key={artist.id}>
                          <ArtistCard artist={artist} />
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4, color: '#888' }}>
                      <p>No artists found matching your criteria.</p>
                      <p>Try adjusting your search terms.</p>
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>
            
          </Grid>
        </Container>
      </Box>

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
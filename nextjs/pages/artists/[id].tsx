import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import {useRouter} from 'next/router';
import Layout from '../../components/Layout';
import LogoText from '../../components/LogoText';
import {Box} from '@mui/material';
import {useArtist, useArtistPortfolio} from '../../hooks';
import TattooCard from "@/components/TattooCard";

export default function ArtistDetail() {
    const router = useRouter();
    const {id} = router.query;
    const {artist, loading: artistLoading, error: artistError} = useArtist(id as string);

    const portfolio = artist?.tattoos || [];

    if (artistLoading) {
        return <div className="loading">Loading artist details...</div>;
    }

    if (artistError) {
        return <div className="error">Error: {artistError.message}</div>;
    }

    if (!artist) {
        return <div>Artist not found</div>;
    }

    return (
        <Layout>
            <Head>
                <title>{artist.name} | InkedIn</title>
                <meta name="description" content={`Learn more about ${artist.name} and their tattoo work`}/>
                <link rel="icon" href="/assets/img/logo.png"/>
                <link rel="preload" href="/fonts/tattoo.ttf" as="font" type="font/ttf" crossOrigin="anonymous"/>
            </Head>

            <div className="py-6">
                <div className="artist-grid" style={{display: 'block', maxWidth: '750px', margin: '0 auto'}}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        marginBottom: '20px',
                        paddingLeft: '1px'
                    }}>
                        <div style={{
                            width: '80px', 
                            height: '80px', 
                            position: 'relative',
                            marginBottom: '8px',
                            borderRadius: '50%',
                            overflow: 'hidden'
                        }}>
                            <Image 
                                src={artist.primary_image?.uri}
                                alt={artist.name || 'Artist'}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <h3 style={{
                            margin: '0',
                            fontSize: '18px', 
                            fontWeight: 'bold'
                        }}>{artist.name}</h3>
                        <p style={{
                            margin: '0',
                            fontSize: '14px',
                            color: '#888'
                        }}>{artist?.studio_name}</p>
                        {artist?.location && (
                          <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '14px',
                              color: '#888',
                              margin: '0'
                          }}>
                              <span style={{ marginRight: '4px' }}>📍</span>
                              <span>{artist?.location}</span>
                          </div>
                        )}
                        
                        {artist?.styles && artist.styles.length > 0 && (
                          <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '6px',
                              marginTop: '12px',
                              marginBottom: '12px'
                          }}>
                              {artist.styles.map((style, index) => {
                                  const styleName = typeof style === 'string' ? style : style.name;
                                  return (
                                      <span key={index} style={{
                                          backgroundColor: '#339989',
                                          color: 'white',
                                          padding: '2px 8px',
                                          borderRadius: '12px',
                                          fontSize: '12px',
                                          whiteSpace: 'nowrap'
                                      }}>
                                          {styleName}
                                      </span>
                                  );
                              })}
                          </div>
                        )}
                        
                        {artist?.about && (
                          <>
                            <hr style={{
                              width: '100%',
                              margin: '15px 0',
                              border: 'none',
                              borderTop: '1px solid #333',
                            }} />
                            <p style={{
                              margin: '0',
                              fontSize: '14px',
                              lineHeight: '1.5',
                              color: '#ccc',
                              maxWidth: '450px'
                            }}>
                              {artist.about}
                            </p>
                          </>
                        )}
                    </div>
                    {portfolio.length > 0 ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(auto-fit, minmax(${Math.floor(750/3)}px, 1fr))`,
                            gap: '2px',
                            width: '100%'
                        }}>
                            {portfolio.map(tattoo => (
                                <div key={tattoo.id} style={{
                                    aspectRatio: '1/1',
                                    position: 'relative'
                                }}>
                                    <Image
                                        src={tattoo.primary_image?.uri}
                                        alt={tattoo.title || 'Tattoo work'}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No portfolio items found.</p>
                    )}
                </div>
            </div>
        </Layout>
    );
}

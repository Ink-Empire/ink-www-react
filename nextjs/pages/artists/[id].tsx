import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useArtist, useArtistPortfolio } from '../../hooks';

export default function ArtistDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { artist, loading: artistLoading, error: artistError } = useArtist(id as string);
  const { portfolio, loading: portfolioLoading, error: portfolioError } = useArtistPortfolio(id as string);

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
    <div className="container">
      <Head>
        <title>{artist.name} | Inked In</title>
        <meta name="description" content={`Learn more about ${artist.name} and their tattoo work`} />
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
        <Link href="/artists" className="back-link">
          &larr; All Artists
        </Link>
      </header>

      <main className="main">
        <div className="artist-detail">
          <div className="artist-header">
            {artist.image && (
              <div className="artist-image-large">
                <Image 
                  src={artist.image.uri} 
                  alt={artist.name || 'Artist'} 
                  width={250}
                  height={250}
                  className="rounded-image-large"
                />
              </div>
            )}
            <div className="artist-header-info">
              <h1>{artist.name}</h1>
              <p className="shop">{artist.shop}</p>
              {artist.location && <p className="location">{artist.location}</p>}
              {artist.styles && artist.styles.length > 0 && (
                <div className="styles">
                  <p>Styles:</p>
                  <div className="style-tags">
                    {artist.styles.map((style, index) => (
                      <span key={index} className="style-tag">{style}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="artist-content">
            <div className="artist-about">
              <h2>About</h2>
              <p>{artist.about}</p>
            </div>

            <div className="artist-contact">
              <h2>Contact</h2>
              <p>Email: {artist.email}</p>
              {artist.phone && <p>Phone: {artist.phone}</p>}
              {artist.twitter && <p>Twitter: @{artist.twitter}</p>}
            </div>

            <div className="artist-work">
              <h2>Recent Work</h2>
              {portfolioLoading ? (
                <div className="loading">Loading portfolio...</div>
              ) : portfolioError ? (
                <div className="error">Error loading portfolio: {portfolioError.message}</div>
              ) : portfolio.length > 0 ? (
                <div className="tattoo-grid">
                  {portfolio.map(tattoo => (
                    <div key={tattoo.id} className="tattoo-item">
                      {tattoo.image && (
                        <Image 
                          src={tattoo.image.uri} 
                          alt={tattoo.description} 
                          width={200}
                          height={200}
                          className="tattoo-image"
                        />
                      )}
                      <p>{tattoo.description}</p>
                      {tattoo.tags && <span className="tattoo-tag">{tattoo.tags}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No portfolio items found.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>Powered by Inked In</p>
      </footer>
    </div>
  );
}

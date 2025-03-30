import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useTattoo } from '../../hooks';

export default function TattooDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { tattoo, loading, error } = useTattoo(id as string);

  if (loading) {
    return <div className="loading">Loading tattoo details...</div>;
  }

  if (error) {
    return <div className="error">Error: {error.message}</div>;
  }

  if (!tattoo) {
    return <div>Tattoo not found</div>;
  }

  return (
    <div className="container">
      <Head>
        <title>{tattoo.title || 'Tattoo Detail'} | Inked In</title>
        <meta name="description" content={`View details about this tattoo work`} />
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
        <Link href="/tattoos" className="back-link">
          &larr; All Tattoos
        </Link>
      </header>

      <main className="main">
        <div className="tattoo-detail">
          <div className="tattoo-header">
            {tattoo.image && (
              <div className="tattoo-image-large">
                <Image 
                  src={tattoo.image.uri} 
                  alt={tattoo.title || 'Tattoo'} 
                  width={500}
                  height={500}
                  className="featured-image"
                />
              </div>
            )}
            <div className="tattoo-header-info">
              <h1>{tattoo.title || 'Untitled Tattoo'}</h1>
              <p className="shop">{tattoo.shopName}</p>
              {tattoo.location && <p className="location">{tattoo.location}</p>}
              {tattoo.styles && tattoo.styles.length > 0 && (
                <div className="styles">
                  <p>Styles:</p>
                  <div className="style-tags">
                    {tattoo.styles.map((style: string, index: number) => (
                      <span key={index} className="style-tag">{style}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="tattoo-content">
            <div className="tattoo-description">
              <h2>Description</h2>
              <p>{tattoo.description}</p>
            </div>

            {tattoo.artist && (
              <div className="tattoo-artist">
                <h2>Artist</h2>
                <div className="artist-info">
                  {tattoo.artist.image && (
                    <Image 
                      src={tattoo.artist.image.uri} 
                      alt={tattoo.artist.name} 
                      width={100}
                      height={100}
                      className="artist-thumbnail"
                    />
                  )}
                  <div>
                    <Link href={`/artists/${tattoo.artist.id}`}>
                      <h3>{tattoo.artist.name}</h3>
                    </Link>
                    {tattoo.artist.shop && <p>{tattoo.artist.shop}</p>}
                    {tattoo.artist.location && <p className="location">{tattoo.artist.location}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>Powered by Inked In</p>
      </footer>
    </div>
  );
}
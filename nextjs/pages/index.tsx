import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>Inked In - Find Your Perfect Tattoo Artist</title>
        <meta name="description" content="Discover and connect with the best tattoo artists" />
        <link rel="icon" href="/assets/img/appicon.svg" />
      </Head>

      <main className="main">
        <div className="header">
          <Image 
            src="/assets/img/appicon.svg" 
            alt="Inked In Logo" 
            width={100} 
            height={100}
          />
          <h1 className="title">Inked In</h1>
          <p className="description">Find Your Perfect Tattoo Artist</p>
        </div>

        <div className="grid">
          <Link href="/artists" className="card">
            <h2>Artists &rarr;</h2>
            <p>Find and explore the best tattoo artists for your next piece.</p>
          </Link>

          <Link href="/tattoos" className="card">
            <h2>Tattoos &rarr;</h2>
            <p>Browse our collection of amazing tattoo work.</p>
          </Link>

          <Link href="/search" className="card">
            <h2>Search &rarr;</h2>
            <p>Search for artists by style, location, or name.</p>
          </Link>
        </div>
      </main>

      <footer className="footer">
        <p>Powered by Inked In</p>
      </footer>
    </div>
  );
}

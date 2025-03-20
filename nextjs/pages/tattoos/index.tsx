import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { GetStaticProps } from 'next';
import TattooCard from '../../components/TattooCard';
import tattooData from '../../data/tattoos.json';

interface TattooListProps {
  tattoos: any[];
}

export default function TattooList({ tattoos }: TattooListProps) {
  return (
    <div className="container">
      <Head>
        <title>Tattoo Gallery | Inked In</title>
        <meta name="description" content="Browse our collection of amazing tattoos" />
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
        <h1>Tattoo Gallery</h1>
      </header>

      <main className="main">
        <div className="tattoo-grid">
          {tattoos.map(tattoo => (
            <TattooCard key={tattoo.id} tattoo={tattoo} />
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
      tattoos: tattooData
    }
  };
}
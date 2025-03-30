import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function Home() {
  return (
    <Layout>
      <Head>
        <title>InkedIn - Find Your Perfect Tattoo Artist</title>
        <meta name="description" content="Discover and connect with the best tattoo artists" />
        <link rel="icon" href="/assets/img/appicon.svg" />
      </Head>

      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block text-indigo-600">InkedIn</span>
              <span className="block text-2xl mt-3">Find Your Perfect Tattoo Artist</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Connect with talented tattoo artists, explore stunning designs, and find the perfect match for your next ink.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mt-12 grid gap-5 max-w-lg mx-auto lg:grid-cols-3 lg:max-w-none">
              <div className="flex flex-col rounded-lg shadow-lg overflow-hidden">
                <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                  <div className="flex-1">
                    <Link href="/artists" className="block mt-2">
                      <p className="text-xl font-semibold text-gray-900">Artists</p>
                      <p className="mt-3 text-base text-gray-500">
                        Find and explore the best tattoo artists for your next piece.
                      </p>
                    </Link>
                  </div>
                  <div className="mt-6">
                    <Link href="/artists" className="text-base font-semibold text-indigo-600 hover:text-indigo-500">
                      Explore Artists &rarr;
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex flex-col rounded-lg shadow-lg overflow-hidden">
                <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                  <div className="flex-1">
                    <Link href="/tattoos" className="block mt-2">
                      <p className="text-xl font-semibold text-gray-900">Tattoos</p>
                      <p className="mt-3 text-base text-gray-500">
                        Browse our collection of amazing tattoo work.
                      </p>
                    </Link>
                  </div>
                  <div className="mt-6">
                    <Link href="/tattoos" className="text-base font-semibold text-indigo-600 hover:text-indigo-500">
                      View Tattoos &rarr;
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex flex-col rounded-lg shadow-lg overflow-hidden">
                <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                  <div className="flex-1">
                    <Link href="/search" className="block mt-2">
                      <p className="text-xl font-semibold text-gray-900">Search</p>
                      <p className="mt-3 text-base text-gray-500">
                        Search for artists by style, location, or name.
                      </p>
                    </Link>
                  </div>
                  <div className="mt-6">
                    <Link href="/search" className="text-base font-semibold text-indigo-600 hover:text-indigo-500">
                      Search Now &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import ArtistCalendar from '@/components/ArtistCalendar';
import { useArtist } from '@/hooks/useArtists';

const ArtistSchedulePage: React.FC = () => {
  const router = useRouter();
  const { artistId, artistSlug, id, slug } = router.query;
  // Handle all possible URL parameter variations
  const artistIdOrSlug = (artistSlug || artistId || slug || id) as string;
  
  // Debug logging
  console.log('URL params:', { artistId, artistSlug, id, slug });
  console.log('Using artistIdOrSlug:', artistIdOrSlug);
  
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek'>('dayGridMonth');
  const { artist, loading: artistLoading } = useArtist(artistIdOrSlug);

  return (
    <Layout>
      <Head>
        <title>{artist?.name ? `${artist.name}'s Schedule` : 'Artist Schedule'} | InkedIn</title>
        <meta name="description" content="View artist's availability and schedule appointments" />
      </Head>

      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6 px-6 py-4 bg-[#1C0F13] text-[#E8DBC5] rounded-lg shadow-md border border-[#333333]">
          <h1 className="text-2xl font-bold text-[#E8DBC5]">
            {artistLoading ? 'Loading...' : artist?.name ? `${artist.name}'s Schedule` : 'Artist Schedule'}
          </h1>
          
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm bg-[#2C1921] text-[#E8DBC5] rounded-md border border-[#333333] hover:bg-[#371F29]"
          >
            Back to Artist
          </button>
        </div>

        <div className="bg-[#1C0F13] text-[#E8DBC5] rounded-lg shadow-md p-6 border border-[#333333]">
          <ArtistCalendar 
            artistIdOrSlug={artistIdOrSlug} 
            initialView={calendarView}
          />
        </div>
        
        <div className="mt-6 bg-[#1C0F13] text-[#E8DBC5] rounded-lg shadow-md p-6 border border-[#333333]">
          <h2 className="text-xl font-semibold mb-4 text-[#E8DBC5]">Request Appointment</h2>
          <p className="text-[#E8DBC5] opacity-80 mb-4">
            To book an appointment with {artist?.name || 'this artist'}, please select an available time slot
            on the calendar above or fill out the form below.
          </p>
          
          {/* Appointment request form could go here */}
          <form className="space-y-4">
            {/* This is a placeholder form - implement the actual form as needed */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-[#E8DBC5]">
                Preferred Date
              </label>
              <input
                type="date"
                id="date"
                className="mt-1 block w-full px-3 py-2 border border-[#333333] rounded-md shadow-sm bg-[#2C1921] text-[#E8DBC5] 
                  focus:outline-none focus:ring-persian-green focus:border-persian-green"
              />
            </div>
            
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-[#E8DBC5]">
                Preferred Time
              </label>
              <input
                type="time"
                id="time"
                className="mt-1 block w-full px-3 py-2 border border-[#333333] rounded-md shadow-sm bg-[#2C1921] text-[#E8DBC5] 
                  focus:outline-none focus:ring-persian-green focus:border-persian-green"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[#E8DBC5]">
                Tattoo Description
              </label>
              <textarea
                id="description"
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-[#333333] rounded-md shadow-sm bg-[#2C1921] text-[#E8DBC5] 
                  focus:outline-none focus:ring-persian-green focus:border-persian-green"
                placeholder="Describe your tattoo idea..."
              ></textarea>
            </div>
            
            <div>
              <button
                type="submit"
                className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#339989] hover:bg-[#287771] 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-persian-green"
              >
                Request Appointment
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ArtistSchedulePage;
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
          <h2 className="text-xl font-semibold mb-4 text-[#E8DBC5]">Booking Instructions</h2>
          <p className="text-[#E8DBC5] opacity-80 mb-4">
            To book an appointment with {artist?.name || 'this artist'}, please select a <span className="text-[#00A896] font-medium">green</span> date on the calendar above. 
            Only days with available time slots are shown in green.
          </p>
          
          <div className="flex items-center p-4 border border-[#333333] rounded-md bg-[#1A1A1D] bg-opacity-50">
            <div className="text-[#E8DBC5] opacity-80">
              <h3 className="font-medium mb-2">How booking works:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Green days have available time slots</li>
                <li>Click on a green day to see available time slots</li>
                <li>Fill out the appointment request form</li>
                <li>Your request will be sent to the artist for approval</li>
                <li>You'll be notified when the artist approves your request</li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-[#00A896]"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-[#1A1A1D]"></div>
              <span>Unavailable</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ArtistSchedulePage;
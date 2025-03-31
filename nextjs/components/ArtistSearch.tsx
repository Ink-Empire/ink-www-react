import React, { useState, useEffect } from 'react';
import { useArtists } from '@/hooks';
import { ArtistType } from '@/models/artist.interface';

interface ArtistSearchProps {
  initialStyles?: number[];
  initialLocation?: string;
}

const ArtistSearch: React.FC<ArtistSearchProps> = ({ 
  initialStyles = [], 
  initialLocation = ''
}) => {
  // Search states
  const [styles, setStyles] = useState<number[]>(initialStyles);
  const [location, setLocation] = useState<string>(initialLocation);
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  
  // Use our hook with the search parameters
  const { artists, loading, error } = useArtists(searchParams);
  
  // Function to perform the search
  const handleSearch = () => {
    // Build the search parameters object
    const params: Record<string, any> = {};
    
    // Only add parameters if they have values
    if (styles && styles.length > 0) {
      params.styles = styles;
    }
    
    if (location && location.trim() !== '') {
      params.location = location.trim();
    }
    
    // Update the search parameters state, which will trigger the hook
    setSearchParams(params);
    console.log('Searching with params:', params);
  };
  
  // Initialize search on component mount if initial values are provided
  useEffect(() => {
    if (initialStyles.length > 0 || initialLocation !== '') {
      handleSearch();
    }
  }, []);
  
  return (
    <div className="space-y-4">
      <div className="bg-white shadow-md rounded-lg p-4">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Find Artists</h2>
        
        {/* Style selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Styles</label>
          <select
            multiple
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={styles.map(s => s.toString())}
            onChange={(e) => {
              const selectedValues = Array.from(
                e.target.selectedOptions,
                option => Number(option.value)
              );
              setStyles(selectedValues);
            }}
          >
            <option value="1">Traditional</option>
            <option value="2">Neo-Traditional</option>
            <option value="3">Japanese</option>
            <option value="4">Realism</option>
            <option value="5">Watercolor</option>
            <option value="6">Blackwork</option>
            <option value="7">Tribal</option>
            <option value="8">New School</option>
          </select>
        </div>
        
        {/* Location input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="City, State or Zip"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        
        {/* Search button */}
        <button
          type="button"
          className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={handleSearch}
        >
          Search Artists
        </button>
      </div>
      
      {/* Results section */}
      <div className="bg-white shadow-md rounded-lg p-4">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Results</h2>
        
        {loading && (
          <div className="text-center py-8">
            <svg className="animate-spin h-8 w-8 text-indigo-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-gray-600">Loading artists...</p>
          </div>
        )}
        
        {error && (
          <div className="text-center py-4 text-red-600">
            <p>Error: {error.message}</p>
          </div>
        )}
        
        {!loading && !error && artists.length === 0 && (
          <div className="text-center py-4 text-gray-600">
            <p>No artists found. Try adjusting your search.</p>
          </div>
        )}
        
        {!loading && !error && artists.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artists.map((artist: ArtistType) => (
              <div key={artist.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4">
                  <h3 className="font-medium text-lg">
                    {artist.name || `${artist.first_name || ''} ${artist.last_name || ''}`.trim()}
                  </h3>
                  {artist.location && (
                    <p className="text-gray-600 text-sm">{artist.location}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistSearch;
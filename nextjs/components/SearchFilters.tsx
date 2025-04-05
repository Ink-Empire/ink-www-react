import React, { useState, useEffect } from 'react';
import { useStyles } from '@/contexts/StyleContext';

interface SearchFiltersProps {
  initialFilters?: {
    searchString?: string;
    styles?: number[];
    distance?: number;
  };
  onFilterChange: (filters: {
    searchString: string;
    styles: number[];
    distance: number;
  }) => void;
  type: 'artists' | 'tattoos';
  onSidebarToggle?: (isExpanded: boolean) => void;
  initialExpanded?: boolean;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  initialFilters = {},
  onFilterChange,
  type,
  onSidebarToggle,
  initialExpanded = true
}) => {
  // Get styles from context
  const { styles, loading: stylesLoading } = useStyles();

  // Filter states
  const [searchString, setSearchString] = useState(initialFilters.searchString || '');
  const [selectedStyles, setSelectedStyles] = useState<number[]>(initialFilters.styles || []);
  const [distance, setDistance] = useState<number>(initialFilters.distance || 50);
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  // Distance options in miles
  const distanceOptions = [25, 50, 75, 100];

  // Apply filters when component mounts if initial filters are provided
  useEffect(() => {
    if (initialFilters.searchString || initialFilters.styles?.length || initialFilters.distance) {
      handleApplyFilters();
    }
  }, []);

  // Handle search string change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchString(e.target.value);
  };

  // Handle style checkbox change
  const handleStyleChange = (styleId: number) => {
    setSelectedStyles(prev => {
      if (prev.includes(styleId)) {
        return prev.filter(id => id !== styleId);
      } else {
        return [...prev, styleId];
      }
    });
  };

  // Handle distance change
  const handleDistanceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDistance(Number(e.target.value));
  };

  // Apply all filters
  const handleApplyFilters = () => {
    onFilterChange({
      searchString,
      styles: selectedStyles,
      distance
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchString('');
    setSelectedStyles([]);
    setDistance(50);
    
    onFilterChange({
      searchString: '',
      styles: [],
      distance: 50
    });
  };

  // Toggle sidebar expansion
  const toggleSidebar = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Notify parent component if callback exists
    if (onSidebarToggle) {
      onSidebarToggle(newExpandedState);
    }
  };

  return (
    <div className={`fixed left-0 top-24 h-[calc(100%-96px)] bg-white shadow-lg transition-all duration-300 z-10 flex ${isExpanded ? 'w-64' : 'w-10'}`}>
      {/* Toggle button */}
      <button 
        onClick={toggleSidebar}
        className="absolute right-0 transform translate-x-1/2 top-10 bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md focus:outline-none"
        aria-label={isExpanded ? 'Collapse filter sidebar' : 'Expand filter sidebar'}
      >
        {isExpanded ? '←' : '→'}
      </button>

      {/* Filter content - only show when expanded */}
      {isExpanded && (
        <div className="w-full h-full overflow-y-auto p-4 flex flex-col">
          <h2 className="text-lg font-medium text-gray-800 mb-6 sticky top-0 bg-white pt-2">
            Filter {type === 'artists' ? 'Artists' : 'Tattoos'}
          </h2>
          
          {/* Search input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={type === 'artists' ? "Artist name or studio" : "Tattoo description or tags"}
              value={searchString}
              onChange={handleSearchChange}
            />
          </div>
          
          {/* Styles selection as checkboxes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Styles
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2">
              {stylesLoading ? (
                <div className="text-gray-500 text-sm py-2">Loading styles...</div>
              ) : (
                <div className="space-y-2">
                  {styles.map(style => (
                    <div key={style.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`style-${style.id}`}
                        checked={selectedStyles.includes(style.id)}
                        onChange={() => handleStyleChange(style.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`style-${style.id}`} className="ml-2 block text-sm text-gray-700">
                        {style.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Distance selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Distance (miles)
            </label>
            <select
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={distance}
              onChange={handleDistanceChange}
            >
              {distanceOptions.map(option => (
                <option key={option} value={option}>{option} miles</option>
              ))}
            </select>
          </div>
          
          {/* Filter buttons */}
          <div className="mt-auto space-y-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleApplyFilters}
            >
              Apply Filters
            </button>
            <button
              type="button"
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleClearFilters}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
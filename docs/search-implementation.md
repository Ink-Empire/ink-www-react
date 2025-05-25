# Search Implementation in Inked In Frontend

This document details how search functionality is implemented in the Inked In frontend applications, building on the Elasticsearch-powered backend.

## Search Architecture

The search functionality is a core feature of the Inked In platform, enabling users to discover artists, tattoos, and studios based on various criteria:

1. **Search Components** - UI elements for user input and filter selection
2. **Search Services** - Middleware for translating UI actions to API requests
3. **Search Results** - Components for displaying and interacting with search results
4. **Location Services** - Integration with device geolocation

## Search User Interface

### Web Application Search Components

The web application implements search through several key components:

- **ArtistSearch.tsx** - Main search interface for artist discovery
- **SearchFilters.tsx** - Filter UI for refining search results
- **ActiveFilterBadges.tsx** - Visual indicators of active filters
- **StyleModal.tsx** - Interface for selecting tattoo styles

### Mobile Application Search Components

The mobile application uses native components for search:

- **SearchScreen.tsx** - Main search interface with native input controls
- **FilterModal** - Native modal for filter selection

## Search Data Flow

### Search Initialization

When a user initiates a search:

1. User enters search criteria (location, styles, text)
2. SearchFilters component updates search state
3. Search hook (e.g., useArtists, useTattoos) constructs query parameters
4. API service makes request to backend search endpoint
5. Results are mapped to UI components and displayed

```typescript
// Example from hooks/useArtists.ts
function useArtists(searchParams: ArtistSearchParams) {
  const [results, setResults] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    async function fetchArtists() {
      setLoading(true);
      try {
        const data = await artistService.searchArtists(searchParams);
        setResults(data.artists);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchArtists();
  }, [searchParams]);
  
  return { results, loading, error };
}
```

### Location-Based Search

For location-based searches:

1. Frontend requests device location (with user permission)
2. Coordinates are obtained via browser or device location API
3. Coordinates are included in search parameters
4. Backend performs geo-distance query using coordinates
5. Results include distance from user location

```typescript
// Example from hooks/useGeolocation.ts
function useGeolocation() {
  const [coords, setCoords] = useState<GeoCoordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  function requestLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );
  }
  
  return { coords, loading, error, requestLocation };
}
```

## Search Parameters Translation

The frontend translates UI filters to API parameters:

### Style Selection

Style selection is managed through the StyleContext:

```typescript
// Example from contexts/StyleContext.tsx
function StyleProvider({ children }: { children: React.ReactNode }) {
  const [selectedStyles, setSelectedStyles] = useState<number[]>([]);
  const [availableStyles, setAvailableStyles] = useState<Style[]>([]);
  
  useEffect(() => {
    // Load available styles from API
    async function loadStyles() {
      const styles = await fetch('/api/styles').then(res => res.json());
      setAvailableStyles(styles);
    }
    
    loadStyles();
  }, []);
  
  const toggleStyle = (styleId: number) => {
    setSelectedStyles(current => 
      current.includes(styleId)
        ? current.filter(id => id !== styleId)
        : [...current, styleId]
    );
  };
  
  return (
    <StyleContext.Provider value={{ 
      selectedStyles, 
      availableStyles, 
      toggleStyle 
    }}>
      {children}
    </StyleContext.Provider>
  );
}
```

### Distance Parameters

Distance controls allow users to specify search radius:

```typescript
// Example distance control handling
function DistanceControl({ value, onChange }: DistanceControlProps) {
  return (
    <div className="distance-slider">
      <label>Distance: {value} miles</label>
      <input 
        type="range" 
        min="5" 
        max="100" 
        step="5" 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))} 
      />
    </div>
  );
}
```

## Search Results Display

### Artist Results

Artist search results are displayed through the ArtistCard component:

```typescript
// Example from components/ArtistCard.tsx
function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <div className="artist-card">
      <img 
        src={artist.profile_image} 
        alt={artist.name} 
        className="artist-photo" 
      />
      <div className="artist-info">
        <h3>{artist.name}</h3>
        <p>{artist.studio?.name || 'Independent Artist'}</p>
        {artist.distance && (
          <span className="distance">{artist.distance.toFixed(1)} miles away</span>
        )}
        <div className="artist-styles">
          {artist.styles.map(style => (
            <span key={style.id} className="style-tag">{style.name}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Tattoo Results

Tattoo search results are displayed through the TattooCard component:

```typescript
// Example from components/TattooCard.tsx
function TattooCard({ tattoo }: { tattoo: Tattoo }) {
  return (
    <div className="tattoo-card">
      <img 
        src={tattoo.image_url} 
        alt={tattoo.title} 
        className="tattoo-image" 
      />
      <div className="tattoo-info">
        <h3>{tattoo.title}</h3>
        <p>By: {tattoo.artist.name}</p>
        <div className="tattoo-styles">
          {tattoo.styles.map(style => (
            <span key={style.id} className="style-tag">{style.name}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Pagination

For handling large result sets, pagination is implemented:

```typescript
// Example pagination implementation
function SearchPagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: PaginationProps) {
  return (
    <div className="pagination">
      <button 
        disabled={currentPage === 1} 
        onClick={() => onPageChange(currentPage - 1)}
        className="prev-page"
      >
        Previous
      </button>
      
      <span className="page-info">
        Page {currentPage} of {totalPages}
      </span>
      
      <button 
        disabled={currentPage === totalPages} 
        onClick={() => onPageChange(currentPage + 1)}
        className="next-page"
      >
        Next
      </button>
    </div>
  );
}
```

## Search History and Saved Searches

The application remembers recent searches and allows saving favorites:

```typescript
// Example search history management
function useSearchHistory() {
  const [searchHistory, setSearchHistory] = useState<SavedSearch[]>([]);
  
  useEffect(() => {
    // Load search history from local storage
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);
  
  function saveSearch(search: SavedSearch) {
    const updatedHistory = [search, ...searchHistory.slice(0, 9)];
    setSearchHistory(updatedHistory);
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
  }
  
  function clearHistory() {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  }
  
  return { searchHistory, saveSearch, clearHistory };
}
```

## Mobile-Specific Considerations

The mobile application has specific search implementations:

- **Native Location Services** - Uses device GPS for precise location
- **Offline Search Caching** - Caches recent search results for offline access
- **Touch-Optimized Filters** - Larger touch targets for mobile filter controls
- **Reduced Network Usage** - Optimized API requests for mobile data connections

## Performance Optimizations

Several optimizations improve search experience:

- **Debounced Search** - Prevents excessive API calls during typing
- **Result Caching** - Common search results are cached for better performance
- **Progressive Loading** - Results load incrementally with visual indicators
- **Search State Persistence** - Search state is preserved during navigation

## Accessibility Considerations

The search UI is designed with accessibility in mind:

- **Keyboard Navigation** - Full keyboard support for filter controls
- **Screen Reader Support** - Proper ARIA labels and semantics
- **High Contrast Mode** - Visual indicators work in high contrast settings
- **Focus Management** - Clear focus indicators for interactive elements
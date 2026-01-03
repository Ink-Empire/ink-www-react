export interface SearchFiltersUIProps {
  type: 'artists' | 'tattoos';
  searchString: string;
  selectedStyles: number[];
  selectedTags: number[];
  distance: number;
  distanceUnit: 'mi' | 'km';
  useMyLocation: boolean;
  useAnyLocation: boolean;
  applySavedStyles: boolean;
  booksOpen: boolean;
  location: string;
  locationCoords?: { lat: number; lng: number };
  geoLoading: boolean;
  geoError: string | null;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onApplySavedStylesChange: () => void;
  onBooksOpenChange: () => void;
  onStyleChange: (styleId: number) => void;
  onTagChange: (tagId: number) => void;
  onDistanceChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onDistanceUnitChange: (unit: 'mi' | 'km') => void;
  onLocationOptionChange: (locationType: 'my' | 'custom' | 'any') => Promise<void>;
  onLocationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLocationSelect: (location: string, coords: { lat: number; lng: number } | undefined) => void;
  onApplyFilters: () => void;
  onClearFilters: () => Promise<void>;
  onGuidedSearchApply: (data: {
    searchText: string;
    locationType: 'anywhere' | 'near_me' | 'custom' | null;
    customLocation: string;
    locationCoords?: { lat: number; lng: number };
  }) => Promise<void>;
  onCreateTattoo?: () => void;
}
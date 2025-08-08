export interface SearchFiltersUIProps {
  type: 'artists' | 'tattoos';
  searchString: string;
  selectedStyles: number[];
  distance: number;
  distanceUnit: 'mi' | 'km';
  useMyLocation: boolean;
  useAnyLocation: boolean;
  applySavedStyles: boolean;
  location: string;
  locationCoords?: { lat: number; lng: number };
  geoLoading: boolean;
  geoError: string | null;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onApplySavedStylesChange: () => void;
  onStyleChange: (styleId: number) => void;
  onDistanceChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onDistanceUnitChange: (unit: 'mi' | 'km') => void;
  onLocationOptionChange: (locationType: 'my' | 'custom' | 'any') => Promise<void>;
  onLocationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onApplyFilters: () => void;
  onClearFilters: () => Promise<void>;
  onCreateTattoo?: () => void;
}
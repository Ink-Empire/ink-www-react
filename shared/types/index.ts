// Shared types for InkedIn - used by both Next.js and React Native

// =============================================================================
// Common Types
// =============================================================================

export interface Image {
  id: number;
  uri: string;
  title?: string;
  filename?: string;
  artistId?: number;
  tattooId?: number;
}

export interface Style {
  id: number;
  name: string;
  parent_id?: number;
}

export interface Tag {
  id: number;
  name: string;
}

// =============================================================================
// User Types
// =============================================================================

export interface User {
  id: number;
  name: string;
  email: string;
  username?: string;
  slug?: string;
  about?: string;
  phone?: string;
  location?: string;
  location_lat_long?: string;
  image?: Image | string;
  type?: string;
  type_id?: number;
  styles?: number[];
  artists?: number[];
  tattoos?: number[];
  studios?: number[];
  is_studio_admin?: boolean;
  owned_studio?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  email_verified_at?: string;
  last_login_at?: string;
  created_at?: string;
  updated_at?: string;
}

// =============================================================================
// Artist Types
// =============================================================================

export interface ArtistSettings {
  id?: number;
  artist_id?: number;
  books_open?: boolean;
  accepts_walk_ins?: boolean;
  accepts_deposits?: boolean;
  accepts_consultations?: boolean;
  accepts_appointments?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Artist {
  id: number;
  slug?: string;
  name: string;
  email?: string;
  about?: string;
  phone?: string;
  location?: string;
  location_lat_long?: string;
  username?: string;
  type?: string;

  // Images
  image?: Image;
  primary_image?: Image;

  // Relations
  studio?: Studio;
  studio_id?: number;
  studio_name?: string;
  styles?: Style[];
  tattoos?: Tattoo[];

  // Settings
  settings?: ArtistSettings;

  // Social
  twitter?: string;
  instagram?: string;

  // Status
  is_featured?: boolean;
  is_verified?: boolean;
  rating?: number;

  // Working hours
  working_hours?: WorkingHours[];
}

// Alias for backward compatibility
export type ArtistType = Artist;

// =============================================================================
// Tattoo Types
// =============================================================================

export interface Tattoo {
  id: number;
  title?: string;
  description?: string;
  about?: string;
  placement?: string;

  // Relations
  artist?: Artist;
  artist_id?: number;
  artist_name?: string;
  studio?: Studio;
  studio_id?: number;
  user_id?: number;

  // Images
  primary_image?: Image;
  images?: Image[];

  // Categorization
  primary_style?: string;
  primary_subject?: string;
  styles?: Style[];
  tags?: Tag[];

  // Status
  is_featured?: boolean;

  type?: string;
}

// Alias for backward compatibility
export type TattooType = Tattoo;

// =============================================================================
// Studio Types
// =============================================================================

export interface StudioFeature {
  label: string;
  icon: string;
}

export interface StudioHours {
  day: string;
  hours: string;
  is_closed?: boolean;
  is_today?: boolean;
}

export interface StudioSocial {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  twitter?: string;
}

export interface StudioOpportunity {
  id: number;
  type: 'guest' | 'hire';
  title: string;
  meta?: string;
  description?: string;
}

export interface StudioGalleryItem {
  id: number;
  src: string;
  likes?: number;
  artist_id?: number;
  tattoo_id?: number;
}

export interface StudioReview {
  id: number;
  author: string;
  initials?: string;
  avatar?: string;
  date: string;
  rating: number;
  text: string;
}

export interface StudioReviews {
  average: number;
  total: number;
  breakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recent?: StudioReview[];
}

export interface StudioSettings {
  accepts_walk_ins?: boolean;
  accepts_deposits?: boolean;
  deposit_amount?: number;
  accepts_consultations?: boolean;
  consultation_fee?: number;
  private_rooms?: boolean;
  accepts_cards?: boolean;
}

export interface Studio {
  id: number;
  slug?: string;
  name: string;
  type?: string;

  // Basic info
  initials?: string;
  logo?: string;
  cover_image?: string;
  about?: string;
  phone?: string;
  email?: string;
  website?: string;

  // Location
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  location_lat_long?: string;

  // Status
  rating?: number;
  review_count?: number;
  artist_count?: number;
  established?: number;
  is_hiring?: boolean;
  seeking_guests?: boolean;
  is_verified?: boolean;

  // Features & Hours
  features?: StudioFeature[];
  hours?: StudioHours[];

  // Social
  social?: StudioSocial;

  // Relations
  artists?: Artist[];
  tattoos?: Tattoo[];
  reviews?: StudioReviews;
  opportunities?: StudioOpportunity[];
  gallery?: StudioGalleryItem[];

  // Settings
  settings?: StudioSettings;

  // Owner
  owner_id?: number;
}

// Alias for backward compatibility
export type StudioType = Studio;
export type IStudio = Studio;

// =============================================================================
// Working Hours Types
// =============================================================================

export interface WorkingHours {
  id?: number;
  artist_id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

// =============================================================================
// Appointment Types
// =============================================================================

export interface Appointment {
  id: number;
  client_id: number;
  artist_id: number;
  studio_id?: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  date: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  client?: User;
  artist?: Artist;
  studio?: Studio;
  created_at?: string;
  updated_at?: string;
}

// =============================================================================
// Search & Filter Types
// =============================================================================

export interface SearchFilters {
  searchString?: string;
  styles?: number[];
  tags?: number[];
  distance?: number;
  distanceUnit?: 'mi' | 'km';
  locationCoords?: string;
  useMyLocation?: boolean;
  useAnyLocation?: boolean;
  studio_id?: number;
  user_id?: number;
}

export interface SearchResponse<T> {
  data: T[];
  total: number;
  page?: number;
  per_page?: number;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  status?: number;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// =============================================================================
// Country/Location Types
// =============================================================================

export interface Country {
  id: number;
  name: string;
  code: string;
}

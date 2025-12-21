export interface StudioImage {
  id?: number;
  uri?: string;
  url?: string;
}

export interface StudioType {
  id?: number;
  slug?: string;
  type: string;
  name: string;
  initials?: string;
  logo?: string;
  cover_image?: string;
  primary_image?: StudioImage;
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
  seeking_guest_artists?: boolean;
  is_verified?: boolean;
  verified?: boolean;

  // Guest spots
  guest_spot_details?: string;

  // Announcements
  announcements?: any[];

  // Features
  features?: StudioFeature[];

  // Hours
  hours?: StudioHours[];

  // Social
  social?: StudioSocial;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;

  // Image
  image?: StudioImage;

  // Relations
  artists?: any[];
  tattoos?: any[];
  reviews?: StudioReviews;
  opportunities?: StudioOpportunity[];
  gallery?: StudioGalleryItem[];

  // Settings
  settings?: StudioSettings;
}

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

export interface StudioReview {
  id: number;
  author: string;
  initials?: string;
  avatar?: string;
  date: string;
  rating: number;
  text: string;
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

// Alias for backward compatibility
export type IStudio = StudioType;

// Dashboard shared types

export interface DashboardStats {
  upcomingAppointments: number;
  appointmentsTrend: string;
  profileViews: number;
  viewsTrend: string;
  savesThisWeek: number;
  savesTrend: string;
  unreadMessages: number;
}

export interface ScheduleItem {
  id: number;
  day: number;
  month: string;
  time: string;
  title: string;
  clientName: string;
  clientInitials: string;
  type: string;
}

export interface ClientItem {
  id: number;
  name: string;
  initials: string;
  hint: string;
  hintType: string;
}

export interface ActivityItem {
  id: number;
  user: string;
  action: string;
  target: string;
  time: string;
  type: string;
}

export interface GuestSpotStudio {
  id: number;
  name: string;
  initials: string;
  location: string;
  viewedAgo: string;
  rating: number;
  reviews: number;
  styles: string[];
  seeking: boolean;
}

export interface GuestSpotRegion {
  region: string;
  flag: string;
  studioCount: number;
  studios: GuestSpotStudio[];
}

export interface StudioArtist {
  id: number;
  name: string;
  username: string;
  image?: { uri?: string };
  is_verified?: boolean;
  verified_at?: string | null;
  initiated_by?: 'studio' | 'artist';  // 'studio' = invitation, 'artist' = request to join
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
}

export interface Tattoo {
  id: number;
  description?: string;
  is_featured: boolean;
  primary_image?: { uri?: string };
  images?: { uri?: string }[];
}

export interface LeadUser {
  id: number;
  name: string;
  username: string;
  email: string;
  image?: { uri?: string } | string;
  location?: string;
}

export interface Lead {
  id: number;
  timing: string | null;
  timing_label: string;
  description?: string;
  custom_themes?: string[];
  user: LeadUser;
}

export type DashboardTabType = 'artist' | 'studio';

// Default empty states
export const defaultStats: DashboardStats = {
  upcomingAppointments: 0,
  appointmentsTrend: '+0',
  profileViews: 0,
  viewsTrend: '+0%',
  savesThisWeek: 0,
  savesTrend: '+0',
  unreadMessages: 0
};

export type AuthStackParamList = {
  Login: undefined;
  Register: { userType?: 'client' | 'artist' | 'studio' } | undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string };
};

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  ArtistsTab: undefined;
  UploadTab: undefined;
  FavoritesTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  ArtistDetail: { slug: string; name?: string };
  TattooDetail: { id: number };
  StudioDetail: { slug: string; name?: string };
  Calendar: { artistId: number; artistName?: string; artistSlug?: string };
};

export type SearchStackParamList = {
  Search: { tab?: 'tattoos' | 'artists' } | undefined;
  ArtistList: { styleId?: number; searchQuery?: string } | undefined;
  ArtistDetail: { slug: string; name?: string };
  TattooDetail: { id: number };
  StudioDetail: { slug: string; name?: string };
};

export type FavoritesStackParamList = {
  Favorites: undefined;
  ArtistDetail: { slug: string; name?: string };
  TattooDetail: { id: number };
  StudioDetail: { slug: string; name?: string };
};

export type ArtistsStackParamList = {
  ArtistList: { styleId?: number; searchQuery?: string; filterStyles?: number[]; filterTags?: number[] } | undefined;
  ArtistDetail: { slug: string; name?: string };
  TattooDetail: { id: number };
  StudioDetail: { slug: string; name?: string };
  Calendar: { artistId: number; artistName?: string; artistSlug?: string };
};

export type UploadStackParamList = {
  Upload: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  ArtistDetail: { slug: string; name?: string };
  TattooDetail: { id: number };
  StudioDetail: { slug: string; name?: string };
  Calendar: { artistId: number; artistName?: string; artistSlug?: string };
};

import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: { userType?: 'client' | 'artist' | 'studio' } | undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string };
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  InboxStack: NavigatorScreenParams<InboxStackParamList>;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  SearchTab: NavigatorScreenParams<SearchStackParamList>;
  ArtistsTab: NavigatorScreenParams<ArtistsStackParamList>;
  UploadTab: NavigatorScreenParams<UploadStackParamList>;
  FavoritesTab: NavigatorScreenParams<FavoritesStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type HomeStackParamList = {
  Home: undefined;
  ArtistDetail: { slug: string; name?: string };
  TattooDetail: { id: number };
  EditTattoo: { id: number };
  StudioDetail: { slug: string; name?: string };
  Calendar: { artistId: number; artistName?: string; artistSlug?: string };
};

export type SearchStackParamList = {
  Search: { tab?: 'tattoos' | 'artists' } | undefined;
  ArtistList: { styleId?: number; searchQuery?: string } | undefined;
  ArtistDetail: { slug: string; name?: string };
  TattooDetail: { id: number };
  EditTattoo: { id: number };
  StudioDetail: { slug: string; name?: string };
};

export type FavoritesStackParamList = {
  Favorites: undefined;
  ArtistDetail: { slug: string; name?: string };
  TattooDetail: { id: number };
  EditTattoo: { id: number };
  StudioDetail: { slug: string; name?: string };
};

export type ArtistsStackParamList = {
  ArtistList: { styleId?: number; searchQuery?: string; filterStyles?: number[]; filterTags?: number[] } | undefined;
  ArtistDetail: { slug: string; name?: string };
  TattooDetail: { id: number };
  EditTattoo: { id: number };
  StudioDetail: { slug: string; name?: string };
  Calendar: { artistId: number; artistName?: string; artistSlug?: string };
};

export type UploadStackParamList = {
  Upload: undefined;
};

export type InboxStackParamList = {
  Inbox: undefined;
  Conversation: { conversationId?: number; clientId?: number; participantName?: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  NotificationSettings: undefined;
  BookingSettings: undefined;
  ArtistDetail: { slug: string; name?: string };
  TattooDetail: { id: number };
  EditTattoo: { id: number };
  StudioDetail: { slug: string; name?: string };
  Calendar: { artistId: number; artistName?: string; artistSlug?: string };
};

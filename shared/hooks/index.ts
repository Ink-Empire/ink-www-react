export {
  useApiGet,
  useApiPost,
  useApiMutation,
  type UseApiOptions,
  type UseApiResult,
} from './useApi';

export {
  useArtists,
  useArtist,
  useArtistPortfolio,
  type UseArtistsOptions,
  type UseArtistsResult,
} from './useArtists';

export {
  useTattoos,
  useTattoo,
  type UseTattoosOptions,
  type UseTattoosResult,
} from './useTattoos';

export {
  useStudio,
  useStudioGallery,
  useStudioArtists,
} from './useStudios';

export { useStyles, useTags } from './useStyles';

export { usePlacements } from './usePlacements';

export { useCalendar } from './useCalendar';

export { useConversations, useConversation, useUnreadCount, type RealtimeConfig } from './useMessages';

export { useUserProfile } from './useUserProfile';

export { useUserTattoos, type UseUserTattoosResult } from './useUserTattoos';

export { usePendingApprovals, type UsePendingApprovalsResult } from './usePendingApprovals';

export { useNotifications, useUnreadNotificationCount } from './useNotifications';

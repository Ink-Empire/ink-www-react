// Service Layer Barrel Exports
// All API interactions should go through these services

export { artistService } from './artistService';
export { appointmentService } from './appointmentService';
export { imageService } from './imageService';
export { authService } from './authService';
export { bulkUploadService } from './bulkUploadService';
export { calendarService } from './calendarService';
export { clientService } from './clientService';
export { feedbackService } from './feedbackService';
export { googlePlacesService } from './googlePlacesService';
export { leadService } from './leadService';
export { messageService } from './messageService';
export { studioService } from './studioService';
export { stylesService } from './stylesService';
export { tattooService } from './tattooService';
export { userService } from './userService';

// Re-export types
export type {
  CreateAppointmentData,
  AppointmentInviteData,
  CalendarEventData,
  AppointmentResponse,
} from './appointmentService';

export type {
  SendMessageData,
  Conversation,
  Message,
} from './messageService';

export type {
  WorkingHour,
  TimeSlot,
  CalendarDay,
} from './calendarService';

export type {
  FeedbackData,
  ReviewData,
} from './feedbackService';

export type {
  LoginCredentials,
  LoginResponse,
  RegisterData,
  ResetPasswordData,
} from './authService';

export type {
  CreateLeadData,
  WishlistItem,
  LeadStatusResponse,
} from './leadService';

export type {
  Style,
} from './stylesService';

export type {
  UpdateProfileData,
  ChangePasswordData,
} from './userService';

export type {
  BulkUpload,
  BulkUploadItem,
  ItemsResponse,
} from './bulkUploadService';

export type {
  DashboardAppointment,
  SuggestedArtist,
  WishlistArtist,
  ClientDashboardResponse,
} from './clientService';

export type {
  ImagePurpose,
} from './imageService';

# InkedIn Service Layer Architecture

This document outlines the service layer architecture, data flow, and when to use each service or hook.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              UI Components                                   │
│                    (Pages, Screens, Modal Components)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
            ┌───────────┐    ┌───────────┐    ┌───────────────┐
            │   Hooks   │    │ Services  │    │   Contexts    │
            │ (Reading) │    │ (Actions) │    │ (Global State)│
            └───────────┘    └───────────┘    └───────────────┘
                    │                │                │
                    └────────────────┼────────────────┘
                                     │
                                     ▼
                         ┌───────────────────┐
                         │   API Client      │
                         │  (utils/api.ts)   │
                         └───────────────────┘
                                     │
                                     ▼
                         ┌───────────────────┐
                         │    Backend API    │
                         │    (ink-api)      │
                         └───────────────────┘
```

## When to Use What

### Services (for Actions/Mutations)

**Use services when:**
- Creating, updating, or deleting data
- Performing one-time API calls (not on component mount)
- Handling form submissions
- User-triggered actions (button clicks, form submits)

```typescript
// Example: Form submission
const handleSubmit = async () => {
  try {
    await appointmentService.create(appointmentData);
    // Handle success
  } catch (err) {
    // Handle error
  }
};
```

### Hooks (for Reading/Loading Data)

**Use hooks when:**
- Loading data on component mount
- Need loading/error state management
- Data needs to be refreshed
- Multiple components need the same data pattern

```typescript
// Example: Loading data on mount
const { artists, loading, error, refresh } = useArtists(filters);
```

### Contexts (for Global State)

**Use contexts when:**
- State needs to be shared across many components
- Authentication state
- User preferences
- Theme/styling data

```typescript
// Example: Accessing global state
const { user, isAuthenticated, logout } = useAuth();
const { styles } = useStyles();
```

---

## Service Reference

### artistService
**Domain:** Artist profiles, settings, working hours

| Method | Description | When to Use |
|--------|-------------|-------------|
| `getById(id)` | Get artist by ID/slug | Artist profile pages |
| `search(params)` | Search artists with filters | Search results, listings |
| `getWorkingHours(id)` | Get artist availability | Calendar, booking |
| `setWorkingHours(id, hours)` | Update artist availability | Settings page |
| `getSettings(id)` | Get artist settings | Profile/settings pages |
| `updateSettings(id, settings)` | Update artist settings | Settings forms |
| `getBySlug(slug)` | Get artist with tattoos | Dashboard tattoo loading |
| `getDashboardStats(id)` | Get artist dashboard stats | Artist dashboard |
| `getUpcomingSchedule(id)` | Get upcoming appointments | Dashboard schedule |

### studioService
**Domain:** Studio profiles, artists, announcements, working hours

| Method | Description | When to Use |
|--------|-------------|-------------|
| `getById(id)` | Get studio by ID/slug | Studio profile pages |
| `search(params)` | Search studios | Search results |
| `create(data)` | Create new studio | Registration |
| `update(id, data)` | Update studio | Edit studio modal |
| `updateDetails(id, data)` | Update via /studios/studio endpoint | Dashboard settings |
| `getArtists(id)` | Get studio's artists | Studio profile, calendar |
| `addArtist(id, username)` | Add artist to studio | Add artist modal |
| `removeArtist(studioId, artistId)` | Remove artist | Studio management |
| `verifyArtist(studioId, artistId)` | Verify artist employment | Studio management |
| `unverifyArtist(studioId, artistId)` | Remove verification | Studio management |
| `getHours(id)` | Get studio working hours | Studio profile |
| `setWorkingHours(id, hours)` | Set studio hours | Studio settings |
| `claim(id, data)` | Claim existing studio | Registration flow |
| `createAnnouncement(id, data)` | Create announcement | Studio dashboard |
| `deleteAnnouncement(studioId, announcementId)` | Delete announcement | Studio dashboard |
| `uploadImage(id, imageId)` | Upload studio image (by ID) | After S3 upload |
| `uploadImageFile(id, formData)` | Upload image file directly | Edit studio modal |
| `getDashboardStats(id)` | Get studio dashboard stats | Studio dashboard |

### appointmentService
**Domain:** Appointments, bookings, calendar events

| Method | Description | When to Use |
|--------|-------------|-------------|
| `create(data)` | Create appointment request | Booking flow |
| `getById(id)` | Get single appointment | Appointment details |
| `getByArtist(id)` | Get artist's appointments | Artist calendar |
| `getByStudio(id)` | Get studio's appointments | Studio calendar |
| `respond(id, response)` | Accept/decline appointment | Inbox actions |
| `cancel(id, reason)` | Cancel appointment | Appointment management |
| `update(id, data)` | Update appointment | Reschedule |
| `delete(id)` | Delete appointment | Appointment management |
| `getInbox(userId)` | Get pending appointments | Inbox page |
| `getHistory(userId, page)` | Get past appointments | History tab |
| `updateStatus(id, status)` | Quick status update | Inbox actions |
| `getArtistAppointments(params)` | Get filtered appointments | Calendar views |

### tattooService
**Domain:** Tattoos, portfolio management

| Method | Description | When to Use |
|--------|-------------|-------------|
| `getById(id)` | Get tattoo details | Tattoo detail page |
| `search(params)` | Search tattoos | Gallery, search |
| `getByArtist(id)` | Get artist's tattoos | Artist profile |
| `create(data)` | Create new tattoo | Upload flow |
| `update(id, data)` | Update tattoo | Edit tattoo |
| `delete(id)` | Delete tattoo | Tattoo management |
| `toggleFeatured(id)` | Toggle featured status | Dashboard |
| `addTags(id, tags)` | Add tags by name | Tag management |
| `addTagById(id, tagId)` | Add single tag by ID | AI suggestions |

### userService
**Domain:** User profiles, blocking, favorites

| Method | Description | When to Use |
|--------|-------------|-------------|
| `getMe()` | Get current user | Auth check |
| `getById(id)` | Get user by ID | User profiles |
| `update(id, data)` | Update profile | Profile settings |
| `changePassword(data)` | Change password | Security settings |
| `uploadProfilePhoto(data)` | Upload avatar | Profile photo change |
| `block(userId)` | Block a user | User blocking |
| `unblock(userId)` | Unblock a user | Unblock action |
| `toggleFavorite(type, id, action)` | Add/remove favorite | Wishlist |
| `getFavorites(type)` | Get user's favorites | Favorites page |

### messageService
**Domain:** Conversations, messaging

| Method | Description | When to Use |
|--------|-------------|-------------|
| `getConversations()` | List all conversations | Inbox |
| `getConversation(id)` | Get single conversation | Conversation view |
| `getConversationMessages(id, params)` | Get messages (paginated) | Message history |
| `sendConversationMessage(id, data)` | Send message | Chat |
| `markConversationRead(id)` | Mark as read | Opening conversation |
| `getUnreadConversationCount()` | Get unread count | Notification badge |
| `createConversation(data)` | Start new conversation | New message |

### authService
**Domain:** Authentication, registration, password reset

| Method | Description | When to Use |
|--------|-------------|-------------|
| `login(credentials)` | User login | Login form |
| `logout()` | User logout | Logout action |
| `register(data)` | User registration | Registration flow |
| `getCurrentUser()` | Get authenticated user | Auth state init |
| `forgotPassword(email)` | Request password reset | Forgot password |
| `resetPassword(data)` | Reset with token | Reset password page |
| `resendVerification(email)` | Resend verification | Verification page |
| `sendVerificationNotification(email)` | Send verification | Post-registration |

### calendarService
**Domain:** Calendar-specific operations (NOT working hours - use artistService/studioService)

| Method | Description | When to Use |
|--------|-------------|-------------|
| `getAvailableSlots(artistId, date)` | Get time slots for date | Booking calendar |
| `getCalendarView(artistId, start, end)` | Get calendar data | Calendar display |
| `blockTime(artistId, data)` | Block time off | Artist calendar |
| `unblockTime(artistId, blockId)` | Unblock time | Artist calendar |
| `getGoogleCalendarStatus()` | Check Google connection | Settings |
| `getGoogleCalendarAuthUrl()` | Get OAuth URL | Connect Google |
| `disconnectGoogleCalendar()` | Disconnect Google | Settings |
| `syncGoogleCalendar()` | Manual sync | Settings |
| `toggleGoogleCalendarSync()` | Toggle auto-sync | Settings |

### leadService
**Domain:** Client leads, wishlists

| Method | Description | When to Use |
|--------|-------------|-------------|
| `getStatus()` | Get lead status | Client dashboard |
| `create(data)` | Create lead | Lead form |
| `update(data)` | Update lead | Edit lead |
| `deactivate()` | Deactivate lead | Lead management |
| `getForArtists()` | Get leads for artists | Artist dashboard |
| `getWishlist()` | Get client wishlist | Wishlist page |
| `addToWishlist(data)` | Add to wishlist | Save artist |
| `removeFromWishlist(id)` | Remove from wishlist | Unsave artist |

### clientService
**Domain:** Client dashboard, favorites

| Method | Description | When to Use |
|--------|-------------|-------------|
| `getDashboard()` | Get dashboard data | Client dashboard |
| `getFavorites()` | Get favorite artists | Favorites section |
| `getSuggestedArtists(limit)` | Get suggestions | Dashboard suggestions |
| `addFavorite(artistId)` | Add favorite | Save artist |
| `removeFavorite(artistId)` | Remove favorite | Unsave artist |
| `updateWishlistNotification(id, notify)` | Toggle notifications | Notification settings |

### bulkUploadService
**Domain:** Bulk tattoo uploads (Instagram import)

| Method | Description | When to Use |
|--------|-------------|-------------|
| `list()` | List all uploads | Upload management |
| `getById(id)` | Get upload details | Upload detail page |
| `delete(id)` | Delete upload | Upload management |
| `getItems(uploadId, options)` | Get upload items | Item review |
| `updateItem(uploadId, itemId, data)` | Update single item | Item editing |
| `batchUpdateItems(uploadId, itemIds, updates)` | Batch update | Bulk editing |
| `processBatch(uploadId, batchSize)` | Process next batch | Processing |
| `processRange(uploadId, from, to)` | Process range | Selective processing |
| `publish(uploadId)` | Publish ready items | Publishing |
| `getPublishStatus(uploadId)` | Get publish status | Status check |

---

## Hook Reference

### Data Fetching Hooks

| Hook | Service Used | Purpose |
|------|--------------|---------|
| `useArtists(filters)` | `artistService.search()` | Search/list artists |
| `useTattoos(params)` | `tattooService.search()` | Search/list tattoos |
| `useStudios()` | `studioService.search()` | List studios |
| `useWorkingHours(artistId)` | `artistService.getWorkingHours/setWorkingHours` | Artist availability |
| `useConversations()` | `messageService` | All conversations |
| `useConversation(id)` | `messageService` | Single conversation |
| `useInbox(userId)` | `appointmentService` | Pending appointments |
| `useInboxCount(userId)` | `appointmentService` | Unread count |
| `useClientDashboard()` | `clientService` | Client dashboard data |
| `useWishlist()` | `clientService` | Wishlist management |
| `useSuggestedArtists(limit)` | `clientService` | Artist suggestions |
| `useArtistAppointments(params)` | `appointmentService` | Filtered appointments |
| `useGoogleCalendar()` | `calendarService` | Google Calendar integration |
| `useBulkUpload()` | `bulkUploadService` | Bulk upload operations |

---

## Data Flow Examples

### 1. Artist Search Flow
```
User types search → SearchPage
    │
    ▼
useArtists(filters) hook triggers
    │
    ▼
artistService.search(params) called
    │
    ▼
API response → hook updates state
    │
    ▼
Component re-renders with results
```

### 2. Appointment Booking Flow
```
User selects time slot → BookingModal
    │
    ▼
appointmentService.create(data) called
    │
    ▼
On success → Show confirmation
    │
    ▼
Navigate to inbox or refresh calendar
```

### 3. Profile Settings Update
```
User edits settings → ProfilePage
    │
    ▼
handleSave() triggers
    │
    ▼
artistService.updateSettings(id, data) called
    │
    ▼
On success → Show toast, update local state
```

---

## React Native Integration Status

### Current State

The React Native app exists in `/reactnative` but has **limited integration** with the shared service layer:

| Component | Status | Notes |
|-----------|--------|-------|
| Shared API Client | ✅ Exists | `/shared/api/client.ts` - Platform-agnostic |
| Shared Service Factories | ✅ Exists | `/shared/services/index.ts` - Basic services |
| Shared Hooks | ✅ Exists | `/shared/hooks/` - useArtists, useTattoos, etc. |
| React Native Implementation | ⚠️ Partial | Basic screens exist, not using shared services |

### Architecture Gap

The Next.js app has evolved independently with a much richer service layer than what exists in `/shared/services/`:

**Next.js services (comprehensive):**
- 16 services with 100+ methods
- Full CRUD operations
- Specialized endpoints (dashboard stats, bulk upload, etc.)

**Shared services (basic):**
- 5 service factories
- ~20 methods total
- Basic CRUD only

### Recommended Path Forward

1. **Option A: Migrate shared services to match Next.js**
   - Update `/shared/services/` to include all methods from Next.js services
   - Refactor Next.js to use shared service factories
   - React Native uses same shared services

2. **Option B: Keep services platform-specific**
   - Shared types and interfaces only
   - Each platform implements its own services
   - Easier to maintain platform-specific optimizations

3. **Option C: Gradual migration (Recommended)**
   - Keep Next.js services as-is for now
   - When building React Native features, add to shared services
   - Eventually converge on shared layer

---

## File Structure

```
/inked-in-www
├── /nextjs
│   ├── /services          # Next.js specific services (comprehensive)
│   │   ├── artistService.ts
│   │   ├── appointmentService.ts
│   │   ├── authService.ts
│   │   ├── bulkUploadService.ts
│   │   ├── calendarService.ts
│   │   ├── clientService.ts
│   │   ├── feedbackService.ts
│   │   ├── googlePlacesService.ts
│   │   ├── leadService.ts
│   │   ├── messageService.ts
│   │   ├── studioService.ts
│   │   ├── stylesService.ts
│   │   ├── tattooService.ts
│   │   ├── userService.ts
│   │   └── index.ts       # Barrel exports
│   ├── /hooks             # Next.js hooks (use services)
│   ├── /contexts          # Global state (Auth, Styles, etc.)
│   └── /utils/api.ts      # API client singleton
│
├── /shared                # Cross-platform shared code
│   ├── /api/client.ts     # API client factory
│   ├── /services/         # Service factories (basic)
│   ├── /hooks/            # Shared hooks
│   └── /types/            # Shared TypeScript types
│
└── /reactnative
    └── /app
        ├── /screens/      # React Native screens
        ├── /components/   # React Native components
        └── /models/       # Type definitions
```

---

## Best Practices

1. **Never import `api` directly in components** - Always use services
2. **Use hooks for data loading** - Let hooks manage loading/error state
3. **Use services for mutations** - Direct service calls for create/update/delete
4. **Keep services stateless** - Services are pure API wrappers
5. **Keep hooks composable** - Hooks manage React state
6. **Contexts for global state only** - Don't overuse contexts

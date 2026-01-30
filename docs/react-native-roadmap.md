# React Native Development Roadmap

This document outlines the steps to flesh out the React Native application and establishes guidelines for ensuring all future development is cross-platform compatible.

---

## Current State Assessment

### What Exists

```
/reactnative
├── /app
│   ├── /screens           # 5 basic screens
│   │   ├── HomeScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── ArtistListScreen.tsx
│   │   ├── ArtistDetailScreen.tsx
│   │   └── CalendarScreen.tsx
│   ├── /components
│   │   ├── ArtistCard.tsx
│   │   └── /Calendar
│   └── /models            # Basic interfaces
│
/shared
├── /api/client.ts         # Platform-agnostic API client ✅
├── /services/index.ts     # Basic service factories (incomplete)
├── /hooks/                # 5 shared hooks (incomplete)
└── /types/                # Shared TypeScript types
```

### Gap Analysis

| Feature Area | Next.js | Shared | React Native | Priority |
|--------------|---------|--------|--------------|----------|
| Authentication | Full | Partial | None | P0 |
| Artist Search | Full | Basic | Basic | P1 |
| Tattoo Search | Full | Basic | None | P1 |
| Artist Profiles | Full | Basic | Basic | P1 |
| Booking/Calendar | Full | None | Partial | P0 |
| Messaging | Full | None | None | P1 |
| User Dashboard | Full | None | None | P2 |
| Artist Dashboard | Full | None | None | P2 |
| Studio Management | Full | None | None | P3 |
| Bulk Upload | Full | None | N/A | N/A |

---

## Phase 1: Foundation (Do First)

### 1.1 Establish Shared API Client

The shared API client already exists but needs platform-specific configuration.

**Create platform adapters:**

```typescript
// shared/api/adapters/web.ts
import { createApiClient } from '../client';

export const webApiClient = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  getToken: async () => localStorage.getItem('auth_token'),
  setToken: async (token) => localStorage.setItem('auth_token', token),
  removeToken: async () => localStorage.removeItem('auth_token'),
  onUnauthorized: () => window.location.href = '/login',
});

// shared/api/adapters/mobile.ts
import { createApiClient } from '../client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const mobileApiClient = createApiClient({
  baseUrl: Config.API_URL, // react-native-config
  getToken: async () => AsyncStorage.getItem('auth_token'),
  setToken: async (token) => AsyncStorage.setItem('auth_token', token),
  removeToken: async () => AsyncStorage.removeItem('auth_token'),
  onUnauthorized: () => navigationRef.navigate('Login'),
});
```

### 1.2 Migrate Services to Shared

**Priority order for service migration:**

1. **authService** - Required for everything
2. **artistService** - Core functionality
3. **tattooService** - Core functionality
4. **appointmentService** - Booking flow
5. **calendarService** - Availability
6. **messageService** - Communication
7. **userService** - Profile management
8. **studioService** - Studio features
9. **leadService** - Client features
10. **clientService** - Client dashboard

**Migration pattern:**

```typescript
// shared/services/artistService.ts
import type { ApiClient } from '../api';
import type { Artist, SearchFilters } from '../types';

export function createArtistService(api: ApiClient) {
  return {
    // Migrate ALL methods from nextjs/services/artistService.ts
    search: (params: SearchFilters) =>
      api.post<{ response: Artist[]; total: number }>('/artists', params, {
        headers: { 'X-Account-Type': 'artist' },
      }),

    getById: (idOrSlug: string | number) =>
      api.get<{ artist: Artist }>(`/artists/${idOrSlug}`),

    getWorkingHours: (idOrSlug: string | number) =>
      api.get<any[]>(`/artists/${idOrSlug}/working-hours`),

    setWorkingHours: (artistId: string | number, hours: any[]) =>
      api.post(`/artists/${artistId}/working-hours`, { availability: hours }, {
        requiresAuth: true,
      }),

    getSettings: (artistId: string | number) =>
      api.get(`/artists/${artistId}/settings`, { requiresAuth: true }),

    updateSettings: (artistId: string | number, settings: Record<string, any>) =>
      api.put(`/artists/${artistId}/settings`, settings, { requiresAuth: true }),

    // ... ALL other methods
  };
}

export type ArtistService = ReturnType<typeof createArtistService>;
```

### 1.3 Create Service Instances

```typescript
// shared/services/index.ts
export * from './artistService';
export * from './tattooService';
export * from './authService';
// ... etc

// nextjs/services/index.ts
import { webApiClient } from '@inkedin/shared/api/adapters/web';
import { createArtistService, createTattooService } from '@inkedin/shared/services';

export const artistService = createArtistService(webApiClient);
export const tattooService = createTattooService(webApiClient);
// ... etc

// reactnative/services/index.ts
import { mobileApiClient } from '@inkedin/shared/api/adapters/mobile';
import { createArtistService, createTattooService } from '@inkedin/shared/services';

export const artistService = createArtistService(mobileApiClient);
export const tattooService = createTattooService(mobileApiClient);
// ... etc
```

---

## Phase 2: Shared Hooks

### 2.1 Make Hooks Platform-Agnostic

Hooks should accept a service instance rather than importing directly:

```typescript
// shared/hooks/useArtists.ts
import { useState, useEffect } from 'react';
import type { ArtistService } from '../services/artistService';
import type { Artist, SearchFilters } from '../types';

export function createUseArtists(artistService: ArtistService) {
  return function useArtists(initialFilters?: SearchFilters) {
    const [artists, setArtists] = useState<Artist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState(initialFilters);

    const fetchArtists = async () => {
      setLoading(true);
      try {
        const response = await artistService.search(filters || {});
        setArtists(response.response || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchArtists();
    }, [JSON.stringify(filters)]);

    return { artists, loading, error, setFilters, refresh: fetchArtists };
  };
}
```

### 2.2 Platform Hook Exports

```typescript
// nextjs/hooks/useArtists.ts
import { createUseArtists } from '@inkedin/shared/hooks/useArtists';
import { artistService } from '../services';

export const useArtists = createUseArtists(artistService);

// reactnative/hooks/useArtists.ts
import { createUseArtists } from '@inkedin/shared/hooks/useArtists';
import { artistService } from '../services';

export const useArtists = createUseArtists(artistService);
```

---

## Phase 3: React Native Screens

### 3.1 Screen Priority

**P0 - Launch Blockers:**
1. Login/Register screens
2. Search (Artists & Tattoos)
3. Artist Profile view
4. Booking flow
5. User Profile

**P1 - Core Experience:**
6. Messaging/Inbox
7. Appointment management
8. Favorites/Wishlist
9. Notifications

**P2 - Full Feature Parity:**
10. Artist Dashboard
11. Client Dashboard
12. Settings
13. Working hours management

**P3 - Advanced:**
14. Studio management
15. Google Calendar integration

### 3.2 Screen Implementation Pattern

```typescript
// reactnative/app/screens/ArtistSearchScreen.tsx
import React from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import { useArtists } from '../../hooks';
import { ArtistCard } from '../components';
import { SearchFilters } from '../components/SearchFilters';

export const ArtistSearchScreen: React.FC = () => {
  const { artists, loading, error, setFilters, refresh } = useArtists();

  if (loading) return <ActivityIndicator />;
  if (error) return <ErrorView message={error} onRetry={refresh} />;

  return (
    <View>
      <SearchFilters onFilterChange={setFilters} />
      <FlatList
        data={artists}
        renderItem={({ item }) => <ArtistCard artist={item} />}
        keyExtractor={(item) => item.id.toString()}
        onRefresh={refresh}
        refreshing={loading}
      />
    </View>
  );
};
```

---

## Phase 4: Shared Components (Optional)

For maximum code reuse, consider shared component logic with platform-specific rendering:

```typescript
// shared/components/ArtistCard/useArtistCard.ts
export function useArtistCard(artist: Artist) {
  const [isFavorite, setIsFavorite] = useState(false);

  const handleFavoriteToggle = async () => {
    // Shared logic
  };

  return { isFavorite, handleFavoriteToggle };
}

// nextjs/components/ArtistCard.tsx
import { useArtistCard } from '@inkedin/shared/components/ArtistCard/useArtistCard';

export const ArtistCard: React.FC<{ artist: Artist }> = ({ artist }) => {
  const { isFavorite, handleFavoriteToggle } = useArtistCard(artist);

  return (
    <Box sx={{ /* MUI styles */ }}>
      {/* Web-specific rendering */}
    </Box>
  );
};

// reactnative/components/ArtistCard.tsx
import { useArtistCard } from '@inkedin/shared/components/ArtistCard/useArtistCard';

export const ArtistCard: React.FC<{ artist: Artist }> = ({ artist }) => {
  const { isFavorite, handleFavoriteToggle } = useArtistCard(artist);

  return (
    <View style={styles.card}>
      {/* Native-specific rendering */}
    </View>
  );
};
```

---

## Guidelines for Future Development

### Rule 1: Services Go in Shared

**All new service methods must be added to shared services.**

```typescript
// ❌ DON'T: Add to nextjs/services only
// nextjs/services/newService.ts
export const newService = {
  doThing: () => api.post('/thing'),
};

// ✅ DO: Add to shared services
// shared/services/newService.ts
export function createNewService(api: ApiClient) {
  return {
    doThing: () => api.post('/thing'),
  };
}
```

### Rule 2: Types Go in Shared

**All TypeScript interfaces must be in shared/types.**

```typescript
// ❌ DON'T: Define types in platform folders
// nextjs/types/appointment.ts

// ✅ DO: Define in shared
// shared/types/appointment.ts
export interface Appointment {
  id: number;
  artist_id: number;
  // ...
}
```

### Rule 3: Hooks Use Dependency Injection

**Hooks should accept services as parameters or use factory pattern.**

```typescript
// ❌ DON'T: Import service directly in shared hooks
import { artistService } from '../services';

// ✅ DO: Use factory pattern
export function createUseArtists(artistService: ArtistService) {
  return function useArtists() { /* ... */ };
}
```

### Rule 4: No Platform-Specific Code in Shared

**Shared code must not import from react-native or next.**

```typescript
// ❌ DON'T: Platform imports in shared
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'next/router';

// ✅ DO: Use abstractions
// Pass platform-specific implementations via config/props
```

### Rule 5: Test Services in Isolation

**Services should be testable without React.**

```typescript
// shared/services/__tests__/artistService.test.ts
import { createArtistService } from '../artistService';

const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  // ...
};

describe('artistService', () => {
  const service = createArtistService(mockApi as any);

  it('searches artists', async () => {
    mockApi.post.mockResolvedValue({ response: [] });
    await service.search({ query: 'test' });
    expect(mockApi.post).toHaveBeenCalledWith('/artists', { query: 'test' }, expect.any(Object));
  });
});
```

---

## Migration Checklist

### Pre-Migration
- [ ] Audit all Next.js services for complete method list
- [ ] Document all API endpoints used
- [ ] Set up shared package build pipeline
- [ ] Configure TypeScript paths for shared imports

### Phase 1: Foundation
- [ ] Create platform API adapters (web, mobile)
- [ ] Migrate authService to shared
- [ ] Migrate artistService to shared
- [ ] Migrate tattooService to shared
- [ ] Update Next.js to use shared services
- [ ] Verify Next.js still works

### Phase 2: Core Services
- [ ] Migrate appointmentService
- [ ] Migrate calendarService
- [ ] Migrate messageService
- [ ] Migrate userService
- [ ] Migrate studioService
- [ ] Update Next.js imports
- [ ] Run full regression test

### Phase 3: Remaining Services
- [ ] Migrate leadService
- [ ] Migrate clientService
- [ ] Migrate stylesService
- [ ] Migrate feedbackService
- [ ] Migrate googlePlacesService
- [ ] (Skip bulkUploadService - web only)

### Phase 4: Hooks
- [ ] Convert useArtists to factory
- [ ] Convert useTattoos to factory
- [ ] Convert useWorkingHours to factory
- [ ] Convert useConversations to factory
- [ ] Convert useInbox to factory
- [ ] Create platform-specific exports

### Phase 5: React Native Screens
- [ ] Implement Auth screens (Login, Register, ForgotPassword)
- [ ] Implement Search screens
- [ ] Implement Artist Profile
- [ ] Implement Booking flow
- [ ] Implement Messaging
- [ ] Implement User Profile/Settings
- [ ] Implement Dashboard (Artist/Client)

### Phase 6: Polish
- [ ] Push notifications setup
- [ ] Deep linking
- [ ] Offline support
- [ ] App Store/Play Store prep

---

## File Structure (Target State)

```
/inked-in-www
├── /shared                          # Shared cross-platform code
│   ├── /api
│   │   ├── client.ts               # API client factory
│   │   ├── adapters/
│   │   │   ├── web.ts              # Web-specific config
│   │   │   └── mobile.ts           # Mobile-specific config
│   │   └── index.ts
│   ├── /services                    # ALL services live here
│   │   ├── artistService.ts
│   │   ├── appointmentService.ts
│   │   ├── authService.ts
│   │   ├── calendarService.ts
│   │   ├── clientService.ts
│   │   ├── leadService.ts
│   │   ├── messageService.ts
│   │   ├── studioService.ts
│   │   ├── tattooService.ts
│   │   ├── userService.ts
│   │   └── index.ts
│   ├── /hooks                       # Shared hook factories
│   │   ├── useArtists.ts
│   │   ├── useTattoos.ts
│   │   ├── useAuth.ts
│   │   └── index.ts
│   ├── /types                       # ALL types live here
│   │   ├── artist.ts
│   │   ├── appointment.ts
│   │   ├── tattoo.ts
│   │   ├── user.ts
│   │   └── index.ts
│   └── /utils                       # Shared utilities
│       ├── formatting.ts
│       ├── validation.ts
│       └── index.ts
│
├── /nextjs                          # Web application
│   ├── /services/index.ts          # Instantiates shared services
│   ├── /hooks/index.ts             # Instantiates shared hooks
│   ├── /contexts                    # Web-specific contexts
│   ├── /components                  # Web-specific components
│   └── /pages                       # Next.js pages
│
└── /reactnative                     # Mobile application
    ├── /services/index.ts          # Instantiates shared services
    ├── /hooks/index.ts             # Instantiates shared hooks
    ├── /contexts                    # Mobile-specific contexts
    ├── /components                  # Mobile-specific components
    └── /screens                     # React Native screens
```

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| TBD | Use factory pattern for services | Allows platform-specific API clients |
| TBD | Keep components platform-specific | UI differs too much between web/mobile |
| TBD | Share business logic via hooks | Reduces duplication of state management |
| TBD | Skip bulkUploadService for mobile | Instagram import is web-only feature |

---

## Questions to Resolve

1. **Monorepo tooling?** - Consider Turborepo, Nx, or yarn workspaces
2. **Shared package publishing?** - npm package or path aliases?
3. **State management?** - Context vs Redux vs Zustand for mobile?
4. **Navigation?** - React Navigation configuration
5. **Push notifications?** - Firebase vs OneSignal vs Expo
6. **Offline support scope?** - Which features work offline?

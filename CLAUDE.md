# ink-api Development Guide

## Production URLs
- **Frontend**: https://getinked.in (NOT inkedin.com)
- **API**: https://api.getinked.in

## Code Completion Guidelines
- Never use hardcoded data when fulfilling prompts. We will get data from the API and generate test data in the API.

## API Organization Guidelines

### Architecture Pattern
We use a three-tier architecture for all API interactions:

```
Components → Hooks/Services → API Client (utils/api.ts) → Backend
```

### Service Layer (REQUIRED)
**All API endpoints must have a corresponding service method.** Never call `api.post()`, `api.get()`, etc. directly in components.

**Good:**
```typescript
// In services/appointmentService.ts
export const appointmentService = {
  create: async (data: CreateAppointmentData) => {
    return api.post('/appointments', data, { requiresAuth: true });
  }
};

// In component
const handleBook = async () => {
  await appointmentService.create(appointmentData);
};
```

**Bad:**
```typescript
// In component - DON'T DO THIS
const handleBook = async () => {
  await api.post('/appointments', appointmentData, { requiresAuth: true });
};
```

### Service Organization
Organize services by domain in the `services/` directory:

```
services/
├── artistService.ts          # Artist CRUD operations
├── tattooService.ts          # Tattoo CRUD operations
├── studioService.ts          # Studio CRUD operations
├── appointmentService.ts     # Booking/scheduling
├── messageService.ts         # Messaging
├── googlePlacesService.ts    # External APIs
└── index.ts                  # Barrel exports
```

Each service should export an object with methods:
```typescript
export const resourceService = {
  getAll: async (params?) => api.post('/resources', params),
  getById: async (id) => api.get(`/resources/${id}`),
  create: async (data) => api.post('/resources', data, { requiresAuth: true }),
  update: async (id, data) => api.put(`/resources/${id}`, data, { requiresAuth: true }),
  delete: async (id) => api.delete(`/resources/${id}`, { requiresAuth: true }),
};
```

### Custom Hooks
Create custom hooks for data fetching in the `hooks/` directory:

**When to create a hook:**
- Data is fetched on component mount
- Multiple components need the same data
- Need loading/error states management
- Need refetch/invalidation logic

**Example:**
```typescript
// hooks/useAppointments.ts
export function useAppointments(filters?: AppointmentFilters) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const data = await appointmentService.getAll(filters);
        setAppointments(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [JSON.stringify(filters)]);

  return { appointments, loading, error };
}
```

### Component Responsibilities
Components should **only**:
1. Call hooks for data fetching
2. Call service methods for mutations (create/update/delete)
3. Handle UI state (loading spinners, error messages, success states)
4. Handle form validation

Components should **never**:
- Import `api` from `utils/api.ts` directly
- Construct API endpoint URLs
- Handle token management
- Implement caching logic

### Error Handling Pattern
```typescript
try {
  await resourceService.create(data);
  // Handle success (close modal, show toast, redirect, etc.)
} catch (err: any) {
  if (err.status === 422) {
    // Validation errors
    setError(err.message || 'Please check your input.');
  } else if (err.status === 403 && err.requires_verification) {
    // Email verification required
    router.push('/verify-email');
  } else if (err.status === 401) {
    // Handled by AuthContext - user will be logged out
  } else {
    // Generic error
    setError('An error occurred. Please try again.');
  }
} finally {
  setIsLoading(false);
}
```

### Caching
The API client includes automatic caching for GET requests (5-minute TTL). Use these options:

```typescript
// Use cache (default for GET requests)
await resourceService.getById(id); // cached

// Force fresh data
await api.get('/endpoint', { useCache: false });

// Invalidate cache after mutation
import { clearCache } from '@/utils/apiCache';
await resourceService.update(id, data);
clearCache(); // or clearCacheItem(cacheKey)
```

### Common Headers
- `X-Account-Type: 'artist' | 'user'` - Filter results by user type
- `requiresAuth: true` - Automatically adds Bearer token
- Custom headers passed in options object

### Creating New Services
When adding a new API endpoint:
1. Create or update the relevant service file in `services/`
2. Add TypeScript interfaces in `shared/types/` if needed
3. Create a custom hook in `hooks/` if the data will be fetched on mount
4. Use the service method in components
5. Never call the API client directly

## URL Routing Patterns
- **Artist pages**: Always use `slug`, NOT `username` → `/artists/${artist.slug}`
- **Studio pages**: Use `slug` → `/studios/${studio.slug}`
- **Tattoo pages**: Use `id` → `/tattoos?id=${tattoo.id}` or open TattooModal directly

## Code Style Guidelines
- **Framework**: NextJs, ReactNative
- **Namespacing**: PSR-4 with App\\ namespace
- **Folder Structure**: Follow React and NextJs best practices
- **Error Handling**: Use exceptions and proper try/catch blocks
- **Testing**: Playwright
- **Documentation**: DocBlocks on classes and complex methods
- **Git Flow**: Don't automatically perform any git operations; I'll handle git and version control

## Testing Guidelines
- All tests should follow Laravel testing conventions
- Mocking should be reserved for complex situations
- Laravel models should be used directly in tests whenever possible
- All test methods should be prefixed with "test"; this is required in the latest version of PHPUnit

All code changes must pass CI tests and receive an approval before merging to develop.

Never ever run NPM commands. I will rebuild my own project.
Always check the /ink-api/docs directory to understand the flow and update it when we make changes to a process.
Always use the colors.ts for our styles.
Always reuse components where possible.
Always plan designs with mobile views in mind.

## File Size Guidelines
- **Keep files under 500 lines** where possible. If a file exceeds this, consider refactoring.
- Extract reusable components into separate files (e.g., `components/dashboard/` for dashboard-specific components).
- Use barrel exports (`index.ts`) to simplify imports from component directories.
- Shared types should live in a `types.ts` file within the relevant component directory.
- When a page component grows large, extract tab content or sections into separate components.
- Keep comments to a minimum and never put emojis into this project
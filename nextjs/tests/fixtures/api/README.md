# API Fixtures

This directory contains JSON fixtures exported from ink-api contract tests.

## Setup

Pull fixtures from S3:

```bash
npm run pull:fixtures
```

## Structure

```
api/
  artist/
    detail.json           # GET /api/artists/{id}
    search.json           # POST /api/artists
    settings-owner.json   # GET /api/artists/{id}/settings (authenticated)
    working-hours.json    # GET /api/artists/{id}/working-hours
    dashboard-stats.json  # GET /api/artists/{id}/dashboard-stats
  client/
    dashboard.json        # GET /api/client/dashboard
    favorites.json        # GET /api/client/favorites
    wishlist.json         # GET /api/client/wishlist
    suggested-artists.json # GET /api/client/suggested-artists
  tattoo/
    detail.json           # GET /api/tattoos/{id}
    search.json           # POST /api/tattoos
    create-response.json  # POST /api/tattoos/create
    update-response.json  # PUT /api/tattoos/{id}
  user/
    profile.json          # GET /api/users/{id}
    update-response.json  # PUT /api/users/{id}
  index.ts                # TypeScript exports
```

## Usage

```typescript
import { apiFixtures } from '../fixtures/api';

// Mock API in Playwright
await page.route('**/api/client/dashboard', route => {
  route.fulfill({ json: apiFixtures.client.dashboard });
});
```

See [docs/api-fixtures.md](../../../docs/api-fixtures.md) for full documentation.

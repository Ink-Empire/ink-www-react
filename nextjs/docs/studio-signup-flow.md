after # Studio Signup Flow

## Overview

When a user registers as a "Tattoo Studio", they go through a specialized onboarding flow that creates both a personal user account (the studio owner) and a studio entity. The owner's user account is linked to the studio via the `owner_id` field on the studios table.

## User Flow

### Step 1: User Type Selection
User selects "Tattoo Studio" from the three options:
- Tattoo Enthusiast (client)
- Tattoo Artist
- **Tattoo Studio** ← triggers this flow

### Step 2: Studio Owner Check
Asks if the user has an existing InkedIn account:

**Option A: "Yes, I have an account"**
- User enters their email address
- System checks if account exists via `/users/check-email` endpoint
- If found and user is already an artist → proceeds with their existing account as owner
- If found but not an artist → asks if they want to also be an artist (Step 2b)
- If not found → shows message and proceeds to create new account

**Option B: "No, I'm new here"**
- Proceeds directly to Step 2b

### Step 2b: Personal Profile Type
Asks: "Are you a tattoo artist yourself?"

- **"Yes, I'm a Tattoo Artist"**
  - Owner's personal account will be created as type `artist`
  - They get their own artist profile to showcase work
  - Can appear in artist searches independently of the studio
  - **Continues to Step 3 (Your Styles)**

- **"No, I'm Not an Artist"**
  - Owner's personal account will be created as type `user`
  - Standard account to manage the studio
  - Won't appear in artist searches
  - **Skips directly to Your Profile (Step 4)**

### Step 3: Your Specialty Styles (Artist Owners Only)
If owner selected "I'm a Tattoo Artist":
- Select the tattoo styles **they personally** specialize in
- This is for their artist profile
- Stored in `studioOwner.artistStyles`

### Step 4: Your Profile (Owner's Personal Profile)
- **Name** - Owner's full name or artist name
- **Username** - Unique identifier for the owner's profile URL
- **Bio** - Personal bio/description
- **Location** - Owner's location
- **Profile Image** - Owner's photo (optional)

### Step 5: Account Credentials
- Email address (for the owner's personal account)
- Password
- Creates the owner's user account upon completion

### Step 6: Studio Profile Details
- **Studio Name** - The name of the studio (displayed publicly)
- **Username** - Unique identifier for the studio URL (`/studios/{username}`)
- **Bio** - Description of the studio
- **Location** - Physical location of the studio
- **Profile Image** - Studio logo or photo (optional)

> **Note:** Studio styles are NOT collected during signup. They are derived from the artists who work at the studio.

## Data Model

### OnboardingData (Frontend)
```typescript
{
  userType: 'studio',
  selectedStyles: number[],           // Not used for studios
  userDetails: {                      // Owner's personal profile info
    name: string,                     // Owner's name
    username: string,                 // Owner's username
    bio: string,                      // Owner's bio
    profileImage?: File,              // Owner's profile image
    location: string,
    locationLatLong: string,
  },
  credentials: {
    email: string,
    password: string,
    password_confirmation: string,
  },
  studioDetails: {                    // Studio-specific info (separate from owner)
    name: string,                     // Studio name
    username: string,                 // Studio username/slug
    bio: string,                      // Studio description
    profileImage?: File,              // Studio logo/image
    location: string,
    locationLatLong: string,
  },
  studioOwner: {
    hasExistingAccount: boolean,
    existingAccountEmail?: string,    // If linking existing account
    existingAccountId?: number,       // If linking existing account
    ownerType: 'artist' | 'user',     // Owner's personal profile type
    artistStyles?: number[],          // Owner's specialty styles (if artist)
  }
}
```

### User (with studio admin fields)
```typescript
{
  id: number,
  name: string,
  email: string,
  type: 'artist' | 'user',            // Owner's personal type
  owned_studio: {                      // Studio owned by this user (if any)
    id: number,
    name: string,
    slug: string,
  } | null
}
```

## Registration Process (Frontend → Backend)

### 1. Create Owner Account
If no existing account, POST to `/api/register`:
```json
{
  "name": "Owner Name",
  "username": "owner_username",
  "slug": "owner-username",
  "email": "owner@example.com",
  "password": "...",
  "password_confirmation": "...",
  "bio": "Owner's personal bio...",
  "type": "artist",                    // or "user" based on selection
  "selected_styles": [1, 2, 3],        // Artist styles (if owner is artist)
  "is_studio_owner": true,
  "location": "City, State",
  "location_lat_long": "lat,lng"
}
```

### 2. Upload Owner Profile Image (if provided)
POST to `/api/users/profile-photo` with FormData containing the image.

### 3. Create Studio
POST to `/api/studios`:
```json
{
  "name": "Studio Name",
  "slug": "studio-name",
  "bio": "Studio description...",
  "location": "City, State",
  "location_lat_long": "lat,lng",
  "owner_id": 123                      // User ID from step 1
}
```

### 4. Upload Studio Image (if provided)
POST to `/api/studios/{id}/image` with FormData containing the image.

## Backend Requirements

### Required Endpoints

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/users/check-email` | POST | **TODO** | Check if email exists, return user info |
| `/api/register` | POST | Working | Create user account |
| `/api/studios` | POST | **Verify** | Create studio with `owner_id` |
| `/api/studios/{id}/image` | POST | **Verify** | Upload studio image |
| `/api/users/me` | GET | **Update** | Include `owned_studio` |

### Database Schema

**studios table:**
- `owner_id` (foreign key to users.id) - **Required for this flow**

**users table (relationship):**
- `ownedStudio` - hasOne relationship to Studio where `owner_id = user.id`

## Dashboard Integration

When a user has `owned_studio` data, the dashboard shows:
- A "Studio Dashboard" button linking to `/studios/{slug}/dashboard`
- Appears alongside "View Public Profile" and "Upload Tattoo" buttons

## Status

| Feature | Status | Notes |
|---------|--------|-------|
| StudioOwnerCheck component | **Complete** | Frontend flow implemented |
| OnboardingWizard integration | **Complete** | Studio flow added |
| Registration handling | **Complete** | Creates owner + studio |
| Dashboard studio link | **Complete** | Shows when owned_studio exists |
| `/users/check-email` endpoint | **TODO** | Backend needs to implement |
| `/studios` POST with owner_id | **Verify** | Backend may need updates |
| `/users/me` with studio data | **TODO** | Backend needs to return studio info |
| Studio dashboard page | **TODO** | `/studios/[slug]/dashboard` not created |

## Files Modified

- `components/Onboarding/StudioOwnerCheck.tsx` - New component for owner check step
- `components/Onboarding/StudioDetails.tsx` - New component for studio profile step
- `components/Onboarding/OnboardingWizard.tsx` - Added studio flow with separate user/studio steps
- `components/Onboarding/StylesSelection.tsx` - Added custom title/subtitle props
- `components/Onboarding/index.ts` - Export new components
- `pages/register.tsx` - Updated studio registration handler with new data structure
- `contexts/AuthContext.tsx` - Added studio fields to User interface
- `pages/dashboard.tsx` - Added studio dashboard link

## Future Considerations

1. **Existing account login flow**: When user says they have an account, should we prompt them to log in first before creating the studio?

2. **Multiple studio ownership**: Current design assumes one studio per owner. May need to support multiple studios.

3. **Studio team members**: How do other users (non-owners) get added to manage a studio?

4. **Owner transfer**: How does ownership transfer work if the studio is sold?

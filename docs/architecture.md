# Inked In Frontend Architecture

This document provides an overview of the Inked In frontend architecture and how it integrates with the ink-api backend.

## Architecture Overview

The Inked In frontend is built using a modern React-based stack with both web and mobile applications:

1. **Web Application** - Next.js React application
2. **Mobile Application** - React Native application
3. **Shared Components** - Reusable components and hooks across platforms
4. **API Integration Layer** - Services for communicating with ink-api

## Core Components

### Web Application (Next.js)

The web application is built with Next.js, providing server-side rendering capabilities and optimized performance. Key aspects include:

- **Page-Based Routing** - Follows Next.js file-based routing conventions
- **Server-Side Rendering** - Initial data loading happens server-side for SEO benefits
- **Client-Side Navigation** - After initial load, client-side routing is used for fast navigation
- **Responsive Design** - Fully responsive layout works across all device sizes

### Mobile Application (React Native)

The mobile application uses React Native to provide a native experience on both iOS and Android:

- **Screen-Based Navigation** - Uses React Navigation for mobile-specific navigation
- **Native Components** - Leverages platform-specific UI elements for best user experience
- **Offline Support** - Partial functionality available without network connection
- **Push Notifications** - Native notification support for appointment reminders

### Shared Logic

Both applications share common logic and data structures:

- **TypeScript Interfaces** - Shared data models ensure consistency
- **API Integration** - Common API service layer for backend communication
- **Authentication** - Shared authentication context and token management
- **State Management** - Consistent approach to managing application state

## API Integration

The frontend communicates with ink-api through a structured service layer:

### Service Architecture

Services are organized by domain and provide a clean interface to the API:

- `artistService.ts` - Artist-related operations
- `studioService.ts` - Studio-related operations
- `tattooService.ts` - Tattoo management operations
- `api.ts` - Base API utilities and request handling

### Authentication Flow

1. User submits login/register credentials
2. Backend validates and returns authentication token
3. Token is stored (localStorage for web, AsyncStorage for mobile)
4. Token is included in subsequent API requests
5. Auth context provides user state to components

### Search Integration

The search functionality connects to the Elasticsearch-powered backend:

- **Search Parameters** - Translates UI filters to API query parameters
- **Location Services** - Integrates device geolocation with API location search
- **Result Rendering** - Maps API response data to UI components
- **Pagination** - Handles result paging for large result sets

## User Interface Components

### Core UI Components

- **Artist Cards** - Display artist information in search results and listings
- **Tattoo Cards** - Present tattoo images with metadata
- **Search Filters** - UI for filtering search results
- **Appointment Calendar** - Interface for booking and viewing appointments
- **User Profiles** - Display user information and saved content

### Context Providers

The application uses React Context for state management:

- **AuthContext** - Manages user authentication state
- **StyleContext** - Provides tattoo style data throughout the application
- **UserContext** - Stores and provides user preferences and data

## Data Flow

### Search Flow

1. User inputs search criteria (location, styles, text query)
2. UI translates inputs to API parameters
3. API request sent to backend search endpoints
4. Results received and transformed for UI consumption
5. UI renders paginated results
6. User can refine search with additional filters

### Appointment Booking Flow

1. User selects artist and views availability calendar
2. Available time slots displayed based on artist's settings
3. User selects time slot and confirms appointment
4. Appointment creation request sent to API
5. Confirmation displayed with appointment details
6. Calendar updated to reflect new appointment

## Responsive Design

The application implements responsive design using:

- **Tailwind CSS** - Utility-first CSS framework for consistent styling
- **Responsive Components** - UI components adapt to different screen sizes
- **Device Detection** - Enhanced experiences based on device capabilities
- **Adaptive Layouts** - Layout changes based on viewport size

## Performance Optimizations

Several strategies are used to ensure optimal performance:

- **API Response Caching** - Common responses cached to reduce API calls
- **Image Optimization** - Images served at appropriate sizes for devices
- **Code Splitting** - Only necessary JavaScript loaded per page
- **Server-Side Rendering** - Initial content delivered fully rendered

## Environment Configuration

The application supports multiple environments with corresponding API endpoints:

- **Development** - Local development environment
- **Staging** - Pre-production testing environment
- **Production** - Live production environment

Configuration variables control API endpoints, feature flags, and environment-specific settings.
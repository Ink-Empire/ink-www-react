// Geolocation utilities - platform agnostic

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationResult {
  coords: Coordinates;
  accuracy?: number;
  timestamp?: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

// Convert coordinates to lat,long string format used by API
export function coordsToString(coords: Coordinates): string {
  return `${coords.latitude},${coords.longitude}`;
}

// Parse lat,long string to coordinates
export function stringToCoords(latLong: string): Coordinates | null {
  if (!latLong) return null;

  const parts = latLong.split(',');
  if (parts.length !== 2) return null;

  const latitude = parseFloat(parts[0]);
  const longitude = parseFloat(parts[1]);

  if (isNaN(latitude) || isNaN(longitude)) return null;

  return { latitude, longitude };
}

// Calculate distance between two points (Haversine formula)
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates,
  unit: 'mi' | 'km' = 'mi'
): number {
  const R = unit === 'mi' ? 3959 : 6371; // Earth's radius in miles or km

  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) *
    Math.cos(toRad(point2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Format distance for display
export function formatDistance(distance: number, unit: 'mi' | 'km' = 'mi'): string {
  if (distance < 1) {
    // Show in smaller units for short distances
    if (unit === 'mi') {
      return `${Math.round(distance * 5280)} ft`;
    } else {
      return `${Math.round(distance * 1000)} m`;
    }
  }

  if (distance < 10) {
    return `${distance.toFixed(1)} ${unit}`;
  }

  return `${Math.round(distance)} ${unit}`;
}

// Check if coordinates are valid
export function isValidCoords(coords: Coordinates | null | undefined): boolean {
  if (!coords) return false;

  const { latitude, longitude } = coords;

  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

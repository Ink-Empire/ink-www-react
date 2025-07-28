/**
 * Utility for managing user's distance filter preferences
 * Tracks whether user has dismissed distance filters to prevent them from returning
 */

const DISTANCE_DISMISSED_KEY = 'inkedin_distance_dismissed';

export const distancePreferences = {
  /**
   * Check if user has previously dismissed distance filtering
   */
  hasUserDismissedDistance(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(DISTANCE_DISMISSED_KEY) === 'true';
  },

  /**
   * Mark that user has dismissed distance filtering
   */
  setDistanceDismissed(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DISTANCE_DISMISSED_KEY, 'true');
  },

  /**
   * Clear the dismissed state (for testing or reset)
   */
  clearDistanceDismissed(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(DISTANCE_DISMISSED_KEY);
  },

  /**
   * Get default location settings based on user preference and location data
   */
  getDefaultLocationSettings(userHasLocation?: boolean): {
    distance: number;
    useMyLocation: boolean;
    useAnyLocation: boolean;
    location: string;
  } {
    const hasDismissed = this.hasUserDismissedDistance();
    
    if (hasDismissed) {
      // User has dismissed distance - always use "anywhere"
      return {
        distance: 50, // Keep distance value but useAnyLocation will ignore it
        useMyLocation: false,
        useAnyLocation: true,
        location: ""
      };
    } else {
      // First time or user hasn't dismissed - use location-based defaults
      return {
        distance: 50,
        useMyLocation: userHasLocation ? true : false,
        useAnyLocation: userHasLocation ? false : true,
        location: ""
      };
    }
  }
};
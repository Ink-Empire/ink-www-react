/**
 * Utility to clear all authentication-related cached data
 * This ensures no stale user data persists after login failures or logout
 */

export const clearAuthCache = () => {
  if (typeof window === 'undefined') return;

  console.log('Clearing all authentication-related cached data');
  
  // Clear core auth data
  localStorage.removeItem('user_data');
  localStorage.removeItem('user_id');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('csrf_token');
  
  // Clear user-specific cached data
  const userCacheKeys = [
    'tattoos_cache',
    'artists_cache', 
    'styles_cache',
    'profile_photo',
    'distance_dismissed',
    'onboarding_user_type'
  ];
  
  userCacheKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('Auth cache cleared successfully');
};

export const clearUserSpecificCache = () => {
  if (typeof window === 'undefined') return;
  
  // Clear only user-specific data, keep general app data
  localStorage.removeItem('user_data');
  localStorage.removeItem('user_id');
  localStorage.removeItem('profile_photo');
  
  console.log('User-specific cache cleared');
};
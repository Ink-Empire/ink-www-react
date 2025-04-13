import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../utils/api';

// Define interfaces for our user data
interface UserData {
  id?: number;
  name?: string;
  username?: string;
  slug?: string;
  email?: string;
  styles?: number[];
  phone?: string;
  location?: string;
  location_x?: number;
  location_y?: number;
  image?: string;
  favorites?: {
    artist?: number[];
    tattoo?: number[];
    studio?: number[];
  };
  profilePhoto?: {
    filepath?: string;
    webviewPath?: string;
  };
}

// Type for the enhanced user data returned by useUserData hook
interface EnhancedUserData extends UserData {
  location_lat_long: any;
  updateUser: (data: Partial<UserData>) => Promise<void>;
  updateStyles: (styles: number[]) => Promise<void>;
  toggleFavorite: (type: "artist" | "tattoo | studio", id: number | undefined) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  _data: UserData; // Clean data without methods
}

interface UserContextType {
  userData: UserData;
  loading: boolean;
  error: string | null;
  updateUser: (data: Partial<UserData>) => Promise<void>;
  updateStyles: (styles: number[]) => Promise<void>;
  toggleFavorite: (type: 'artist' | 'tattoo |  studio', id: number) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  userData: {},
  loading: false,
  error: null,
  updateUser: async () => {},
  updateStyles: async () => {},
  toggleFavorite: async () => {},
  logout: () => {},
});

// Helper functions
const USER_STORAGE_KEY = 'user_data';
const USER_ID_KEY = 'user_id';

const loadUserFromStorage = (): UserData => {
  if (typeof window === 'undefined') return {};
  
  try {
    const userData = localStorage.getItem(USER_STORAGE_KEY);
    return userData ? JSON.parse(userData) : {};
  } catch (e) {
    console.error('Error loading user data from storage', e);
    return {};
  }
};

const saveUserToStorage = (data: UserData): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
    if (data.id) {
      localStorage.setItem(USER_ID_KEY, data.id.toString());
    }
  } catch (e) {
    console.error('Error saving user data to storage', e);
  }
};

// Provider component
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData>(loadUserFromStorage());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load user data when component mounts
  useEffect(() => {
    // Flag to prevent memory leaks if component unmounts during fetch
    let isMounted = true;
    
    const fetchUserData = async () => {
      // Check if we have a user ID stored
      const userId = localStorage.getItem(USER_ID_KEY);
      console.log('UserContext: Found user ID in localStorage:', userId);
      
      // First, check if we have cached userData in localStorage
      const cachedUserData = loadUserFromStorage();
      if (cachedUserData && cachedUserData.id) {
        // If we have cached data, use it initially
        console.log('UserContext: Using cached user data with ID:', cachedUserData.id);
        setUserData(cachedUserData);
        // Still set loading to true to indicate we're refreshing in the background
        // but the UI can already use the cached data
      }
      
      // Set loading state only if we don't have cached data
      if (!cachedUserData || !cachedUserData.id) {
        setLoading(true);
      }
      
      try {
        // STRATEGY 1: First try with specific user ID if available (most reliable)
        if (userId) {
          try {
            console.log(`UserContext: Fetching specific user data for ID ${userId}`);
            const directResponse = await api.get<{data?: UserData, user?: UserData}>(`/users/${userId}`, { 
              requiresAuth: true,
              useCache: false, // Force a fresh request
            });
            
            // If component unmounted during fetch, don't update state
            if (!isMounted) return;
            
            if (directResponse) {
              // API might return data in different formats
              const directUserData = directResponse.data || directResponse.user || directResponse;
              
              console.log('UserContext: Successfully fetched user by ID:', userId);
              
              // Ensure the ID is correctly set
              directUserData.id = Number(userId);
              
              // Update state and storage
              setUserData(directUserData);
              saveUserToStorage(directUserData);
              setLoading(false);
              return; // Successfully fetched by ID
            }
          } catch (idErr) {
            console.error(`UserContext: Failed to fetch user with ID ${userId}:`, idErr);
            // Continue to next strategy
          }
        }
        
        // STRATEGY 2: Try the /users/me endpoint
        try {
          console.log('UserContext: Fetching user data from /api/users/me');
          const response = await api.get<{data: UserData}>('/users/me', { 
            requiresAuth: true,
            useCache: false, // Force a fresh request
          });
          
          // If component unmounted during fetch, don't update state
          if (!isMounted) return;
          
          // Unwrap the user data from the nested 'data' object
          const userData = response.data || response;
          
          console.log('UserContext: User data received from /users/me');
          
          if (userData) {
            setUserData(userData);
            saveUserToStorage(userData);
            setLoading(false);
            return; // Successfully fetched from /users/me
          }
        } catch (meErr) {
          // If component unmounted during fetch, don't update state
          if (!isMounted) return;
          
          console.log('UserContext: Failed to fetch from /api/users/me:', meErr);
          // Continue to fallback strategy
        }
        
        // FALLBACK STRATEGY: If both approaches failed but we have cached data, keep using it
        if (cachedUserData && cachedUserData.id) {
          console.log('UserContext: Using only cached data as fallback');
          // No need to update state as we already set it above
        } else {
          // We have no data at all
          console.error('UserContext: Failed to load user data from any source');
          setError('Failed to load user data');
        }
      } finally {
        // If component unmounted during fetch, don't update state
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchUserData();
    
    // Clean up function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, []);

  // Update user data
  const updateUser = async (data: Partial<UserData>): Promise<void> => {
    if (!userData.id) {
      setError('User is not logged in');
      return;
    }
    
    setLoading(true);
    
    try {
      // Get current auth token
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        console.warn('No auth token found when trying to update user');
        throw new Error('Authentication required');
      }
      
      // Make API call with explicit auth token in options
      const response = await api.put<{ user: UserData }>(`/users/${userData.id}`, data, {
        requiresAuth: true,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.user) {
        setUserData(response.user);
        saveUserToStorage(response.user);
      } else if (response) {
        // API might return the user directly without nesting in user property
        const updatedData = response.data || response;
        setUserData(updatedData);
        saveUserToStorage(updatedData);
      }
    } catch (err) {
      console.error('Error updating user', err);
      setError('Failed to update user data');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user styles
  const updateStyles = async (styles: number[]): Promise<void> => {
    return updateUser({ styles });
  };

  // Toggle favorite for an artist or tattoo
  const toggleFavorite = async (type: 'artist' | 'tattoo | studio', id: number): Promise<void> => {
    if (!userData.id) {
      setError('User is not logged in');
      return;
    }
    
    setLoading(true);
    
    try {
      // Get current auth token
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        console.warn('No auth token found when trying to update favorites');
        throw new Error('Authentication required');
      }
      
      // Initialize favorites structure if it doesn't exist
      const currentFavorites = userData.favorites || { artists: [], tattoos: [] };
      const currentTypeList = currentFavorites[type] || [];
      
      // Check if item is already in favorites
      const isAlreadyFavorite = currentTypeList.includes(id);
      
      // Update favorite list 
      let updatedFavorites;
      if (isAlreadyFavorite) {
        // Remove from favorites
        updatedFavorites = {
          ...currentFavorites,
          [type]: currentTypeList.filter(itemId => itemId !== id)
        };
      } else {
        // Add to favorites
        updatedFavorites = {
          ...currentFavorites,
          [type]: [...currentTypeList, id]
        };
      }
      
      // Perform API call to update favorites on the server with explicit token
      await api.post(`/users/favorites/${type}`, {
        ids: id,
        action: isAlreadyFavorite ? 'remove' : 'add'
      }, { 
        requiresAuth: true,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      // Update local state
      const updatedUserData = {
        ...userData,
        favorites: updatedFavorites
      };
      
      setUserData(updatedUserData);
      saveUserToStorage(updatedUserData);
      
      console.log(`${isAlreadyFavorite ? 'Removed from' : 'Added to'} favorites: ${type} with ID ${id}`);
    } catch (err) {
      console.error('Error updating favorites', err);
      setError('Failed to update favorites');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = (): void => {
    // Clear user data in state
    setUserData({});
    
    if (typeof window !== 'undefined') {
      console.log('UserContext: Clearing all user data during logout');
      
      // Remove specific user data keys we know about
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(USER_ID_KEY);
      localStorage.removeItem('auth_token');
      
      // Find and remove any other user-related cache items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('user') || key.includes('token') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      
      // Remove identified keys
      keysToRemove.forEach(key => {
        console.log(`UserContext: Removing localStorage item: ${key}`);
        localStorage.removeItem(key);
      });
      
      // Also try to clear any API cache related to user data
      try {
        // Clear API cache related to user data using our specialized method
        api.clearUserCache();
        console.log('UserContext: User API cache cleared');
      } catch (e) {
        console.error('UserContext: Failed to clear API cache:', e);
        
        // Attempt to clear all cache as a fallback
        try {
          api.clearCache();
          console.log('UserContext: All API cache cleared as fallback');
        } catch (fallbackErr) {
          console.error('UserContext: Failed to clear all API cache:', fallbackErr);
        }
      }
    }
  };

  return (
    <UserContext.Provider
      value={{
        userData,
        loading,
        error,
        updateUser,
        updateStyles,
        toggleFavorite,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Hook to use the user context
export const useUser = () => useContext(UserContext);

// Hook to directly get user data as the return value, with update methods as properties
export const useUserData = (): EnhancedUserData => {
  const context = useContext(UserContext);
  
  // Create a merged object that is both the user data AND has the methods
  const enhancedUserData: EnhancedUserData = {
    ...context.userData,
    updateUser: context.updateUser,
    updateStyles: context.updateStyles,
    toggleFavorite: context.toggleFavorite,
    logout: context.logout,
    loading: context.loading,
    error: context.error,
    // Special accessor to get the "clean" data without the methods
    _data: context.userData
  };
  
  return enhancedUserData;
};
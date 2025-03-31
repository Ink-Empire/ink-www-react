import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../utils/api';

// Define interfaces for our user data
interface UserData {
  id?: number;
  name?: string;
  email?: string;
  styles?: number[];
  phone?: string;
  location?: string;
  location_x?: number;
  location_y?: number;
  image?: string;
  profilePhoto?: {
    filepath?: string;
    webviewPath?: string;
  };
}

// Type for the enhanced user data returned by useUserData hook
interface EnhancedUserData extends UserData {
  updateUser: (data: Partial<UserData>) => Promise<void>;
  updateStyles: (styles: number[]) => Promise<void>;
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
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  userData: {},
  loading: false,
  error: null,
  updateUser: async () => {},
  updateStyles: async () => {},
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
      
      // First, check if we have cached userData in localStorage
      const cachedUserData = loadUserFromStorage();
      if (cachedUserData && cachedUserData.id) {
        // If we have cached data, use it initially
        setUserData(cachedUserData);
        // Still set loading to true to indicate we're refreshing in the background
        // but the UI can already use the cached data
      }
      
      // Set loading state only if we don't have cached data
      if (!cachedUserData || !cachedUserData.id) {
        setLoading(true);
      }
      
      try {
        // Use the /users/me endpoint to get the current user with cache enabled
        console.log('UserContext: Fetching user data from /api/users/me');
        const response = await api.get<{data: UserData}>('/users/me', { 
          requiresAuth: true,
          useCache: true,
          cacheTTL: 2 * 60 * 1000 // 2 minutes cache for user data
        });
        
        // If component unmounted during fetch, don't update state
        if (!isMounted) return;
        
        // Unwrap the user data from the nested 'data' object
        const userData = response.data || response;
        
        console.log('UserContext: User data received');
        
        if (userData) {
          setUserData(userData);
          saveUserToStorage(userData);
        }
      } catch (err) {
        // If component unmounted during fetch, don't update state
        if (!isMounted) return;
        
        console.log('UserContext: Failed to fetch from /api/users/me, falling back to stored user ID');
        
        // If we already set userData from cache, we don't need to show an error
        if (!cachedUserData || !cachedUserData.id) {
          // If /users/me fails and we have a user ID, try the specific user endpoint
          if (userId) {
            try {
              const response = await api.get<{ user: UserData }>(`/users/${userId}`, {
                useCache: true
              });
              if (response.user) {
                setUserData(response.user);
                saveUserToStorage(response.user);
              }
            } catch (userErr) {
              console.error('Error fetching user data', userErr);
              setError('Failed to load user data');
            }
          }
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
      // Replace with your actual API endpoint
      const response = await api.put<{ user: UserData }>(`/users/${userData.id}`, data);
      
      if (response.user) {
        setUserData(response.user);
        saveUserToStorage(response.user);
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

  // Logout user
  const logout = (): void => {
    setUserData({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(USER_ID_KEY);
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
    logout: context.logout,
    loading: context.loading,
    error: context.error,
    // Special accessor to get the "clean" data without the methods
    _data: context.userData
  };
  
  return enhancedUserData;
};